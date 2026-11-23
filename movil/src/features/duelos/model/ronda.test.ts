import { describe, expect, it } from 'vitest';
import {
  avance,
  avanzar,
  eleccionActual,
  esUltima,
  preguntaActual,
  responder,
  sinResponder,
  termino,
  type Ronda,
} from './ronda';

/**
 * A duel round.
 *
 * The index bug these assertions prevent has happened twice in this
 * app: the toll derived the index from `intentos.length` and a tap
 * jumped a question, and the review screen reshuffled its options
 * after the learner had answered. In a duel both players are scored on
 * the same five questions, so a skipped one loses the duel for a
 * reason the learner cannot see.
 */

function ronda(n: number): Ronda {
  return {
    preguntas: Array.from({ length: n }, (_, i) => ({ id: `q${i}` })),
    indice: 0,
    respuestas: [],
  };
}

describe('qué pregunta se muestra', () => {
  it('muestra la del índice, no la siguiente a la respondida', () => {
    /* The exact bug from the toll: answering must not move the index
       on its own. */
    const r = responder(ronda(5), 'A');
    expect(preguntaActual(r)?.id).toBe('q0');
    expect(r.indice).toBe(0);
  });

  it('avanza solo cuando se lo piden', () => {
    const r = avanzar(responder(ronda(5), 'A'));
    expect(preguntaActual(r)?.id).toBe('q1');
  });

  it('no se pasa del final', () => {
    // An index past the last question renders a blank screen.
    let r = ronda(2);
    for (let i = 0; i < 10; i += 1) r = avanzar(r);
    expect(r.indice).toBe(2);
    expect(preguntaActual(r)).toBeNull();
    expect(termino(r)).toBe(true);
  });
});

describe('respuestas', () => {
  it('cambiar de opinión reemplaza, no agrega', () => {
    const r = responder(responder(ronda(3), 'A'), 'C');
    expect(r.respuestas).toEqual([{ itemId: 'q0', eleccion: 'C' }]);
    expect(eleccionActual(r)).toBe('C');
  });

  it('cada pregunta guarda la suya', () => {
    const r = responder(avanzar(responder(ronda(3), 'A')), 'B');
    expect(r.respuestas).toHaveLength(2);
    expect(eleccionActual(r)).toBe('B');
  });

  it('no recuerda una elección de otra pregunta', () => {
    const r = avanzar(responder(ronda(3), 'A'));
    expect(eleccionActual(r)).toBeNull();
  });

  it('cuenta las que faltan', () => {
    expect(sinResponder(ronda(5))).toBe(5);
    expect(sinResponder(responder(ronda(5), 'A'))).toBe(4);
  });

  it('responder después del final no hace nada', () => {
    const r = ronda(1);
    const terminada = avanzar(r);
    expect(responder(terminada, 'A')).toEqual(terminada);
  });
});

describe('progreso', () => {
  it('sabe cuál es la última', () => {
    expect(esUltima(ronda(3))).toBe(false);
    expect(esUltima(avanzar(avanzar(ronda(3))))).toBe(true);
  });

  it('el avance va de 0 a 1 sin pasarse', () => {
    expect(avance(ronda(4))).toBe(0);
    expect(avance(avanzar(avanzar(ronda(4))))).toBe(0.5);
    let r = ronda(4);
    for (let i = 0; i < 9; i += 1) r = avanzar(r);
    expect(avance(r)).toBe(1);
  });

  it('una ronda vacía no divide por cero', () => {
    expect(avance(ronda(0))).toBe(0);
  });
});
