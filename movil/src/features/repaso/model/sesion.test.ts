import { describe, expect, it } from 'vitest';
import { cierre, errorActual, resumen, terminada, type SesionDeRepaso } from './sesion';
import type { ErrorPendiente } from '../api/esquemas';

/**
 * One question at a time.
 *
 * The listed version was reported as hard to concentrate in, and it
 * also let a learner reopen a card and answer again with the right
 * option already on screen. These tests pin the pacing that fixes it —
 * the same distinction the toll needed: answering is not advancing.
 */

function error(id: string): ErrorPendiente {
  return {
    itemId: id,
    area: 'MAT',
    pregunta: `¿${id}?`,
    contexto: null,
    opciones: { A: 'a', B: 'b', C: 'c', D: 'd' },
    respuesta_correcta: 'A',
    explicaciones: null,
    falladaEn: '2026-11-20T00:00:00.000Z',
    veces: 2,
  };
}

function sesion(total: number, respondidas = 0, avanzadas = respondidas, aciertos = 0): SesionDeRepaso {
  return {
    errores: Array.from({ length: total }, (_, i) => error(`e${i}`)),
    intentos: Array.from({ length: respondidas }, (_, i) => ({
      itemId: `e${i}`,
      elegida: 'A',
      correcta: i < aciertos,
    })),
    avanzadas,
  };
}

describe('una a la vez', () => {
  it('empieza por la primera', () => {
    expect(errorActual(sesion(5))?.itemId).toBe('e0');
  });

  it('responder no pasa a la siguiente', () => {
    /* The explanation sits between answering and advancing. Deriving
       the index from the answers is what made the toll jump. */
    expect(errorActual(sesion(5, 1, 0))?.itemId).toBe('e0');
  });

  it('solo avanzar la cambia', () => {
    expect(errorActual(sesion(5, 1, 1))?.itemId).toBe('e1');
  });

  it('al final no hay pregunta', () => {
    expect(errorActual(sesion(3, 3, 3))).toBeNull();
    expect(terminada(sesion(3, 3, 3))).toBe(true);
  });

  it('responder la última no termina la sesión', () => {
    // Its explanation is the only thing left to read.
    expect(terminada(sesion(3, 3, 2))).toBe(false);
  });
});

describe('el cierre dice lo que pasó', () => {
  it('todas corregidas', () => {
    expect(cierre(sesion(3, 3, 3, 3))).toContain('todas');
  });

  it('ninguna', () => {
    /* No congratulation. A learner who got none right is not helped by
       being told well done. */
    const texto = cierre(sesion(3, 3, 3, 0));
    expect(texto).toContain('Ninguna');
    expect(texto.toLowerCase()).not.toContain('bien hecho');
  });

  it('algunas', () => {
    expect(cierre(sesion(5, 5, 5, 2))).toContain('2 de 5');
  });
});

describe('el resumen', () => {
  it('cuenta corregidas sobre el total', () => {
    expect(resumen(sesion(5, 4, 4, 3))).toEqual({
      corregidas: 3,
      total: 5,
      respondidas: 4,
    });
  });
});
