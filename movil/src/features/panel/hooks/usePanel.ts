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
      /* Null IS a real answer here — «no honest question to show
         today» — which is why this one looked fine. The bug is that
         a failed request produced the same null and got cached as
         that answer for five minutes.

         So: a successful null stays null, and a failure throws.
         The dashboard still shows nothing either way, because the
         card renders on data alone; what changes is that the
         failure retries instead of being remembered as «no hay
         pregunta hoy». */
      if (!r.ok) throw r.fallo;
      return r.datos;
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
      /* Throws rather than returning null on failure.
         Returning null cached the failure AS A SUCCESS for the full
         ten minutes, and the screen cannot tell «no achievements
         yet» from «this did not load» — so `/logros` showed
         «Todavía no hay logros» to somebody with three of them, and
         kept showing it for ten minutes. Quiet failure was the right
         call when this was one section among eight on «Yo»; it stops
         being right once the list has a screen of its own. */
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    staleTime: 10 * 60_000,
    retry: 1,
  });

  return {
    logros: consulta.data ?? null,
    cargando: consulta.isPending,
    /* Exposed so a screen can say «no pudimos cargar» instead of
       «no hay». Callers that ignore it behave exactly as before. */
    fallo: (consulta.error as Fallo | null) ?? null,
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
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    staleTime: 10 * 60_000,
    retry: 1,
  });

  /* This one still fails quietly on screen, and that is still
     right: it explains a number shown beside it, so losing it costs
     the explanation and not the number. What changed is that the
     failure is no longer cached as a success — a ten-minute hole
     after one bad request was the actual bug. */
  return {
    desglose: consulta.data ?? null,
    cargando: consulta.isPending,
    fallo: (consulta.error as Fallo | null) ?? null,
  };
}
