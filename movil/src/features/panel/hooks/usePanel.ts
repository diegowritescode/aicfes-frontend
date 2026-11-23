import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Fallo } from '@/core/http/cliente';
import { leerDesgloseXp, leerErrorDelDia, leerLogros, leerPanel } from '../api/peticiones';
import {
  completarSesionEstudio,
  guardarRespuestas,
  iniciarSesionEstudio,
} from '@/shared/pregunta/api/peticiones';
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
   * Quiet on failure, because the learner has already seen whether
   * they got it right — that was decided locally from the payload. A
   * failed write costs a row in their history, not the answer they
   * just read.
   *
   * Quiet is not the same as never working, which is what this used
   * to be: it made up a `sessionId` like `error-del-dia-2026-11-23`,
   * and the server answered INVALID_SESSION to every single one. So
   * no answer to the question of the day was ever recorded — the area
   * never moved, and the card never went away, because both are
   * computed from answers that were never stored.
   *
   * A session is opened for real now. It costs one request on a
   * screen the learner is already on, and it is what makes the
   * question count.
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
      const sesion = await iniciarSesionEstudio({
        mode: 'test',
        area: pregunta.area,
      });
      if (!sesion.ok) throw sesion.fallo;

      const guardado = await guardarRespuestas([
        {
          sessionId: sesion.datos.sessionId,
          questionIndex: 0,
          area: pregunta.area,
          dificultad: 'media',
          selectedAnswer: elegida,
          isCorrect: acerto,
          itemId: pregunta.itemId,
        },
      ]);
      if (!guardado.ok) throw guardado.fallo;

      /* Closing it is what awards the time XP and lets the day count
         toward the streak. One question is a short session and that is
         honest: it was one question. */
      await completarSesionEstudio(sesion.datos.sessionId, {
        durationSeconds: 60,
        totalQuestions: 1,
        correctQuestions: acerto ? 1 : 0,
        areaBreakdown: { [pregunta.area]: { correct: acerto ? 1 : 0, total: 1 } },
      });
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

/**
 * Where the XP came from.
 *
 * Fails quietly, like the achievements: this explains a number the
 * panel already showed, so losing it should cost the explanation and
 * not the number.
 *
 * Ten minutes, because it only moves when a session ends.
 */
export function useDesgloseXp() {
  const consulta = useQuery({
    queryKey: ['xp-desglose'],
    queryFn: async () => {
      const r = await leerDesgloseXp();
      return r.ok ? r.datos : null;
    },
    staleTime: 10 * 60_000,
    retry: 1,
  });

  return { desglose: consulta.data ?? null, cargando: consulta.isPending };
}
