import { z } from 'zod';
import { pedir } from '@/core/http/cliente';
import type { Area, Dificultad } from '@/shared/model/icfes';
import {
  itemGenerado,
  respuestasGuardadas,
  sesionCompletada,
  sesionIniciada,
} from './esquemas';

/**
 * The training calls.
 *
 * Generating items costs money and takes minutes, which is why it is
 * metered server-side and why a failure here has to be legible: the
 * client turns a 429 into `sin_cuota`, and the screen says when it
 * resets rather than failing blankly.
 */

export function generarItems(params: {
  area: Area;
  dificultad: Dificultad;
  n: number;
  tema?: string;
}) {
  return pedir({
    ruta: '/api/items/generate',
    metodo: 'POST',
    cuerpo: params,
    esquema: z.array(itemGenerado),
  });
}

export function generarMixto(secciones: Array<{ area: Area; dificultad: Dificultad; n: number }>) {
  return pedir({
    ruta: '/api/items/generate-mixed',
    metodo: 'POST',
    cuerpo: { sections: secciones },
    esquema: z.array(itemGenerado),
  });
}

/* `startedAt` is required and is the client's clock: the server uses
   it to measure how long the session really took, and omitting it
   fails validation rather than defaulting to now. */
export function iniciarSesionEstudio(params: {
  mode: string;
  area: Area | 'MIXTO';
  modeId?: string;
}) {
  return pedir({
    ruta: '/api/study-sessions/start',
    metodo: 'POST',
    cuerpo: { ...params, startedAt: new Date().toISOString() },
    esquema: sesionIniciada,
  });
}

export function completarSesionEstudio(
  sessionId: string,
  resumen: {
    durationSeconds: number;
    totalQuestions: number;
    correctQuestions: number;
    areaBreakdown: Record<string, { correct: number; total: number }>;
  },
) {
  return pedir({
    ruta: `/api/study-sessions/${sessionId}/complete`,
    metodo: 'POST',
    cuerpo: { ...resumen, endedAt: new Date().toISOString() },
    esquema: sesionCompletada,
  });
}

/**
 * The answers themselves, which feed the weakness profile.
 *
 * The payload is a bare array, not an object wrapping one — checked
 * against the server, because the old client's shape was rejected.
 * Without `itemId` an answer cannot be joined back to the question's
 * topic, which is everything the profile needs.
 */
export function guardarRespuestas(
  respuestas: Array<{
    sessionId: string;
    questionIndex: number;
    area: Area;
    dificultad: Dificultad;
    selectedAnswer: string | null;
    isCorrect: boolean;
    itemId?: string;
    tiempoMs?: number;
  }>,
) {
  return pedir({
    ruta: '/api/answers',
    metodo: 'POST',
    cuerpo: respuestas,
    esquema: respuestasGuardadas,
  });
}
