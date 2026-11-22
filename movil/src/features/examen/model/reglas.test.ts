import { describe, expect, it } from 'vitest';
import {
  areasMasFlojas,
  debeAbrirTutoria,
  esCorrecta,
  explicacionDe,
  resumirExamen,
  type RespuestaDada,
} from './reglas';
import type { ItemGenerado } from '../api/esquemas';

/**
 * The rules of a training run, checked without rendering.
 *
 * Two of these pin bugs the web app actually shipped, both for the
 * same reason: the logic lived inside components, so nothing could
 * test it.
 */

const item: ItemGenerado = {
  id: 'i1',
  area: 'MAT',
  dificultad: 'media',
  plantilla: 'x',
  contexto: 'Un triángulo de base 4 y altura 3.',
  pregunta: '¿Cuál es el área?',
  opciones: { A: '6', B: '12', C: '7', D: '10' },
  respuesta_correcta: 'A',
  justificacion: 'Base por altura sobre dos.',
  tags: ['areas'],
  distractores: { B: 'olvida_dividir' },
  explicaciones: { A: '✅ 4×3/2 = 6.', B: '❌ Multiplicó y olvidó dividir.' },
  figura: null,
};

function respuesta(extra: Partial<RespuestaDada> = {}): RespuestaDada {
  return {
    questionIndex: 0,
    area: 'MAT',
    dificultad: 'media',
    selectedAnswer: 'A',
    isCorrect: true,
    answeredAt: '2026-11-22T10:00:00.000Z',
    ...extra,
  };
}

describe('corregir', () => {
  it('compara contra la respuesta del ítem', () => {
    expect(esCorrecta(item, 'A')).toBe(true);
    expect(esCorrecta(item, 'B')).toBe(false);
  });

  it('explica la opción que eligió, no la correcta', () => {
    expect(explicacionDe(item, 'B')).toMatch(/olvidó dividir/);
    expect(explicacionDe(item, 'B')).not.toMatch(/✅/);
  });

  it('si no hay explicación por opción, cae a la justificación', () => {
    // Items generated before per-option explanations existed have only
    // that, and saying something true beats saying nothing.
    expect(explicacionDe({ ...item, explicaciones: null }, 'B')).toBe(
      'Base por altura sobre dos.',
    );
  });
});

describe('resumir el examen', () => {
  it('cuenta aciertos y porcentaje', () => {
    const resumen = resumirExamen(
      [respuesta(), respuesta({ questionIndex: 1, isCorrect: false })],
      new Date('2026-11-22T09:58:00.000Z'),
      new Date('2026-11-22T10:00:00.000Z'),
    );
    expect(resumen).toMatchObject({ total: 2, correctas: 1, porcentaje: 50, segundos: 120 });
  });

  it('sin hora de inicio NO pierde las respuestas', () => {
    /* The answer-loss bug. Results refused to save anything when the
       start time was missing — the answers were right there, and the
       only thing absent was a number used for a duration. Falling
       back to the first answer's timestamp keeps the data. */
    const resumen = resumirExamen(
      [respuesta({ answeredAt: '2026-11-22T09:59:00.000Z' })],
      null,
      new Date('2026-11-22T10:00:00.000Z'),
    );
    expect(resumen.total).toBe(1);
    expect(resumen.correctas).toBe(1);
    expect(resumen.segundos).toBe(60);
  });

  it('un examen vacío no divide por cero', () => {
    const resumen = resumirExamen([], null, new Date());
    expect(resumen).toMatchObject({ total: 0, correctas: 0, porcentaje: 0 });
  });

  it('agrupa por área para el perfil de debilidades', () => {
    const resumen = resumirExamen(
      [
        respuesta({ area: 'MAT', isCorrect: true }),
        respuesta({ area: 'MAT', isCorrect: false, questionIndex: 1 }),
        respuesta({ area: 'LC', isCorrect: false, questionIndex: 2 }),
      ],
      new Date(),
    );
    expect(resumen.porArea).toEqual({
      MAT: { correct: 1, total: 2 },
      LC: { correct: 0, total: 1 },
    });
  });

  it('el tiempo nunca es negativo', () => {
    // A clock skew between device and server must not produce a
    // negative duration the server then rejects.
    const resumen = resumirExamen(
      [respuesta()],
      new Date('2026-11-22T10:05:00.000Z'),
      new Date('2026-11-22T10:00:00.000Z'),
    );
    expect(resumen.segundos).toBe(0);
  });
});

describe('qué estudiar después', () => {
  it('lo más flojo primero', () => {
    const orden = areasMasFlojas({
      MAT: { correct: 8, total: 10 },
      LC: { correct: 2, total: 10 },
      CN: { correct: 5, total: 10 },
    }).map((a) => a.area);
    expect(orden).toEqual(['LC', 'CN', 'MAT']);
  });

  it('un área sin preguntas no aparece como floja', () => {
    // Unmeasured is not weak: this is the dashboard bug, prevented.
    const areas = areasMasFlojas({
      ING: { correct: 0, total: 0 },
      LC: { correct: 2, total: 10 },
    });
    expect(areas.map((a) => a.area)).toEqual(['LC']);
  });
});

describe('cuándo abrir la tutoría', () => {
  it('solo cuando falló', () => {
    expect(debeAbrirTutoria(item, 'A')).toBe(false);
    expect(debeAbrirTutoria(item, 'B')).toBe(true);
  });

  it('no abre un panel que no tendría nada que decir', () => {
    // A thread whose first message would be empty teaches the learner
    // that the panel is noise.
    const mudo = { ...item, explicaciones: null, justificacion: '' };
    expect(debeAbrirTutoria(mudo, 'B')).toBe(false);
  });
});
