import { describe, expect, it } from 'vitest';
import { rotarOpciones } from './rotacion';

/**
 * Shuffling options on a repeat.
 *
 * Found by using the app: after missing a question and seeing C
 * highlighted as the right one, the obvious move on the retry is to
 * tap C without reading. What gets practised is recall of a letter,
 * not of the reasoning.
 */

const OPCIONES = { A: 'uno', B: 'dos', C: 'tres', D: 'cuatro' };

describe('el primer intento no se toca', () => {
  it('se ve como el autor la escribió', () => {
    /* Nothing to remember yet, and reordering a first encounter only
       makes a bug report harder to read. */
    const r = rotarOpciones({ itemId: 'i1', opciones: OPCIONES, correcta: 'C', intento: 0 });
    expect(r.opciones).toEqual(OPCIONES);
    expect(r.correcta).toBe('C');
  });
});

describe('un repaso cambia las letras, no las respuestas', () => {
  it('el texto correcto sigue siendo el mismo', () => {
    // This is the whole contract: the answer does not change.
    const r = rotarOpciones({ itemId: 'i1', opciones: OPCIONES, correcta: 'C', intento: 1 });
    expect(r.opciones[r.correcta]).toBe('tres');
  });

  it('están las cuatro opciones, sin perder ni duplicar', () => {
    const r = rotarOpciones({ itemId: 'i1', opciones: OPCIONES, correcta: 'C', intento: 1 });
    expect(Object.keys(r.opciones).sort()).toEqual(['A', 'B', 'C', 'D']);
    expect(Object.values(r.opciones).sort()).toEqual(
      ['cuatro', 'dos', 'tres', 'uno'],
    );
  });

  it('para al menos un ítem la correcta cambia de letra', () => {
    /* A shuffle that happened to leave everything in place would pass
       every other test and fix nothing. Over several items at least
       one must move. */
    const movidos = ['i1', 'i2', 'i3', 'i4', 'i5', 'i6'].filter(
      (id) =>
        rotarOpciones({ itemId: id, opciones: OPCIONES, correcta: 'C', intento: 1 })
          .correcta !== 'C',
    );
    expect(movidos.length).toBeGreaterThan(0);
  });
});

describe('se puede registrar lo que el estudiante tocó', () => {
  it('cada letra mostrada apunta a su letra original', () => {
    /* The server stores the original letter, or the answer history
       stops meaning anything across attempts. */
    const r = rotarOpciones({ itemId: 'i1', opciones: OPCIONES, correcta: 'C', intento: 1 });
    for (const [mostrada, original] of Object.entries(r.aOriginal)) {
      expect(r.opciones[mostrada]).toBe(OPCIONES[original]);
    }
  });

  it('la correcta mostrada mapea a la correcta original', () => {
    const r = rotarOpciones({ itemId: 'i1', opciones: OPCIONES, correcta: 'C', intento: 2 });
    expect(r.aOriginal[r.correcta]).toBe('C');
  });
});

describe('es reproducible', () => {
  it('el mismo intento da el mismo orden', () => {
    /* A learner who leaves and comes back must not be handed a
       different arrangement mid-thought. */
    const a = rotarOpciones({ itemId: 'i1', opciones: OPCIONES, correcta: 'C', intento: 1 });
    const b = rotarOpciones({ itemId: 'i1', opciones: OPCIONES, correcta: 'C', intento: 1 });
    expect(a.opciones).toEqual(b.opciones);
    expect(a.correcta).toBe(b.correcta);
  });

  it('intentos distintos dan órdenes distintos', () => {
    const primeros = [1, 2, 3].map(
      (n) =>
        rotarOpciones({ itemId: 'i1', opciones: OPCIONES, correcta: 'C', intento: n })
          .correcta,
    );
    expect(new Set(primeros).size).toBeGreaterThan(1);
  });

  it('ítems distintos no comparten el mismo orden', () => {
    const a = rotarOpciones({ itemId: 'i1', opciones: OPCIONES, correcta: 'C', intento: 1 });
    const b = rotarOpciones({ itemId: 'i2', opciones: OPCIONES, correcta: 'C', intento: 1 });
    expect(a.opciones).not.toEqual(b.opciones);
  });
});

describe('casos raros', () => {
  it('con dos opciones también funciona', () => {
    const r = rotarOpciones({
      itemId: 'i1',
      opciones: { A: 'sí', B: 'no' },
      correcta: 'A',
      intento: 1,
    });
    expect(r.opciones[r.correcta]).toBe('sí');
  });

  it('con una sola opción no rompe', () => {
    const r = rotarOpciones({
      itemId: 'i1',
      opciones: { A: 'única' },
      correcta: 'A',
      intento: 1,
    });
    expect(r.correcta).toBe('A');
  });
});

describe('volver a entrar cambia el orden', () => {
  it('dos sesiones distintas de la misma pregunta barajan distinto', () => {
    /* The bug, reported from a phone: fail a question, see that the
       answer was A, leave, come back, tap A without reading — and it
       was still A.

       The first version seeded on `veces`, the number of times the
       question had been MISSED. Reviewing without missing it again
       leaves that number unchanged, so the arrangement was identical.
       The seed has to change per attempt at answering, not per
       failure. */
    const base = { itemId: 'i1', opciones: OPCIONES, correcta: 'C' as const };
    const letras = [1, 2, 3, 4].map((sesion) => rotarOpciones({ ...base, intento: sesion }).correcta);
    expect(new Set(letras).size).toBeGreaterThan(1);
  });
});
