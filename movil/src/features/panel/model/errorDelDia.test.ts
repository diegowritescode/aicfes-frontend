import { describe, expect, it } from 'vitest';
import {
  esRespondible,
  estadoDeOpcion,
  explicacionAMostrar,
  letrasDisponibles,
} from './errorDelDia';

/**
 * The card's rules.
 *
 * These exist because the card used to have no rules at all: it
 * showed a question and then a button that navigated to `/entrenar`,
 * a different screen with a different question. The learner was
 * promised "answer this one" and got a generic trainer.
 */

describe('cómo se ve cada opción', () => {
  const base = { correcta: 'B' };

  it('antes de responder, todas están pendientes', () => {
    for (const letra of ['A', 'B', 'C', 'D']) {
      expect(estadoDeOpcion({ ...base, letra, elegida: null })).toBe('pendiente');
    }
  });

  it('al acertar, la elegida se marca correcta', () => {
    expect(estadoDeOpcion({ ...base, letra: 'B', elegida: 'B' })).toBe('correcta');
  });

  it('al fallar, se ven las dos: la fallada y la correcta', () => {
    /* Showing only the red one leaves them guessing which was right,
       which is the whole point of the card. */
    expect(estadoDeOpcion({ ...base, letra: 'A', elegida: 'A' })).toBe('fallada');
    expect(estadoDeOpcion({ ...base, letra: 'B', elegida: 'A' })).toBe('correcta');
  });

  it('las demás quedan descartadas, no pendientes', () => {
    expect(estadoDeOpcion({ ...base, letra: 'C', elegida: 'A' })).toBe('descartada');
    expect(estadoDeOpcion({ ...base, letra: 'D', elegida: 'A' })).toBe('descartada');
  });
});

describe('qué explicación se muestra', () => {
  const explicaciones = { A: 'Confundió el signo.', B: 'Así es.', C: 'Invirtió la razón.' };

  it('la de la opción que eligieron, no la de la correcta', () => {
    /* After a wrong answer the useful sentence is why that option
       looked right. */
    expect(explicacionAMostrar({ elegida: 'A', correcta: 'B', explicaciones })).toBe(
      'Confundió el signo.',
    );
  });

  it('al acertar, la de la correcta', () => {
    expect(explicacionAMostrar({ elegida: 'B', correcta: 'B', explicaciones })).toBe('Así es.');
  });

  it('si la elegida no tiene explicación, cae en la de la correcta', () => {
    expect(explicacionAMostrar({ elegida: 'D', correcta: 'B', explicaciones })).toBe('Así es.');
  });

  it('sin explicaciones, no inventa nada', () => {
    expect(explicacionAMostrar({ elegida: 'A', correcta: 'B', explicaciones: null })).toBeNull();
    expect(explicacionAMostrar({ elegida: 'A', correcta: 'B' })).toBeNull();
  });

  it('antes de responder no se adelanta nada', () => {
    // Showing it early would hand over the answer.
    expect(explicacionAMostrar({ elegida: null, correcta: 'B', explicaciones })).toBeNull();
  });
});

describe('qué opciones se dibujan', () => {
  it('solo las que traen texto', () => {
    expect(letrasDisponibles({ A: 'uno', B: 'dos', C: 'tres', D: 'cuatro' })).toEqual([
      'A',
      'B',
      'C',
      'D',
    ]);
  });

  it('un ítem de tres opciones no dibuja una D vacía', () => {
    /* A blank fourth option is tappable and says nothing. */
    expect(letrasDisponibles({ A: 'uno', B: 'dos', C: 'tres' })).toEqual(['A', 'B', 'C']);
    expect(letrasDisponibles({ A: 'uno', B: 'dos', C: 'tres', D: '' })).toEqual(['A', 'B', 'C']);
  });
});

describe('cuándo la tarjeta se puede responder', () => {
  const completa = { opciones: { A: 'uno', B: 'dos' }, respuesta_correcta: 'B' };

  it('con opciones y respuesta correcta, sí', () => {
    expect(esRespondible(completa)).toBe(true);
  });

  it('sin opciones, no', () => {
    /* A server older than this feature sends the question and
       nothing to answer it with. */
    expect(esRespondible({ respuesta_correcta: 'B' })).toBe(false);
  });

  it('sin respuesta correcta, no', () => {
    expect(esRespondible({ opciones: { A: 'uno', B: 'dos' } })).toBe(false);
  });

  it('null, no', () => {
    expect(esRespondible(null)).toBe(false);
  });

  it('si la correcta no está entre las opciones, no', () => {
    /* Otherwise every attempt is marked wrong and the card teaches
       the learner that they cannot win. */
    expect(esRespondible({ opciones: { A: 'uno', B: 'dos' }, respuesta_correcta: 'D' })).toBe(
      false,
    );
  });
})
