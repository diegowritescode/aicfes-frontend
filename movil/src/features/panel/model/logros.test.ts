import { describe, expect, it } from 'vitest';
import { casiLogrado, fraccion, ordenar, resumen } from './logros';
import type { Logro } from '../api/esquemas';

function hacer(p: Partial<Logro> = {}): Logro {
  return {
    id: 'x',
    title: 'Un logro',
    description: 'Hacer algo.',
    target: 10,
    progress: 0,
    achieved: false,
    achievedAt: null,
    ...p,
  };
}

describe('la fracción de avance', () => {
  it('es la proporción simple', () => {
    expect(fraccion(hacer({ progress: 3, target: 10 }))).toBeCloseTo(0.3);
  });

  it('no pasa de uno aunque el progreso se pase', () => {
    expect(fraccion(hacer({ progress: 15, target: 10 }))).toBe(1);
  });

  it('no baja de cero', () => {
    expect(fraccion(hacer({ progress: -2, target: 10 }))).toBe(0);
  });

  it('un objetivo de cero no produce NaN', () => {
    /* Dividing by zero would render a NaN-width bar. A malformed row
       must cost its own line, not the section. */
    expect(fraccion(hacer({ target: 0, progress: 0 }))).toBe(0);
    expect(fraccion(hacer({ target: 0, achieved: true }))).toBe(1);
    expect(Number.isNaN(fraccion(hacer({ target: 0 })))).toBe(false);
  });
});

describe('casi logrado', () => {
  it('a la mitad ya cuenta', () => {
    expect(casiLogrado(hacer({ progress: 5, target: 10 }))).toBe(true);
  });

  it('por debajo de la mitad no', () => {
    expect(casiLogrado(hacer({ progress: 4, target: 10 }))).toBe(false);
  });

  it('uno ya conseguido no está "casi"', () => {
    // It is done. Calling it almost-done would be a worse lie than
    // saying nothing.
    expect(casiLogrado(hacer({ progress: 10, target: 10, achieved: true }))).toBe(false);
  });
});

describe('el orden', () => {
  it('pone lo pendiente antes de lo conseguido', () => {
    const orden = ordenar([
      hacer({ id: 'hecho', achieved: true, progress: 10 }),
      hacer({ id: 'falta', progress: 1 }),
    ]);
    expect(orden.map((l) => l.id)).toEqual(['falta', 'hecho']);
  });

  it('entre pendientes, primero el más cerca', () => {
    const orden = ordenar([
      hacer({ id: 'lejos', progress: 1 }),
      hacer({ id: 'cerca', progress: 9 }),
    ]).map((l) => l.id);
    expect(orden).toEqual(['cerca', 'lejos']);
  });

  it('no muta la lista que recibe', () => {
    // The list comes from react-query's cache. Sorting it in place
    // would mutate cached data and make renders disagree.
    const original = [hacer({ id: 'a', achieved: true }), hacer({ id: 'b' })];
    const copia = [...original];
    ordenar(original);
    expect(original.map((l) => l.id)).toEqual(copia.map((l) => l.id));
  });

  it('una lista vacía no revienta', () => {
    expect(ordenar([])).toEqual([]);
  });
});

describe('el resumen', () => {
  it('cuenta los conseguidos sobre el total', () => {
    expect(
      resumen([hacer({ achieved: true }), hacer(), hacer({ achieved: true })]),
    ).toEqual({ conseguidos: 2, total: 3 });
  });

  it('sin logros, cero de cero', () => {
    expect(resumen([])).toEqual({ conseguidos: 0, total: 0 });
  });
});
