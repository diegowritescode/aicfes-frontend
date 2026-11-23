import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Fallo } from '@/core/http/cliente';
import { leerErrorDelDia, leerLogros, leerPanel } from '../api/peticiones';
import { guardarRespuestas } from '@/shared/pregunta/api/peticiones';
import type { ErrorDelDia } from '../api/esquemas';

/**
 * The dashboard.
 *
 * Two queries rather than one, because the error of the day is the
 * least important thing on the screen and must not be able to take
 * the rest of it down. Its failure renders nothing at all; the panel's
 * failure is worth saying out loud.
 */

export function usePanel() {
  const consulta = useQuery({
    queryKey: ['panel'],
    queryFn: async () => {
      const r = await leerPanel();
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    /* A minute is long enough that opening and closing the app does
       not refetch, and short enough that finishing a session and
       coming back shows the new XP. */
    staleTime: 60_000,
  });

  return {
    panel: consulta.data ?? null,
    cargando: consulta.isPending,
    fallo: (consulta.error as Fallo | null) ?? null,
    recargar: consulta.refetch,
  };
}

export function useErrorDelDia() {
  const consulta = useQuery({
    queryKey: ['error-del-dia'],
    queryFn: async () => {
      const r = await leerErrorDelDia();
      // Null is a real answer here: no honest question to show.
      return r.ok ? r.datos : null;
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const clienteConsultas = useQueryClient();

  /**
   * Record the attempt.
   *
   * Fire-and-forget on purpose: the learner has already seen whether
   * they got it right, because that was decided locally from the
   * payload. A failed write costs them a row in their history, not
   * the answer they just read — so it must not produce an error
   * message over a question they already finished.
   */
  const registrar = useMutation({
    mutationFn: async ({
      elegida,
      acerto,
      pregunta,
    }: {
      elegida: string;
      acerto: boolean;
      pregunta: NonNullable<ErrorDelDia>;
    }) => {
      await guardarRespuestas([
        {
          sessionId: `error-del-dia-${new Date().toISOString().slice(0, 10)}`,
          questionIndex: 0,
          area: pregunta.area,
          dificultad: 'media',
          selectedAnswer: elegida,
          isCorrect: acerto,
          itemId: pregunta.itemId,
        },
      ]);
    },
    onSuccess: () => {
      /* The dashboard counts this answer, and the card is done for
         today once it was right. Both come from the server, so both
         get re-read rather than guessed at here. */
      void clienteConsultas.invalidateQueries({ queryKey: ['panel'] });
      void clienteConsultas.invalidateQueries({ queryKey: ['error-del-dia'] });
    },
  });

  return { pregunta: consulta.data ?? null, cargando: consulta.isPending, registrar };
}

/**
 * Achievements, with their progress.
 *
 * Fails quietly, like the card: encouragement that cannot load is
 * better absent than announced as broken. The progress is computed
 * server-side, because the rule that decides what counts as a day of
 * study lives there and must not be duplicated here.
 *
 * Ten minutes: these move after a finished session, not during one.
 */
export function useLogros() {
  const consulta = useQuery({
    queryKey: ['logros'],
    queryFn: async () => {
      const r = await leerLogros();
      return r.ok ? r.datos : null;
    },
    staleTime: 10 * 60_000,
    retry: 1,
  });

  return {
    logros: consulta.data ?? null,
    cargando: consulta.isPending,
  };
}
