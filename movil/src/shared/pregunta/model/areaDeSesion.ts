import type { Area } from '@/shared/model/icfes';

/**
 * Which area to record a session under.
 *
 * The server's `start-session` schema accepts only the five real
 * areas: `MIXTO` is rejected with a 400. The client type says
 * `Area | 'MIXTO'`, so a mixed run passed `MIXTO` straight through and
 * the session was never created — `sesion.ok` was false, `sessionId`
 * stayed null, and the learner trained without any of it counting.
 * Nothing on screen said so, because nothing was watching that call.
 *
 * Verified against production on 22 nov 2026: `area: "MIXTO"` returns
 * VALIDATION_ERROR listing the five it accepts.
 *
 * A mixed run is recorded under the area it drew most from. That is
 * not perfect — a session is one row with one area — but it is the
 * closest true statement available, and it beats not recording the
 * session at all.
 */
export function areaDeSesion(
  seleccion: Area | 'MIXTO',
  repartidas: ReadonlyArray<{ area: Area }> = [],
): Area {
  if (seleccion !== 'MIXTO') return seleccion;

  const cuenta = new Map<Area, number>();
  for (const { area } of repartidas) {
    cuenta.set(area, (cuenta.get(area) ?? 0) + 1);
  }

  let mayor: Area | null = null;
  let mejor = 0;
  for (const [area, n] of cuenta) {
    if (n > mejor) {
      mayor = area;
      mejor = n;
    }
  }

  /* Matemáticas when there is nothing to count: it is the largest
     block of the real exam, so it is the least wrong default. */
  return mayor ?? 'MAT';
}
