import type { Letra } from '@/shared/model/icfes';

/**
 * Shuffling the options so a repeat cannot be answered from memory.
 *
 * The problem this solves was found by using the app: after missing a
 * question and seeing C highlighted as correct, the obvious move on
 * the retry is to tap C without reading. The learner is not cheating —
 * the design invited it, and what gets practised is recall of a
 * letter rather than of the reasoning.
 *
 * The answer does not change. Its letter does.
 *
 * Deterministic on purpose, seeded by the item and the attempt: the
 * same retry shows the same arrangement, so a learner who leaves and
 * comes back is not handed a different puzzle mid-thought, and a bug
 * report can be reproduced.
 */

const LETRAS: readonly Letra[] = ['A', 'B', 'C', 'D'];

/** A small, stable hash. Not for security — only for a stable shuffle. */
function semilla(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i += 1) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A deterministic pseudo-random sequence from one seed. */
function siguiente(estado: number): number {
  let x = estado;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return x >>> 0;
}

export interface OpcionesRotadas {
  /** What each displayed letter now shows. */
  readonly opciones: Record<string, string>;
  /** Which displayed letter is now correct. */
  readonly correcta: Letra;
  /** Displayed letter to original letter, for recording the answer. */
  readonly aOriginal: Record<string, Letra>;
}

/**
 * The same question with its options in a different order.
 *
 * `intento` is which attempt this is: 0 leaves the question exactly as
 * written, so a learner meeting it for the first time sees what the
 * author intended. Only repeats are shuffled, which is the only place
 * memory of a letter is a problem.
 */
export function rotarOpciones(params: {
  itemId: string;
  opciones: Record<string, string>;
  correcta: Letra;
  intento: number;
}): OpcionesRotadas {
  const presentes = LETRAS.filter((l) => params.opciones[l] !== undefined);

  /* First time: untouched. There is nothing to remember yet, and
     reordering would only make a bug report harder to read. */
  if (params.intento <= 0 || presentes.length < 2) {
    return {
      opciones: params.opciones,
      correcta: params.correcta,
      aOriginal: Object.fromEntries(presentes.map((l) => [l, l])),
    };
  }

  /* Fisher-Yates over the original letters, driven by a seed that
     includes the attempt — so the second and third tries differ from
     each other and from the original. */
  const orden = [...presentes];
  /* The attempt is mixed in rather than appended. Hashing
     `"i1:1"` and `"i1:2"` gives neighbouring seeds, and the shuffle
     then lands on the same letter several attempts running — one item
     put the answer at D four times in a row, which defeats the point
     of shuffling at all. Multiplying by a large odd constant spreads
     consecutive attempts apart. */
  let estado = (semilla(params.itemId) ^ Math.imul(params.intento, 0x9e3779b1)) >>> 0;
  if (estado === 0) estado = 1;
  for (let i = orden.length - 1; i > 0; i -= 1) {
    estado = siguiente(estado);
    const j = estado % (i + 1);
    [orden[i], orden[j]] = [orden[j]!, orden[i]!];
  }

  const opciones: Record<string, string> = {};
  const aOriginal: Record<string, Letra> = {};
  let correcta = params.correcta;

  orden.forEach((original, indice) => {
    const mostrada = presentes[indice]!;
    opciones[mostrada] = params.opciones[original]!;
    aOriginal[mostrada] = original;
    if (original === params.correcta) correcta = mostrada;
  });

  return { opciones, correcta, aOriginal };
}
