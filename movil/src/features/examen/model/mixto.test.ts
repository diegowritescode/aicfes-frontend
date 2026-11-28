import { describe, expect, it } from 'vitest';
import { repartirMixto } from './mixto';

/**
 * Mixed practice has to be mixed.
 *
 * The web version asked for a flat number per area, which quietly
 * made every area equally weighted — practice that does not resemble
 * the exam it is preparing for.
 */

const suma = (partes: Array<{ n: number }>) => partes.reduce((s, p) => s + p.n, 0);

describe('repartir una práctica mixta', () => {
  it('las partes suman el total pedido', () => {
    for (const total of [5, 7, 10, 13, 20, 50]) {
      expect(suma(repartirMixto(total, 'media'))).toBe(total);
    }
  });

  it('ninguna área queda fuera', () => {
    // A "mixed" run missing a subject is not mixed.
    const partes = repartirMixto(5, 'media');
    expect(partes).toHaveLength(5);
    expect(partes.every((p) => p.n >= 1)).toBe(true);
  });

  it('respeta los pesos del examen real', () => {
    // CN is the largest section of the real exam and LC the smallest,
    // so a long run must reflect that.
    const partes = repartirMixto(50, 'media');
    const porArea = Object.fromEntries(partes.map((p) => [p.area, p.n]));
    expect(porArea.CN!).toBeGreaterThan(porArea.LC!);
    expect(porArea.ING!).toBeGreaterThan(porArea.LC!);
  });

  it('lleva la dificultad pedida a cada parte', () => {
    expect(repartirMixto(10, 'alta').every((p) => p.dificultad === 'alta')).toBe(true);
  });
});
