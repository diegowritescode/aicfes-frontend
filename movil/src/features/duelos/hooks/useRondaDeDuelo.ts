import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Fallo } from '@/core/http/cliente';
import { entregarDuelo, leerPreguntasDeDuelo } from '../api/peticiones';
import type { EntregaHecha, MarcaDelRival, PreguntaDeDuelo } from '../api/esquemas';
import { useSonido } from './useSonido';
import {
  avance,
  avanzar,
  eleccionActual,
  esUltima,
  preguntaActual,
  responder,
  sinResponder,
  type Ronda,
} from '../model/ronda';

/**
 * Playing one's own round of a duel.
 *
 * The questions are **frozen** the first time they arrive. This is the
 * fix for a bug that has already shipped twice in this app: a list
 * reload brought new object identities mid-answer and the options
 * reshuffled *after* the learner had chosen. In a duel that would be
 * worse than confusing — both players are scored on the same five
 * questions.
 *
 * Elapsed time is measured from when the questions were frozen, not
 * from when the duel was accepted: a learner who accepts at noon and
 * plays at night did not take nine hours.
 */
export function useRondaDeDuelo(dueloId: string) {
  const cliente = useQueryClient();

  const consulta = useQuery({
    queryKey: ['duelos', 'preguntas', dueloId],
    queryFn: async () => {
      const r = await leerPreguntasDeDuelo(dueloId);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    /* Fetched once and never refetched while playing. A refetch
       mid-round is the bug this hook exists to prevent. */
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const [congeladas, setCongeladas] = useState<readonly PreguntaDeDuelo[] | null>(null);
  /* Frozen with the questions. The mark cannot change mid-round — the
     rival either played before this round opened or they did not — and
     re-reading it from `consulta.data` would make the line above the
     question flicker if anything ever refetched. */
  const [marca, setMarca] = useState<MarcaDelRival | null>(null);
  const [ronda, setRonda] = useState<Ronda | null>(null);
  const inicio = useRef<number | null>(null);
  const [entrega, setEntrega] = useState<EntregaHecha | null>(null);
  const [entregando, setEntregando] = useState(false);
  const [falloAlEntregar, setFalloAlEntregar] = useState<Fallo | null>(null);

  /* The clock. Ticks once a second rather than on every frame: this
     renders the question above it, and sixty re-renders a second of a
     screen a learner is reading is the kind of thing that empties a
     battery during a round. */
  const [segundos, setSegundos] = useState(0);

  const { activo: sonidoActivo, sonar, alternar: alternarSonido } = useSonido();

  useEffect(() => {
    if (congeladas !== null) return;
    const llegaron = consulta.data;
    if (!llegaron || llegaron.preguntas.length === 0) return;

    setCongeladas(llegaron.preguntas);
    setMarca(llegaron.marcaDelRival);
    setRonda({
      preguntas: llegaron.preguntas.map((p) => ({ id: p.id })),
      indice: 0,
      respuestas: [],
    });
    inicio.current = Date.now();
  }, [consulta.data, congeladas]);

  /* Runs from the freeze and stops at delivery. Derived from the
     wall clock rather than counted up, so a round that was
     backgrounded does not report less time than it took — the server
     is told the same number it shows here. */
  useEffect(() => {
    if (inicio.current === null || entrega) return;

    const id = setInterval(() => {
      if (inicio.current === null) return;
      setSegundos(Math.max(0, Math.round((Date.now() - inicio.current) / 1000)));
    }, 1000);

    return () => clearInterval(id);
  }, [congeladas, entrega]);

  /**
   * Choosing an option.
   *
   * The sound here cannot be «right» or «wrong», and that is
   * deliberate: the correct answer does not travel to the phone, or a
   * duel would be won by whoever reads the HTTP response. So this is a
   * tick that confirms the tap landed, and right against wrong is
   * heard at the end, when the server has said which was which.
   *
   * Which rules out the obvious version of this feature — a ding per
   * correct answer during the round. It would need the answers on the
   * device, and no amount of game feel is worth a duel decided by a
   * debugger.
   */
  const elegir = useCallback(
    (letra: string) => {
      setRonda((actual) => (actual ? responder(actual, letra) : actual));
      sonar('acierto');
    },
    [sonar],
  );

  const siguiente = useCallback(() => {
    setRonda((actual) => (actual ? avanzar(actual) : actual));
  }, []);

  /**
   * Sends the round.
   *
   * Seconds are computed here from the frozen start, and the server
   * caps them. Time only breaks ties in a duel, so a client that lied
   * about it could win a tiebreak and never a duel.
   */
  const entregar = useCallback(async () => {
    if (!ronda || entregando) return null;

    setEntregando(true);
    setFalloAlEntregar(null);
    try {
      const transcurrido = inicio.current
        ? Math.max(0, Math.round((Date.now() - inicio.current) / 1000))
        : 0;

      const r = await entregarDuelo({
        id: dueloId,
        respuestas: ronda.respuestas,
        segundos: transcurrido,
      });

      if (!r.ok) {
        setFalloAlEntregar(r.fallo);
        return null;
      }

      setEntrega(r.datos);

      /* Win and loss sound different, and waiting sounds like nothing.
         A learner who finishes first has not won anything yet, and a
         victory tone there would be a promise the duel might break. */
      if (r.datos.estado === 'terminado') {
        sonar(r.datos.gane ? 'victoria' : 'derrota');
      }

      /* The duel's state changed on the server — to `terminado` if the
         rival had already played. The list has to be refetched rather
         than patched, because only the server knows which. */
      void cliente.invalidateQueries({ queryKey: ['duelos', 'mios'] });
      return r.datos;
    } finally {
      setEntregando(false);
    }
  }, [ronda, dueloId, entregando, cliente, sonar]);

  const actual = ronda ? preguntaActual(ronda) : null;
  const pregunta = actual ? (congeladas?.find((p) => p.id === actual.id) ?? null) : null;

  return {
    pregunta,
    total: congeladas?.length ?? 0,
    numero: ronda ? ronda.indice + 1 : 0,
    eleccion: ronda ? eleccionActual(ronda) : null,
    esUltima: ronda ? esUltima(ronda) : false,
    sinResponder: ronda ? sinResponder(ronda) : 0,
    avance: ronda ? avance(ronda) : 0,
    cargando: consulta.isLoading || (consulta.isSuccess && congeladas === null),
    fallo: (consulta.error as Fallo | null) ?? null,
    elegir,
    siguiente,
    entregar,
    entregando,
    falloAlEntregar,
    entrega,
    /* The pressure. `marca` is null for whoever opens the duel first,
       which the screen renders as «nobody has played yet» and never as
       a rival who scored nothing. */
    marca,
    segundos,
    respondidas: ronda ? ronda.respuestas.length : 0,
    sonidoActivo,
    alternarSonido,
  };
}
