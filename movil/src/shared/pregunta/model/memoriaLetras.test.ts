import { beforeEach, describe, expect, it } from 'vitest';
import { letraAnterior, olvidarLetras, recordarLetra } from './memoriaLetras';

/**
 * Remembering where the answer was shown.
 *
 * Without this the shuffle cannot promise a different letter — it
 * would have nothing to avoid.
 */

beforeEach(() => olvidarLetras());

describe('recordar y leer', () => {
  it('una pregunta nueva no tiene letra anterior', () => {
    expect(letraAnterior('i1')).toBeNull();
  });

  it('devuelve la última que se mostró', () => {
    recordarLetra('i1', 'C');
    expect(letraAnterior('i1')).toBe('C');
  });

  it('la más reciente reemplaza a la anterior', () => {
    recordarLetra('i1', 'C');
    recordarLetra('i1', 'A');
    expect(letraAnterior('i1')).toBe('A');
  });

  it('cada pregunta lleva la suya', () => {
    recordarLetra('i1', 'A');
    recordarLetra('i2', 'D');
    expect(letraAnterior('i1')).toBe('A');
    expect(letraAnterior('i2')).toBe('D');
  });
});

describe('no crece sin límite', () => {
  it('suelta las más viejas pasado el tope', () => {
    for (let i = 0; i < 250; i += 1) recordarLetra(`i${i}`, 'A');
    expect(letraAnterior('i0')).toBeNull();
    expect(letraAnterior('i249')).toBe('A');
  });

  it('volver a ver una pregunta la rescata del olvido', () => {
    /* Insertion order is what decides eviction, so a question seen
       again has to move to the end — otherwise the one the learner is
       working on right now could be the next dropped. */
    recordarLetra('vieja', 'A');
    for (let i = 0; i < 150; i += 1) recordarLetra(`relleno${i}`, 'B');
    recordarLetra('vieja', 'C');
    for (let i = 0; i < 100; i += 1) recordarLetra(`mas${i}`, 'B');
    expect(letraAnterior('vieja')).toBe('C');
  });
});

describe('olvidar', () => {
  it('borra todo', () => {
    recordarLetra('i1', 'A');
    olvidarLetras();
    expect(letraAnterior('i1')).toBeNull();
  });
});
