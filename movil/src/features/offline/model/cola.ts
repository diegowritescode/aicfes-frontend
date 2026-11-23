import type { Area, Dificultad, Letra } from '@/shared/model/icfes';

/**
 * Work done without a connection, waiting to reach the server.
 *
 * A toll block answered on a phone with no data has to count. Without
 * this the learner clears a block, their streak does not move, and the
 * app silently disagrees with what they just did — which is worse than
 * not having the feature.
 *
 * Pure, because the ordering and retry rules are the part worth
 * testing: a queue that drops work, or replays it twice, is wrong in a
 * way nobody notices until a learner's XP is off.
 */

export interface RespuestaPendiente {
  readonly itemId: string;
  readonly questionIndex: number;
  readonly area: Area;
  readonly dificultad: Dificultad;
  readonly elegida: Letra | null;
  readonly correcta: boolean;
  readonly tiempoMs: number;
}

export interface BloquePendiente {
  /** Local id. The server's session id does not exist yet. */
  readonly id: string;
  /** When the learner actually did this, not when we managed to send
      it. The server takes `startedAt` from us, so a block replayed
      three days later still lands on the day it happened — which is
      what the streak counts. */
  readonly empezadoEn: string;
  readonly terminadoEn: string;
  readonly respuestas: readonly RespuestaPendiente[];
  /** How many times sending this has failed. */
  readonly intentos: number;
}

export interface Cola {
  readonly bloques: readonly BloquePendiente[];
}

export const COLA_VACIA: Cola = { bloques: [] };

/* Past this many failures a block is given up on. Not infinite: a
   block the server keeps rejecting — a deleted item, a shape it no
   longer accepts — would otherwise be retried forever and block
   everything behind it. */
const INTENTOS_MAXIMOS = 5;

/* And a cap on the queue itself. A learner offline for a week should
   not accumulate work that takes minutes to drain, and the oldest
   blocks are the least valuable: their questions are already answered
   and their day has passed. */
const BLOQUES_MAXIMOS = 50;

export function encolar(cola: Cola, bloque: BloquePendiente): Cola {
  const bloques = [...cola.bloques, bloque];
  /* Drops from the front, keeping the most recent. Losing a week-old
     block costs a day on a streak that is already broken; losing
     today's costs the session the learner just finished. */
  return { bloques: bloques.slice(-BLOQUES_MAXIMOS) };
}

/** The next block to send. Oldest first, so days arrive in order. */
export function siguiente(cola: Cola): BloquePendiente | null {
  const vivos = cola.bloques.filter((b) => b.intentos < INTENTOS_MAXIMOS);
  return vivos[0] ?? null;
}

export function quitar(cola: Cola, id: string): Cola {
  return { bloques: cola.bloques.filter((b) => b.id !== id) };
}

/** Record a failure, so a block that cannot be sent eventually stops. */
export function marcarFallo(cola: Cola, id: string): Cola {
  return {
    bloques: cola.bloques.map((b) =>
      b.id === id ? { ...b, intentos: b.intentos + 1 } : b,
    ),
  };
}

/** Blocks that failed too often. Surfaced rather than deleted quietly:
    work the learner did and we lost is worth admitting to. */
export function abandonados(cola: Cola): BloquePendiente[] {
  return cola.bloques.filter((b) => b.intentos >= INTENTOS_MAXIMOS);
}

export function pendientes(cola: Cola): number {
  return cola.bloques.filter((b) => b.intentos < INTENTOS_MAXIMOS).length;
}

/** The summary `complete` wants, computed from the answers we have. */
export function resumirBloque(bloque: BloquePendiente): {
  durationSeconds: number;
  totalQuestions: number;
  correctQuestions: number;
  areaBreakdown: Record<string, { correct: number; total: number }>;
} {
  const porArea: Record<string, { correct: number; total: number }> = {};
  for (const r of bloque.respuestas) {
    const fila = (porArea[r.area] ??= { correct: 0, total: 0 });
    fila.total += 1;
    if (r.correcta) fila.correct += 1;
  }

  /* Duration from the learner's own timestamps rather than from the
     sum of per-question times: the gap between questions is study
     time too, and the server validates duration against the two
     timestamps we send. */
  const inicio = new Date(bloque.empezadoEn).getTime();
  const fin = new Date(bloque.terminadoEn).getTime();
  const bruto = Math.round((fin - inicio) / 1000);

  return {
    /* Never negative, and never zero for a block with answers: a clock
       that moved backwards between the two reads would otherwise fail
       the server's `min(0)` or report a session that took no time. */
    durationSeconds: Number.isFinite(bruto) && bruto > 0 ? bruto : bloque.respuestas.length,
    totalQuestions: bloque.respuestas.length,
    correctQuestions: bloque.respuestas.filter((r) => r.correcta).length,
    areaBreakdown: porArea,
  };
}
