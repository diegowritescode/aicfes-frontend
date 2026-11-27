/**
 * An avatar drawn from the alias, with no network and no upload.
 *
 * Three options were on the table and this is the one that costs the
 * learner nothing. A service like DiceBear draws nicer pictures but
 * sends every learner's alias to someone else's server — these are
 * minors, and «the avatars looked better» is not a reason to hand a
 * third party a list of their names. Uploads are worse again:
 * photographs of children, moderation, storage, and a way to be
 * recognised by a stranger.
 *
 * So: initials on a colour, both decided by the alias itself. Same
 * alias, same avatar, on every device and with the phone in airplane
 * mode. Nothing to store, nothing to moderate, nothing to leak.
 *
 * Pure, so the colour assignment can be tested without rendering.
 */

/**
 * The palette avatars draw from.
 *
 * Fixed hex rather than theme tokens: an avatar has to stay the same
 * colour when the app switches to dark mode, or the person a learner
 * recognises at a glance changes every evening. These are chosen to
 * carry white text at the weight the initials use.
 */
const COLORES = [
  '#6366F1', // índigo
  '#0891B2', // cian
  '#059669', // esmeralda
  '#D97706', // ámbar
  '#DC2626', // rojo
  '#7C3AED', // violeta
  '#DB2777', // rosa
  '#2563EB', // azul
] as const;

/**
 * A small stable hash of a string.
 *
 * FNV-1a, which is short enough to read and spreads short strings
 * well — the inputs here are aliases of a few characters, where
 * `length % n` or a sum of codes would put half the names on the same
 * colour. Not a security hash and not used as one.
 */
function huella(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i += 1) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Up to two initials, in upper case.
 *
 * Two words give two letters; one word gives one. Not two letters
 * from a single word: «CA» for Camilo reads as a different name,
 * while «C» reads as Camilo.
 */
export function inicialesDe(alias: string | null | undefined): string {
  const limpio = (alias ?? '').trim();
  if (!limpio) return '?';

  const palabras = limpio.split(/\s+/).filter(Boolean);
  const letras = palabras.slice(0, 2).map((p) => [...p][0] ?? '');

  return letras.join('').toUpperCase() || '?';
}

/** The colour for an alias. Stable: the same name is always the same. */
export function colorDe(alias: string | null | undefined): string {
  const limpio = (alias ?? '').trim().toLowerCase();
  /* No alias yet is its own case rather than hashing the empty
     string: everyone without one would share a colour, which looks
     like they are all the same person. */
  if (!limpio) return '#64748B';

  return COLORES[huella(limpio) % COLORES.length]!;
}
