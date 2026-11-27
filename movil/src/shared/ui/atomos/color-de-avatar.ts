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

/* The palette lives in `tokens.ts`, which is the only file in
   `shared/ui` allowed to write a hex — `tokens.test.ts` fails the
   build otherwise, and it is right to: a colour defined twice is a
   colour that will be changed once. See `colorAvatar` there for why
   these sit outside the themed palette. */
import { colorAvatar, colorAvatarSinNombre } from '../tokens';

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

/**
 * Which of the colours an alias gets. Stable: same name, same slot.
 *
 * Returns an index and not a hex string, so the component can name a
 * written-out class instead of passing a colour through `style`.
 * NativeWind compiles the classes it can see in the source, and an
 * inline `style` can also beat a compiled class — which once shipped
 * a button with no fill at all. `tokens.test.ts` guards both, and an
 * index is what lets this obey it.
 *
 * `null` means nobody yet, which is its own slot rather than a hash
 * of the empty string: everyone without an alias sharing one colour
 * looks like they are all the same person.
 */
export function ranuraDe(alias: string | null | undefined): number | null {
  const limpio = (alias ?? '').trim().toLowerCase();
  if (!limpio) return null;

  return huella(limpio) % colorAvatar.length;
}

/**
 * The hex for an alias.
 *
 * Kept for the places that genuinely need a value rather than a
 * class — a chart, a notification icon. Screens use `ranuraDe`.
 */
export function colorDe(alias: string | null | undefined): string {
  const ranura = ranuraDe(alias);
  return ranura === null ? colorAvatarSinNombre : colorAvatar[ranura]!;
}
