import { describe, expect, it } from 'vitest';
import {
  cuantasPedir,
  disponibles,
  fusionar,
  haceFaltaRellenar,
  marcarUsadas,
  POR_BLOQUE,
  puedeCobrarPeaje,
  siguienteBloque,
  TAMANO_DESEADO,
  type EstadoDelLote,
} from './lote';
import type { PreguntaDelLote } from '../api/esquemas';

/**
 * The pool that makes the toll work without data.
 *
 * The failure to avoid is specific and it is the whole feature: the
 * learner opens Instagram, the toll asks for five questions, and the
 * pool is empty — on a phone with no data, which is why the pool
 * existed. Refilling late guarantees exactly that.
 */

function pregunta(id: string): PreguntaDelLote {
  return {
    id,
    area: 'MAT',
    dificultad: 'media',
    contexto: null,
    pregunta: `¿Pregunta ${id}?`,
    opciones: { A: 'a', B: 'b', C: 'c', D: 'd' },
    respuesta_correcta: 'A',
    explicaciones: null,
    figura: null,
  };
}

function estado(cuantas: number, usadas: string[] = []): EstadoDelLote {
  return {
    preguntas: Array.from({ length: cuantas }, (_, i) => pregunta(`p${i}`)),
    usadas,
  };
}

describe('rellenar antes de quedarse sin nada', () => {
  it('se rellena cuando queda poco más de un bloque', () => {
    /* The threshold is above one block on purpose: a refill needs the
       network, and the toll runs when there is none. */
    expect(haceFaltaRellenar(estado(POR_BLOQUE * 2))).toBe(true);
    expect(haceFaltaRellenar(estado(TAMANO_DESEADO))).toBe(false);
  });

  it('un lote vacío por supuesto se rellena', () => {
    expect(haceFaltaRellenar(estado(0))).toBe(true);
  });

  it('las usadas cuentan como gastadas', () => {
    // 20 stored but 15 used leaves 5, which is a refill.
    const casi = estado(20, Array.from({ length: 15 }, (_, i) => `p${i}`));
    expect(disponibles(casi)).toHaveLength(5);
    expect(haceFaltaRellenar(casi)).toBe(true);
  });

  it('pide exactamente lo que falta para llegar al tamaño', () => {
    expect(cuantasPedir(estado(8))).toBe(TAMANO_DESEADO - 8);
    expect(cuantasPedir(estado(TAMANO_DESEADO))).toBe(0);
    // Never negative: a pool larger than target asks for nothing.
    expect(cuantasPedir(estado(TAMANO_DESEADO + 5))).toBe(0);
  });
});

describe('un bloque del peaje', () => {
  it('toma cinco preguntas', () => {
    expect(siguienteBloque(estado(20))).toHaveLength(POR_BLOQUE);
  });

  it('no repite una ya usada', () => {
    const usado = marcarUsadas(estado(10), ['p0', 'p1']);
    const bloque = siguienteBloque(usado);
    expect(bloque.map((p) => p.id)).not.toContain('p0');
    expect(bloque.map((p) => p.id)).not.toContain('p1');
  });

  it('con el lote corto, entrega lo que hay en vez de nada', () => {
    /* Four questions still clear a block. Refusing would leave the
       learner behind a wall they cannot pass without the data the
       pool exists to avoid needing. */
    expect(siguienteBloque(estado(3))).toHaveLength(3);
  });

  it('sin preguntas, el peaje no puede cobrar', () => {
    // The screen has to know this to say something honest instead of
    // blocking an app it cannot unblock.
    expect(puedeCobrarPeaje(estado(0))).toBe(false);
    expect(puedeCobrarPeaje(estado(5, ['p0', 'p1', 'p2', 'p3', 'p4']))).toBe(false);
    expect(puedeCobrarPeaje(estado(1))).toBe(true);
  });
});

describe('fusionar lo que llega', () => {
  it('añade las nuevas y suelta las usadas', () => {
    const previo = marcarUsadas(estado(5), ['p0', 'p1']);
    const nuevo = fusionar(previo, [pregunta('x1'), pregunta('x2')]);

    expect(nuevo.preguntas.map((p) => p.id)).toEqual(['p2', 'p3', 'p4', 'x1', 'x2']);
    expect(nuevo.usadas).toEqual([]);
  });

  it('ignora duplicados que el servidor repitió', () => {
    // The server excludes what we told it we had, but two requests
    // that crossed could still overlap.
    const nuevo = fusionar(estado(3), [pregunta('p1'), pregunta('nueva')]);
    const ids = nuevo.preguntas.map((p) => p.id);
    expect(ids.filter((id) => id === 'p1')).toHaveLength(1);
    expect(ids).toContain('nueva');
  });

  it('no reintroduce una pregunta ya usada', () => {
    /* Serving a question the learner just answered would make the toll
       look broken, and it is the likely case: the server does not know
       what was used since the last top-up. */
    const previo = marcarUsadas(estado(3), ['p0']);
    const nuevo = fusionar(previo, [pregunta('p0')]);
    expect(nuevo.preguntas.map((p) => p.id)).not.toContain('p0');
  });

  it('un lote vacío del servidor no borra lo que había', () => {
    // A failed or short response must not empty a working pool.
    const previo = estado(8);
    expect(fusionar(previo, []).preguntas).toHaveLength(8);
  });

  it('no crece sin límite al fusionar muchas veces', () => {
    /* Used ids are dropped with their questions. Keeping them would
       grow the stored pool on a device we are trying not to fill. */
    let actual = estado(10);
    for (let i = 0; i < 20; i += 1) {
      const bloque = siguienteBloque(actual);
      actual = marcarUsadas(actual, bloque.map((p) => p.id));
      actual = fusionar(actual, [pregunta(`n${i}a`), pregunta(`n${i}b`)]);
    }
    expect(actual.preguntas.length).toBeLessThan(30);
    expect(actual.usadas).toEqual([]);
  });
});
