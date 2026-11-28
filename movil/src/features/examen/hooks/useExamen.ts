import { useCallback, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { Fallo } from '@/core/http/cliente';
import type { Area, Dificultad, Letra } from '@/shared/model/icfes';
import {
  completarSesionEstudio,
  generarItems,
  pedirDelBanco,
  generarMixto,
  guardarRespuestas,
  iniciarSesionEstudio,
} from '@/shared/pregunta/api/peticiones';
import type { ItemGenerado } from '@/shared/pregunta/api/esquemas';
import { esCorrecta, resumirExamen, type RespuestaDada } from '@/shared/pregunta/model/reglas';
import { repartirMixto } from '../model/mixto';
import { areaDeSesion } from '@/shared/pregunta/model/areaDeSesion';

/**
 * A training run from start to saved.
 *
 * The web version spread this across Test.tsx (ten useEffect) and
 * Results.tsx (seven), and the seams between them is where answers got
 * lost: Results decided whether to save, and gave up when a start time
 * was missing. Here the run owns its own answers and saves them itself,
 * so there is no handoff to drop them in.
 *
 * What is local state here really is local: which question is showing,
 * what has been answered so far. The questions come from a mutation
 * rather than a query because generating them is an action with a
 * cost, not a read that can be retried freely.
 */

export type EstadoExamen = 'preparando' | 'respondiendo' | 'terminado';

export function useExamen() {
  const [items, setItems] = useState<ItemGenerado[]>([]);
  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState<RespuestaDada[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoExamen>('preparando');

  /* Refs, not state: nothing renders from them, and a re-render in
     the middle of a question must not reset when it started. */
  const inicioRef = useRef<Date | null>(null);
  const inicioPreguntaRef = useRef<number>(Date.now());

  const preparar = useMutation<
    { items: ItemGenerado[]; sessionId: string | null },
    Fallo,
    { area: Area | 'MIXTO'; dificultad: Dificultad; n: number; modo?: string }
  >({
    mutationFn: async ({ area, dificultad, n, modo = 'generacion_libre' }) => {
      /* Mixed practice splits the request across the five areas at
         roughly the exam's own weights, which is the whole point of
         practising mixed rather than one area at a time. */
      /* The bank first. Generating takes minutes and costs money, and
         the bank already holds hundreds of verified questions — a
         learner who waits three minutes for something that already
         existed is waiting for nothing.

         It also rescues an interrupted session: what was generated is
         saved to the bank before the request returns, so questions
         paid for yesterday come back from here instead of being
         generated again. */
      const delBanco = await pedirDelBanco({ total: n });
      const listas = delBanco.ok ? delBanco.datos : [];
      const faltan = n - listas.length;

      /* Mixed practice splits the request across the five areas at
         roughly the exam's own weights, which is the whole point of
         practising mixed rather than one area at a time. */
      const generados =
        faltan <= 0
          ? null
          : area === 'MIXTO'
            ? await generarMixto(repartirMixto(faltan, dificultad))
            : await generarItems({ area, dificultad, n: faltan });

      /* A generation failure with questions already in hand is not a
         failure: fifteen is a session, and refusing it over the
         missing ten would be the wrong trade. */
      if (generados && !generados.ok && listas.length === 0) throw generados.fallo;

      const items = [...listas, ...(generados?.ok ? generados.datos : [])];

      /* The session is opened after the items exist. Opening it first
         would record a session for a request that then failed on
         quota, which inflates every streak and average built on it. */
      /* `MIXTO` is not one of the five areas the server accepts, so
         passing it through meant every mixed run failed to open a
         session — silently, since nothing read the result. Verified
         against production: it answers VALIDATION_ERROR. */
      const sesion = await iniciarSesionEstudio({
        mode: modo,
        /* From every item in the run, bank and generated alike: the
           session is filed under the area it drew most from. */
        area: areaDeSesion(area, items),
      });

      return {
        items,
        sessionId: sesion.ok ? sesion.datos.sessionId : null,
      };
    },
    onSuccess: ({ items: nuevos, sessionId: id }) => {
      setItems(nuevos);
      setSessionId(id);
      setIndice(0);
      setRespuestas([]);
      inicioRef.current = new Date();
      inicioPreguntaRef.current = Date.now();
      setEstado('respondiendo');
    },
  });

  const responder = useCallback(
    (elegida: Letra) => {
      const item = items[indice];
      if (!item) return null;

      const registro: RespuestaDada = {
        questionIndex: indice,
        itemId: item.id,
        area: item.area,
        dificultad: item.dificultad,
        selectedAnswer: elegida,
        isCorrect: esCorrecta(item, elegida),
        tiempoMs: Date.now() - inicioPreguntaRef.current,
        answeredAt: new Date().toISOString(),
      };

      /* The first answer is what gets recorded, even if they retry
         after the tutoring. What they knew before the explanation is
         the honest measure; overwriting it would make the weakness
         profile read better than the learner. */
      setRespuestas((previas) =>
        previas.some((r) => r.questionIndex === indice) ? previas : [...previas, registro],
      );

      return registro;
    },
    [items, indice],
  );

  const avanzar = useCallback(() => {
    inicioPreguntaRef.current = Date.now();
    setIndice((i) => Math.min(i + 1, items.length - 1));
  }, [items.length]);

  /** The run is over: the screen asks for this, rather than inferring it. */
  const terminar = useCallback(() => setEstado('terminado'), []);

  /** Back to the same question, options live again. */
  const reintentar = useCallback(() => {
    inicioPreguntaRef.current = Date.now();
  }, []);

  /**
   * Saves the run.
   *
   * Answers first, then the session summary: the answers are what
   * feeds the weakness profile, and losing them to a failure while
   * writing a duration would be the expensive half of the trade.
   */
  const guardar = useMutation<{ guardadas: boolean }, Fallo, void>({
    mutationFn: async () => {
      if (!sessionId || respuestas.length === 0) return { guardadas: false };

      const resumen = resumirExamen(respuestas, inicioRef.current);

      const r = await guardarRespuestas(
        respuestas.map((a) => ({
          sessionId,
          questionIndex: a.questionIndex,
          area: a.area,
          dificultad: a.dificultad,
          selectedAnswer: a.selectedAnswer,
          isCorrect: a.isCorrect,
          itemId: a.itemId,
          tiempoMs: a.tiempoMs,
        })),
      );
      if (!r.ok) throw r.fallo;

      await completarSesionEstudio(sessionId, {
        durationSeconds: resumen.segundos,
        totalQuestions: resumen.total,
        correctQuestions: resumen.correctas,
        areaBreakdown: resumen.porArea,
      });

      return { guardadas: true };
    },
  });

  return {
    estado,
    items,
    indice,
    item: items[indice] ?? null,
    respuestas,
    sessionId,
    resumen: () => resumirExamen(respuestas, inicioRef.current),
    preparar,
    responder,
    avanzar,
    terminar,
    reintentar,
    guardar,
    esUltima: indice >= items.length - 1,
  };
}
