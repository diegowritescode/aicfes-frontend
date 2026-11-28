import { beforeEach, describe, expect, it } from 'vitest';
import {
  letraAnterior,
  olvidarLetras,
  recordarLetra,
  repeticionesSeguidas,
} from './memoriaLetras';

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

describe('contar la racha', () => {
  it('una pregunta nueva no lleva ninguna', () => {
    expect(repeticionesSeguidas('i1')).toBe(0);
  });

  it('la primera vez cuenta como una', () => {
    recordarLetra('i1', 'C');
    expect(repeticionesSeguidas('i1')).toBe(1);
  });

  it('la misma letra otra vez suma', () => {
    /* This is what the shuffle reads to decide whether a run has gone
       on long enough to cut. */
    recordarLetra('i1', 'C');
    recordarLetra('i1', 'C');
    recordarLetra('i1', 'C');
    expect(repeticionesSeguidas('i1')).toBe(3);
  });

  it('cambiar de letra reinicia la cuenta', () => {
    recordarLetra('i1', 'C');
    recordarLetra('i1', 'C');
    recordarLetra('i1', 'A');
    expect(repeticionesSeguidas('i1')).toBe(1);
    expect(letraAnterior('i1')).toBe('A');
  });

  it('cada pregunta lleva su propia racha', () => {
    recordarLetra('i1', 'A');
    recordarLetra('i1', 'A');
    recordarLetra('i2', 'A');
    expect(repeticionesSeguidas('i1')).toBe(2);
    expect(repeticionesSeguidas('i2')).toBe(1);
  });
});
