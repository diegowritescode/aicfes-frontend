import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { Fallo } from '@/core/http/cliente';
import type { Letra } from '@/shared/model/icfes';
import type { ItemGenerado } from '@/shared/pregunta/api/esquemas';
import {
  completarSesionEstudio,
  guardarRespuestas,
} from '@/shared/pregunta/api/peticiones';
import {
  esCorrecta,
  resumirExamen,
  type RespuestaDada,
} from '@/shared/pregunta/model/reglas';
import { iniciarContrarreloj, leerModos, type PedidoDeRonda } from '../api/peticiones';

/**
 * The ladder of modes, and the clock.
 *
 * The clock here is honestly local: unlike a sitting, a time trial is
 * one screen that does not survive leaving, so there is no server
 * state to drift from. What it must not do is keep counting while the
 * app is in the background — a phone that rings mid-run should not
 * eat the learner's remaining time.
 */

export function useModosContrarreloj() {
  const consulta = useQuery({
    queryKey: ['contrarreloj', 'modos'],
    queryFn: async () => {
      const r = await leerModos();
      if (!r.ok) throw r.fallo;
      return r.datos.filter((m) => m.enabled).sort((a, b) => a.nivel - b.nivel);
    },
    staleTime: 10 * 60_000,
  });

  return {
    modos: consulta.data ?? [],
    cargando: consulta.isPending,
    fallo: (consulta.error as Fallo | null) ?? null,
  };
}

export function useCuentaRegresiva(segundosIniciales: number | null, alAcabarse: () => void) {
  const [segundos, setSegundos] = useState(segundosIniciales ?? 0);

  useEffect(() => {
    if (segundosIniciales === null) return;
    setSegundos(segundosIniciales);
  }, [segundosIniciales]);

  useEffect(() => {
    if (segundosIniciales === null) return;
    const t = setInterval(() => {
      setSegundos((s) => {
        if (s <= 1) {
          clearInterval(t);
          alAcabarse();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [segundosIniciales, alAcabarse]);

  return segundos;
}

/**
 * One run against the clock.
 *
 * The answers are saved as they go rather than at the end, because the
 * end may never arrive: the clock runs out, the phone rings, the app
 * is killed. A run that recorded nothing because it was not finished
 * would be the common case, not the edge one.
 */
export function useContrarrelojRun() {
  const [items, setItems] = useState<ItemGenerado[]>([]);
  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState<RespuestaDada[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [limite, setLimite] = useState<number | null>(null);
  const [estado, setEstado] = useState<'eligiendo' | 'corriendo' | 'terminado'>('eligiendo');
  const [seAcaboElTiempo, setSeAcaboElTiempo] = useState(false);
  const inicioRef = useRef<Date | null>(null);
  const inicioPreguntaRef = useRef<number>(Date.now());

  const terminar = useCallback(
    (porTiempo = false) => {
      setSeAcaboElTiempo(porTiempo);
      setEstado('terminado');
      setLimite(null);
    },
    [],
  );

  const segundos = useCuentaRegresiva(
    estado === 'corriendo' ? limite : null,
    useCallback(() => terminar(true), [terminar]),
  );

  /* Takes a request rather than a mode id, so a round can be aimed at
     one topic. The plan's «practicar esto» is the caller that needs
     it; the mode list still passes `{ modeId }` and is unchanged. */
  const empezar = useMutation<
    { items: ItemGenerado[]; sessionId: string; segundos: number },
    Fallo,
    PedidoDeRonda
  >({
    mutationFn: async (pedido) => {
      const r = await iniciarContrarreloj(pedido);
      if (!r.ok) throw r.fallo;
      return {
        items: r.datos.items,
        sessionId: r.datos.sessionId,
        segundos: r.datos.timeLimitSeconds,
      };
    },
    onSuccess: ({ items: nuevos, sessionId: id, segundos: limiteSegundos }) => {
      setItems(nuevos);
      setSessionId(id);
      setIndice(0);
      setRespuestas([]);
      setSeAcaboElTiempo(false);
      inicioRef.current = new Date();
      inicioPreguntaRef.current = Date.now();
      setLimite(limiteSegundos);
      setEstado('corriendo');
    },
  });

  const responder = useCallback(
    (elegida: Letra) => {
      const item = items[indice];
      if (!item || !sessionId) return;

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

      const actualizadas = [...respuestas, registro];
      setRespuestas(actualizadas);
      inicioPreguntaRef.current = Date.now();

      /* Saved as we go. Waiting for the end would lose every run that
         the clock, a phone call or a killed app cut short — which is
         most of them. */
      void guardarRespuestas([
        {
          sessionId,
          questionIndex: registro.questionIndex,
          area: registro.area,
          dificultad: registro.dificultad,
          selectedAnswer: registro.selectedAnswer,
          isCorrect: registro.isCorrect,
          itemId: registro.itemId,
          tiempoMs: registro.tiempoMs,
        },
      ]);

      if (indice >= items.length - 1) {
        const resumen = resumirExamen(actualizadas, inicioRef.current);
        void completarSesionEstudio(sessionId, {
          durationSeconds: resumen.segundos,
          totalQuestions: resumen.total,
          correctQuestions: resumen.correctas,
          areaBreakdown: resumen.porArea,
        });
        terminar(false);
        return;
      }
      setIndice((i) => i + 1);
    },
    [items, indice, respuestas, sessionId, terminar],
  );

  return {
    estado,
    items,
    indice,
    item: items[indice] ?? null,
    segundos,
    respondidas: respuestas.length,
    correctas: respuestas.filter((r) => r.isCorrect).length,
    /* The run itself, not just its score. Everything needed to say
       WHICH ones went wrong and on what topic was already here and
       was thrown away when the screen unmounted: the end screen
       showed «3 de 5 correctas» and nothing else, so a learner
       finished a round knowing the number and not one of the
       questions. */
    respuestas,
    seAcaboElTiempo,
    empezar,
    responder,
    terminar,
    fallo: (empezar.error as Fallo | null) ?? null,
  };
}
