/**
 * The way out when there is a real reason.
 *
 * Chosen over no exit at all and over an unlimited one. No exit makes
 * the app the thing standing between a learner and a message that
 * might matter, and the way out of that is uninstalling. An unlimited
 * one is the button a procrastinator presses every time, and then the
 * toll does not exist.
 *
 * So: counted, short, and spent. Two a day, five minutes each, and
 * when they run out they run out until tomorrow. The count is the
 * whole design — it makes using one a small decision rather than a
 * reflex, which is the same reason a streak freeze works in Duolingo
 * and an "I'll do it later" button does not.
 */

/** Emergencies a learner gets per day. */
export const EMERGENCIAS_POR_DIA = 2;

/**
 * Minutes an emergency buys.
 *
 * Five, against the fifteen a cleared block buys. Short enough to
 * answer a message and long enough to be worth asking for; and the
 * gap between the two is the argument for doing the exercises.
 */
export const MINUTOS_DE_EMERGENCIA = 5;

export interface UsoDeEmergencia {
  /** `YYYY-MM-DD` in the learner's own timezone, not UTC. */
  readonly dia: string;
  readonly usadas: number;
}

/**
 * Today, where the learner is.
 *
 * In their timezone rather than UTC: in Colombia (UTC-5) an emergency
 * used at 8pm would otherwise count against the next day, handing out
 * four in one evening.
 */
export function diaLocal(ahora: Date = new Date()): string {
  const año = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}

export function quedanHoy(
  uso: UsoDeEmergencia | null,
  ahora: Date = new Date(),
): number {
  const hoy = diaLocal(ahora);
  /* A record from another day is not carried over: unused emergencies
     do not accumulate, or a learner who studies all week gets ten on
     Saturday. */
  if (!uso || uso.dia !== hoy) return EMERGENCIAS_POR_DIA;
  return Math.max(0, EMERGENCIAS_POR_DIA - uso.usadas);
}

export function puedeUsarEmergencia(
  uso: UsoDeEmergencia | null,
  ahora: Date = new Date(),
): boolean {
  return quedanHoy(uso, ahora) > 0;
}

export function usarEmergencia(
  uso: UsoDeEmergencia | null,
  ahora: Date = new Date(),
): UsoDeEmergencia {
  const hoy = diaLocal(ahora);
  if (!uso || uso.dia !== hoy) return { dia: hoy, usadas: 1 };
  return { dia: hoy, usadas: uso.usadas + 1 };
}

/**
 * What the button says.
 *
 * It names the cost before the tap, because the count is the point.
 * "Hoy no puedo" with nothing else reads as free.
 */
export function textoDelBoton(restantes: number): string {
  if (restantes <= 0) return 'Ya usó sus dos salidas de hoy';
  if (restantes === 1) return 'Hoy no puedo (le queda 1)';
  return `Hoy no puedo (le quedan ${restantes})`;
}
