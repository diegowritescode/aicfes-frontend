import type { Letra } from '@/shared/model/icfes';
import type { PreguntaDelLote } from '../api/esquemas';
import type { IntentoDelPeaje } from './peaje';

/**
 * A block in progress, saved so that leaving does not undo it.
 *
 * Without this the toll is not a toll. A learner on question 2 of 5
 * could press back, reopen the app, and start again at zero — which
 * is not an escape hatch, it is the absence of a door. Whatever is
 * answered stays answered.
 *
 * Kept on the device rather than the server on purpose: the toll has
 * to work with no connection (the median Colombian prepaid line
 * carries about 8.2 GB a month and runs out late in the month, every
 * month), and a block that cannot resume offline fails exactly when
 * data has.
 */

/** Questions a block asks. */
export const PREGUNTAS_POR_BLOQUE = 5;

export interface SesionGuardada {
  /** The questions of this block, frozen when it started. */
  readonly preguntas: readonly PreguntaDelLote[];
  readonly intentos: readonly IntentoDelPeaje[];
  readonly avanzadas: number;
  /** ISO 8601. When this block was started. */
  readonly empezadaEn: string;
}

/**
 * How long an abandoned block stays resumable.
 *
 * Long enough that leaving and coming back an hour later keeps the
 * progress, short enough that yesterday's two answered questions do
 * not count toward today's block. A toll that can be paid in
 * instalments across days is one a learner games by answering one
 * question a day.
 */
export const HORAS_PARA_RETOMAR = 6;

export function sesionVencida(
  sesion: SesionGuardada,
  ahora: Date = new Date(),
): boolean {
  const empezada = new Date(sesion.empezadaEn).getTime();
  /* An unparseable date is treated as expired rather than as fresh:
     the failure that starts a new block is recoverable, the one that
     resumes a corrupt block is not. */
  if (!Number.isFinite(empezada)) return true;
  return ahora.getTime() - empezada > HORAS_PARA_RETOMAR * 3_600_000;
}

export function sesionUtilizable(
  sesion: SesionGuardada | null,
  ahora: Date = new Date(),
): boolean {
  if (!sesion) return false;
  if (sesion.preguntas.length === 0) return false;
  /* A finished block is not resumable: it was already paid, and
     resuming it would hand out a second unlock for no work. */
  if (sesion.avanzadas >= sesion.preguntas.length) return false;
  return !sesionVencida(sesion, ahora);
}

export function empezarSesion(
  preguntas: readonly PreguntaDelLote[],
  ahora: Date = new Date(),
): SesionGuardada {
  return {
    preguntas,
    intentos: [],
    avanzadas: 0,
    empezadaEn: ahora.toISOString(),
  };
}

/** Records an answer. Replaces any earlier one for the same question. */
export function registrarIntento(
  sesion: SesionGuardada,
  intento: IntentoDelPeaje,
): SesionGuardada {
  const sinEsta = sesion.intentos.filter((i) => i.itemId !== intento.itemId);
  return { ...sesion, intentos: [...sinEsta, intento] };
}

export function avanzarSesion(sesion: SesionGuardada): SesionGuardada {
  if (sesion.avanzadas >= sesion.preguntas.length) return sesion;
  return { ...sesion, avanzadas: sesion.avanzadas + 1 };
}

/** How far along a resumed block is, for the screen to say so. */
export function progreso(sesion: SesionGuardada): {
  readonly hechas: number;
  readonly total: number;
  readonly retomada: boolean;
} {
  return {
    hechas: sesion.avanzadas,
    total: sesion.preguntas.length,
    /* Worth saying out loud when it is true. A learner who answered
       two yesterday evening and sees "3 de 5" would otherwise think
       the app lost their work or invented progress. */
    retomada: sesion.avanzadas > 0,
  };
}
