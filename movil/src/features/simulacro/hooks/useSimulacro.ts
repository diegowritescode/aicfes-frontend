import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Fallo } from '@/core/http/cliente';
import {
  calificarSimulacro,
  leerInventarioBanco,
  leerSimulacro,
  listarSimulacros,
  marcarPregunta,
  responderSimulacro,
} from '../api/peticiones';
import type { SimulacroEnCurso } from '../api/esquemas';
import type { Letra } from '@/shared/model/icfes';

/**
 * A sitting, as the screen sees it.
 *
 * In the web app this was nine useState and five useEffect inside one
 * component. Nearly all of it was server state pretending to be local
 * state: the questions, the answers, the clock. Here the sitting is one
 * query and the screen reads it.
 *
 * The one genuinely local piece is which question is on screen, and
 * that stays as useState because it is exactly that — local, and lost
 * on purpose when the screen closes.
 */

const CLAVE_SIMULACRO = (id: string) => ['simulacro', id] as const;
const CLAVE_LISTA = ['simulacro', 'lista'] as const;
const CLAVE_BANCO = ['banco', 'inventario'] as const;

export function useSimulacro(id: string | undefined) {
  const clienteConsultas = useQueryClient();

  const consulta = useQuery({
    queryKey: CLAVE_SIMULACRO(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const r = await leerSimulacro(id!);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    /* The clock moves, so a cached sitting is stale the moment it
       arrives. Refetching is how a learner who was away gets the real
       time left rather than the one from when they left. */
    staleTime: 0,
  });

  /* Coming back to the app re-reads the sitting. A phone spends most
     of a sitting in a pocket or behind another app, and the time that
     passed is real time: the first thing shown on return must be the
     server's clock, not the one this screen stopped counting. */
  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active' && id) void consulta.refetch();
    });
    return () => suscripcion.remove();
  }, [id, consulta]);

  return {
    simulacro: consulta.data ?? null,
    cargando: consulta.isPending,
    fallo: (consulta.error as Fallo | null) ?? null,
    recargar: consulta.refetch,
    invalidar: useCallback(
      () => clienteConsultas.invalidateQueries({ queryKey: CLAVE_SIMULACRO(id ?? '') }),
      [clienteConsultas, id],
    ),
  };
}

/**
 * Answering and flagging.
 *
 * Both write to the server and both paint immediately, because a
 * sitting where the option lights up half a second late feels broken.
 * The optimistic update is rolled back on failure rather than left to
 * drift: an answer the learner can see but the server never got is the
 * worst of both.
 */
export function useAccionesSimulacro(id: string) {
  const clienteConsultas = useQueryClient();
  const clave = CLAVE_SIMULACRO(id);

  /* Typed as Letra, not string: the cache holds what the schema
     promised, and widening it here would let an arbitrary value in
     through the optimistic path without ever meeting a schema. */
  const pintar = (orden: number, cambio: Partial<{ respuesta: Letra; marcada: boolean }>) => {
    clienteConsultas.setQueryData<SimulacroEnCurso>(clave, (previo) =>
      previo
        ? {
            ...previo,
            preguntas: previo.preguntas.map((p) =>
              p.orden === orden ? { ...p, ...cambio } : p,
            ),
          }
        : previo,
    );
  };

  const responder = useMutation<unknown, Fallo, { orden: number; respuesta: Letra }>({
    mutationFn: async ({ orden, respuesta }) => {
      const r = await responderSimulacro(id, orden, respuesta);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    onMutate: async ({ orden, respuesta }) => {
      await clienteConsultas.cancelQueries({ queryKey: clave });
      const previo = clienteConsultas.getQueryData<SimulacroEnCurso>(clave);
      pintar(orden, { respuesta });
      return { previo };
    },
    onError: (_fallo, _vars, contexto) => {
      const previo = (contexto as { previo?: SimulacroEnCurso } | undefined)?.previo;
      if (previo) clienteConsultas.setQueryData(clave, previo);
    },
    onSettled: () => clienteConsultas.invalidateQueries({ queryKey: clave }),
  });

  const marcar = useMutation<unknown, Fallo, { orden: number; marcada: boolean }>({
    mutationFn: async ({ orden, marcada }) => {
      const r = await marcarPregunta(id, orden, marcada);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    onMutate: async ({ orden, marcada }) => {
      await clienteConsultas.cancelQueries({ queryKey: clave });
      const previo = clienteConsultas.getQueryData<SimulacroEnCurso>(clave);
      pintar(orden, { marcada });
      return { previo };
    },
    onError: (_fallo, _vars, contexto) => {
      const previo = (contexto as { previo?: SimulacroEnCurso } | undefined)?.previo;
      if (previo) clienteConsultas.setQueryData(clave, previo);
    },
  });

  const calificar = useMutation<unknown, Fallo, void>({
    mutationFn: async () => {
      const r = await calificarSimulacro(id);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    onSuccess: () => {
      void clienteConsultas.invalidateQueries({ queryKey: clave });
      void clienteConsultas.invalidateQueries({ queryKey: CLAVE_LISTA });
    },
  });

  return { responder, marcar, calificar };
}

/**
 * The countdown, drawn here but owned by the server.
 *
 * Every read of the sitting resets it, and the ticks in between only
 * fill the gap. A timer that counted on its own would drift, and in a
 * backgrounded tab the browser throttles it — which is how the web app
 * handed out free minutes to anyone who minimised the window.
 */
export function useRelojSimulacro(segundosDelServidor: number | undefined) {
  const [segundos, setSegundos] = useState(segundosDelServidor ?? 0);

  useEffect(() => {
    if (segundosDelServidor === undefined) return;
    setSegundos(segundosDelServidor);
  }, [segundosDelServidor]);

  useEffect(() => {
    if (segundosDelServidor === undefined) return;
    const t = setInterval(() => setSegundos((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [segundosDelServidor]);

  return segundos;
}

export function useSimulacrosPrevios() {
  const consulta = useQuery({
    queryKey: CLAVE_LISTA,
    queryFn: async () => {
      const r = await listarSimulacros();
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
  });

  return {
    simulacros: consulta.data ?? [],
    enCurso: consulta.data?.find((s) => s.status === 'en_curso') ?? null,
    cargando: consulta.isPending,
  };
}

/**
 * How large a sitting the bank can fill.
 *
 * Null when unknown, which the screen reads as "offer everything": a
 * failed read should not empty the page.
 */
export function useCapacidadBanco() {
  const consulta = useQuery({
    queryKey: CLAVE_BANCO,
    queryFn: async () => {
      const r = await leerInventarioBanco();
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    staleTime: 5 * 60_000,
  });

  return {
    maximo: consulta.data?.simulacroMaximo ?? null,
    inventario: consulta.data ?? null,
  };
}
