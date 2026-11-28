import { describe, expect, it } from 'vitest';
import {
  BASE,
  SEGUNDOS_DE_LECTURA,
  TECHO,
  avisoDeRecargo,
  cuantasPide,
  esperaAntesDeSeguir,
  estaPagado,
} from './costoDelError';

/**
 * What a wrong answer costs.
 *
 * The toll was reported as skippable by the person who built it, on
 * the first day of real use: he tapped without reading, because
 * clearing the block only required answering. A mechanic gets played
 * the way it is scored, and this is the rescoring.
 */

describe('un fallo alarga el bloque', () => {
  it('sin fallos, son cinco', () => {
    expect(cuantasPide(0)).toBe(BASE);
  });

  it('cada fallo suma una', () => {
    expect(cuantasPide(1)).toBe(6);
    expect(cuantasPide(3)).toBe(8);
  });

  it('hay techo, porque si no es un muro', () => {
    /* A learner who knows nothing today would answer forever. Eight
       is a bad run; infinity is the barrier `puedeEmpezar` already
       refuses to create. */
    expect(cuantasPide(10)).toBe(TECHO);
    expect(cuantasPide(99)).toBe(TECHO);
  });

  it('un contador negativo no acorta el bloque', () => {
    expect(cuantasPide(-5)).toBe(BASE);
  });
});

describe('cuándo se sale', () => {
  it('cinco bien y listo', () => {
    expect(estaPagado({ avanzadas: 5, fallos: 0, disponibles: 20 })).toBe(true);
  });

  it('con un fallo, cinco no bastan', () => {
    /* The whole point: guessing is no longer free, it is longer. */
    expect(estaPagado({ avanzadas: 5, fallos: 1, disponibles: 20 })).toBe(false);
    expect(estaPagado({ avanzadas: 6, fallos: 1, disponibles: 20 })).toBe(true);
  });

  it('fallar no encierra a nadie', () => {
    /* No pass mark. Someone who gets every one wrong still leaves —
       later. Locking them out punishes exactly what the product
       exists to fix. */
    expect(estaPagado({ avanzadas: TECHO, fallos: TECHO, disponibles: 20 })).toBe(true);
  });

  it('un lote corto no puede pedir más de lo que tiene', () => {
    /* Otherwise a phone with three questions left asks for six and
       the learner is stuck behind a block with nothing to answer. */
    expect(estaPagado({ avanzadas: 3, fallos: 2, disponibles: 3 })).toBe(true);
  });

  it('sin preguntas no hay bloque que pagar', () => {
    expect(estaPagado({ avanzadas: 0, fallos: 0, disponibles: 0 })).toBe(false);
  });
});

describe('la espera es consecuencia, no impuesto', () => {
  it('acertar sigue de inmediato', () => {
    /* The terms-and-conditions countdown teaches waiting, not
       reading. A correct answer must not be taxed. */
    expect(esperaAntesDeSeguir(true)).toBe(0);
  });

  it('fallar sostiene el botón unos segundos', () => {
    expect(esperaAntesDeSeguir(false)).toBe(SEGUNDOS_DE_LECTURA);
  });
});

describe('lo que se le dice al estudiante', () => {
  it('sin fallos no dice nada', () => {
    expect(avisoDeRecargo({ fallos: 0, pedidas: 5 })).toBeNull();
  });

  it('avisa que se alargó, sin regañar', () => {
    const aviso = avisoDeRecargo({ fallos: 1, pedidas: 6 });
    expect(aviso).toBe('Esa falló: una pregunta más.');
  });

  it('en el techo dice que ya no crece', () => {
    /* Otherwise the next mistake looks like it was ignored, and an
       app that seems to ignore you is an app that seems broken. */
    expect(avisoDeRecargo({ fallos: 4, pedidas: TECHO })).toMatch(/no se alarga más/);
  });
});
