import { describe, expect, it } from 'vitest';
import {
  HORAS_PARA_RETOMAR,
  avanzarSesion,
  empezarSesion,
  progreso,
  registrarIntento,
  sesionUtilizable,
  sesionVencida,
  type SesionGuardada,
} from './sesionDelPeaje';
import type { PreguntaDelLote } from '../api/esquemas';

/**
 * A block that survives leaving the screen.
 *
 * Without this the toll is not a toll: a learner on question 2 of 5
 * presses back, reopens the app and starts again at zero. That is not
 * an escape hatch, it is the absence of a door.
 */

function preguntas(n: number): PreguntaDelLote[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `q${i}`,
    area: 'MAT',
    dificultad: 'media',
    contexto: null,
    pregunta: `Pregunta ${i}`,
    opciones: { A: 'a', B: 'b', C: 'c', D: 'd' },
    respuesta_correcta: 'A',
    explicaciones: null,
    figura: null,
  })) as PreguntaDelLote[];
}

const INICIO = new Date('2026-11-24T10:00:00Z');

function intento(itemId: string) {
  return { itemId, elegida: 'A' as const, correcta: true, tiempoMs: 1000 };
}

describe('el progreso no se pierde al salir', () => {
  it('lo respondido sigue respondido', () => {
    let s = empezarSesion(preguntas(5), INICIO);
    s = avanzarSesion(registrarIntento(s, intento('q0')));
    s = avanzarSesion(registrarIntento(s, intento('q1')));

    // What a reload would restore, byte for byte.
    const recuperada: SesionGuardada = JSON.parse(JSON.stringify(s));
    expect(progreso(recuperada)).toEqual({ hechas: 2, total: 5, retomada: true });
  });

  it('dice que fue retomada, para que el número no parezca inventado', () => {
    const fresca = empezarSesion(preguntas(5), INICIO);
    expect(progreso(fresca).retomada).toBe(false);
  });

  it('responder dos veces la misma no cuenta dos veces', () => {
    let s = empezarSesion(preguntas(5), INICIO);
    s = registrarIntento(s, intento('q0'));
    s = registrarIntento(s, { ...intento('q0'), correcta: false });
    expect(s.intentos).toHaveLength(1);
    expect(s.intentos[0]!.correcta).toBe(false);
  });

  it('no avanza más allá de la última', () => {
    let s = empezarSesion(preguntas(2), INICIO);
    for (let i = 0; i < 9; i += 1) s = avanzarSesion(s);
    expect(s.avanzadas).toBe(2);
  });
});

describe('cuándo una sesión ya no sirve', () => {
  it('se puede retomar dentro de la ventana', () => {
    const s = empezarSesion(preguntas(5), INICIO);
    const unaHoraDespues = new Date(INICIO.getTime() + 3_600_000);
    expect(sesionUtilizable(s, unaHoraDespues)).toBe(true);
  });

  it('la de ayer no cuenta para el bloqueo de hoy', () => {
    /* A toll payable in instalments across days is one a learner
       games by answering one question a day. */
    const s = empezarSesion(preguntas(5), INICIO);
    const tarde = new Date(INICIO.getTime() + (HORAS_PARA_RETOMAR + 1) * 3_600_000);
    expect(sesionVencida(s, tarde)).toBe(true);
    expect(sesionUtilizable(s, tarde)).toBe(false);
  });

  it('una sesión terminada no se retoma', () => {
    /* Otherwise resuming a paid block hands out a second unlock for
       no work. */
    let s = empezarSesion(preguntas(2), INICIO);
    s = avanzarSesion(avanzarSesion(s));
    expect(sesionUtilizable(s, INICIO)).toBe(false);
  });

  it('una fecha corrupta se trata como vencida', () => {
    /* Failing toward a new block is recoverable; failing toward
       resuming a corrupt one is not. */
    const rota = { ...empezarSesion(preguntas(5), INICIO), empezadaEn: 'basura' };
    expect(sesionVencida(rota, INICIO)).toBe(true);
    expect(sesionUtilizable(rota, INICIO)).toBe(false);
  });

  it('sin preguntas no hay nada que retomar', () => {
    expect(sesionUtilizable(empezarSesion([], INICIO), INICIO)).toBe(false);
    expect(sesionUtilizable(null, INICIO)).toBe(false);
  });
});
