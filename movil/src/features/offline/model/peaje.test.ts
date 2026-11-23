import { describe, expect, it } from 'vitest';
import {
  esCorrecta,
  estaPagado,
  minutosRestantes,
  MINUTOS_DESBLOQUEO,
  preguntaActual,
  puedeEmpezar,
  resumen,
  sigueDesbloqueado,
  venceEn,
  type EstadoDelPeaje,
} from './peaje';
import type { PreguntaDelLote } from '../api/esquemas';

/**
 * The toll: what it takes to get Instagram back.
 *
 * Every rule here is a product decision, and two of them are the
 * feature. Answering is enough — requiring correctness punishes the
 * learner for the thing the product exists to fix. And an empty pool
 * lets them through, because a barrier nobody can pass is not
 * self-regulation.
 */

function pregunta(id: string, correcta = 'A'): PreguntaDelLote {
  return {
    id,
    area: 'MAT',
    dificultad: 'media',
    contexto: null,
    pregunta: `¿${id}?`,
    opciones: { A: 'a', B: 'b', C: 'c', D: 'd' },
    respuesta_correcta: correcta as 'A',
    explicaciones: { A: 'porque sí', B: 'no', C: 'no', D: 'no' },
    figura: null,
  };
}

function estado(cuantas: number, intentos = 0, aciertos = 0): EstadoDelPeaje {
  return {
    preguntas: Array.from({ length: cuantas }, (_, i) => pregunta(`p${i}`)),
    intentos: Array.from({ length: intentos }, (_, i) => ({
      itemId: `p${i}`,
      elegida: (i < aciertos ? 'A' : 'B') as 'A' | 'B',
      correcta: i < aciertos,
      tiempoMs: 20_000,
    })),
  };
}

describe('responder basta, acertar no hace falta', () => {
  it('cinco respondidas con cero aciertos ya desbloquea', () => {
    /* The central decision. A learner locked out for being wrong is
       punished for exactly what the product exists to fix, and will
       uninstall rather than study. The wrong answer is also the datum
       that feeds the weakness profile. */
    expect(estaPagado(estado(5, 5, 0))).toBe(true);
  });

  it('cuatro de cinco todavía no', () => {
    expect(estaPagado(estado(5, 4, 4))).toBe(false);
  });

  it('un bloque sin preguntas no se considera pagado', () => {
    // Otherwise an empty pool would read as "already cleared", which
    // is a different thing from letting the learner through.
    expect(estaPagado(estado(0))).toBe(false);
  });
});

describe('el lote vacío deja pasar', () => {
  it('sin preguntas, el peaje no puede empezar', () => {
    /* And the screen then lets them through with a note. A barrier the
       learner cannot pass is not self-regulation, it is the app
       holding their phone hostage. */
    expect(puedeEmpezar([])).toBe(false);
    expect(puedeEmpezar([pregunta('p0')])).toBe(true);
  });
});

describe('avanzar por el bloque', () => {
  it('la primera pregunta es la primera', () => {
    expect(preguntaActual(estado(5))?.id).toBe('p0');
  });

  it('avanza con cada respuesta', () => {
    expect(preguntaActual(estado(5, 2))?.id).toBe('p2');
  });

  it('al terminar no hay pregunta actual', () => {
    expect(preguntaActual(estado(5, 5))).toBeNull();
  });
});

describe('corregir', () => {
  it('compara con la respuesta que viene en el lote', () => {
    // The pool carries the answer because the toll marks the attempt
    // with no network.
    expect(esCorrecta(pregunta('p', 'C'), 'C')).toBe(true);
    expect(esCorrecta(pregunta('p', 'C'), 'A')).toBe(false);
  });
});

describe('los quince minutos', () => {
  const AHORA = new Date('2026-11-22T10:00:00.000Z');

  it('vence quince minutos después de pagar', () => {
    expect(venceEn(AHORA).toISOString()).toBe('2026-11-22T10:15:00.000Z');
    expect(MINUTOS_DESBLOQUEO).toBe(15);
  });

  it('sigue desbloqueado dentro de la ventana', () => {
    const vence = venceEn(AHORA);
    expect(sigueDesbloqueado(vence, new Date('2026-11-22T10:14:00.000Z'))).toBe(true);
    expect(sigueDesbloqueado(vence, new Date('2026-11-22T10:16:00.000Z'))).toBe(false);
  });

  it('el borde exacto ya está vencido', () => {
    const vence = venceEn(AHORA);
    expect(sigueDesbloqueado(vence, vence)).toBe(false);
  });

  it('los minutos restantes nunca son negativos', () => {
    // The screen shows this number. A negative would read as nonsense.
    const vence = venceEn(AHORA);
    expect(minutosRestantes(vence, new Date('2026-11-22T11:00:00.000Z'))).toBe(0);
    expect(minutosRestantes(vence, new Date('2026-11-22T10:05:00.000Z'))).toBe(10);
  });
});

describe('lo que se le cuenta al estudiante', () => {
  it('cuenta respondidas, acertadas y total', () => {
    expect(resumen(estado(5, 5, 3))).toEqual({
      respondidas: 5,
      acertadas: 3,
      total: 5,
    });
  });

  it('un bloque recién empezado no miente', () => {
    expect(resumen(estado(5))).toEqual({ respondidas: 0, acertadas: 0, total: 5 });
  });
});
