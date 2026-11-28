/**
 * How long ago, in words rather than a date.
 *
 * «hace 3 días» answers the question somebody staring at a pending
 * request is actually asking. A timestamp makes them do the
 * subtraction.
 *
 * Moved out of `amigos.tsx` when the profile screen needed it too.
 * A second copy would have drifted — the two screens would have
 * disagreed about what «ayer» means at midnight.
 */
export function desdeCuando(iso: string): string {
  const cuando = new Date(iso).getTime();
  /* An unparseable date says something vague rather than «Invalid
     Date» or «hace NaN días». The server sends ISO strings; this is
     for the build that one day reads a cached response written by an
     older one. */
  if (!Number.isFinite(cuando)) return 'hace un rato';

  const dias = Math.floor((Date.now() - cuando) / 86400000);
  if (dias < 1) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 30) return `hace ${dias} días`;
  return 'hace más de un mes';
}
