import { describe, expect, it } from 'vitest';
import { estaPagado, preguntaActual, type EstadoDelPeaje } from './peaje';
import type { PreguntaDelLote } from '../api/esquemas';

/**
 * Which question the screen is showing, and when the block ends.
 *
 * This file exists because of a real defect, reported from a phone:
 * answering question 1 immediately showed question 2 with the chosen
 * option still marked and question 2's explanation underneath. And
 * answering the fifth showed no explanation at all — the "done" screen
 * replaced it instantly.
 *
 * One cause, two symptoms. The screen derived both "which question"
 * and "is it finished" from `intentos.length`, and the answer was
 * recorded the moment the learner tapped. So the index advanced while
 * they were still reading.
 *
 * The fix is that advancing is its own step. These tests pin the
 * distinction: recording an answer must not move the question.
 */

function pregunta(id: string): PreguntaDelLote {
  return {
    id,
    area: 'MAT',
    dificultad: 'media',
    contexto: null,
    pregunta: `¿${id}?`,
    opciones: { A: 'a', B: 'b', C: 'c', D: 'd' },
    respuesta_correcta: 'A',
    explicaciones: { A: 'sí', B: 'no', C: 'no', D: 'no' },
    figura: null,
  };
}

const CINCO = Array.from({ length: 5 }, (_, i) => pregunta(`p${i}`));

function estado(respondidas: number, avanzadas = respondidas): EstadoDelPeaje {
  return {
    preguntas: CINCO,
    intentos: Array.from({ length: respondidas }, (_, i) => ({
      itemId: `p${i}`,
      elegida: 'A' as const,
      correcta: true,
      tiempoMs: 1000,
    })),
    /* How many the learner has moved past, which is not the same as
       how many they have answered: between the two sits the moment
       they are reading the explanation. */
    avanzadas,
  };
}

describe('responder no cambia la pregunta', () => {
  it('tras responder la primera, sigue viéndose la primera', () => {
    /* The reported bug: answering question 1 jumped to question 2 with
       the tapped option still highlighted. */
    const recienRespondida = estado(1, 0);
    expect(preguntaActual(recienRespondida)?.id).toBe('p0');
  });

  it('solo al avanzar aparece la siguiente', () => {
    expect(preguntaActual(estado(1, 1))?.id).toBe('p1');
  });
});

describe('la última pregunta también se explica', () => {
  it('responder la quinta no termina el bloque', () => {
    /* The other half of the same bug: the fifth answer showed no
       explanation because the "done" screen replaced it at once. */
    expect(estaPagado(estado(5, 4))).toBe(false);
  });

  it('el bloque termina cuando avanza desde la quinta', () => {
    expect(estaPagado(estado(5, 5))).toBe(true);
  });

  it('con cuatro respondidas y avanzadas, aún no está pagado', () => {
    expect(estaPagado(estado(4, 4))).toBe(false);
  });
});
