import { describe, expect, it } from 'vitest';
import {
  abandonados,
  COLA_VACIA,
  encolar,
  marcarFallo,
  pendientes,
  quitar,
  resumirBloque,
  siguiente,
  type BloquePendiente,
  type Cola,
} from './cola';

/**
 * Work done offline, waiting to be sent.
 *
 * Two failures to avoid, both quiet. Dropping a block means the
 * learner cleared a toll and their streak did not move. Replaying one
 * twice means their XP is wrong and nobody can explain why.
 */

function respuesta(i: number, correcta = true) {
  return {
    itemId: `item-${i}`,
    questionIndex: i,
    area: 'MAT' as const,
    dificultad: 'media' as const,
    elegida: 'A' as const,
    correcta,
    tiempoMs: 30_000,
  };
}

function bloque(p: Partial<BloquePendiente> = {}): BloquePendiente {
  return {
    id: 'b1',
    empezadoEn: '2026-11-22T10:00:00.000Z',
    terminadoEn: '2026-11-22T10:04:00.000Z',
    respuestas: [respuesta(0), respuesta(1, false)],
    intentos: 0,
    ...p,
  };
}

describe('el orden en que sale', () => {
  it('lo más viejo primero, para que los días lleguen en orden', () => {
    /* A streak is computed from dates. Sending Tuesday after Wednesday
       would have the server see them out of order. */
    let cola = encolar(COLA_VACIA, bloque({ id: 'martes' }));
    cola = encolar(cola, bloque({ id: 'miercoles' }));
    expect(siguiente(cola)?.id).toBe('martes');
  });

  it('una cola vacía no tiene siguiente', () => {
    expect(siguiente(COLA_VACIA)).toBeNull();
  });

  it('enviar uno saca solo ese', () => {
    let cola = encolar(COLA_VACIA, bloque({ id: 'a' }));
    cola = encolar(cola, bloque({ id: 'b' }));
    cola = quitar(cola, 'a');
    expect(cola.bloques.map((b) => b.id)).toEqual(['b']);
  });
});

describe('cuando el servidor lo rechaza', () => {
  it('se reintenta, pero no para siempre', () => {
    /* A block the server keeps refusing — a deleted item, a shape it
       no longer accepts — would otherwise be retried forever and hold
       up everything behind it. */
    let cola = encolar(COLA_VACIA, bloque({ id: 'malo' }));
    for (let i = 0; i < 5; i += 1) cola = marcarFallo(cola, 'malo');
    expect(siguiente(cola)).toBeNull();
    expect(pendientes(cola)).toBe(0);
  });

  it('un bloque agotado no bloquea a los demás', () => {
    let cola = encolar(COLA_VACIA, bloque({ id: 'malo', intentos: 5 }));
    cola = encolar(cola, bloque({ id: 'bueno' }));
    expect(siguiente(cola)?.id).toBe('bueno');
  });

  it('lo abandonado se puede ver, no se borra en silencio', () => {
    // Work the learner did and we lost is worth admitting to.
    const cola: Cola = { bloques: [bloque({ id: 'perdido', intentos: 5 })] };
    expect(abandonados(cola).map((b) => b.id)).toEqual(['perdido']);
  });

  it('un fallo no toca a los otros bloques', () => {
    let cola = encolar(COLA_VACIA, bloque({ id: 'a' }));
    cola = encolar(cola, bloque({ id: 'b' }));
    cola = marcarFallo(cola, 'a');
    expect(cola.bloques.find((b) => b.id === 'b')?.intentos).toBe(0);
  });
});

describe('el tamaño de la cola', () => {
  it('no crece sin límite, y lo que suelta es lo más viejo', () => {
    /* Losing a week-old block costs a day on a streak that is already
       broken. Losing today's costs the session just finished. */
    let cola = COLA_VACIA;
    for (let i = 0; i < 60; i += 1) cola = encolar(cola, bloque({ id: `b${i}` }));
    expect(cola.bloques).toHaveLength(50);
    expect(cola.bloques[0]!.id).toBe('b10');
    expect(cola.bloques.at(-1)!.id).toBe('b59');
  });
});

describe('el resumen que el servidor pide', () => {
  it('cuenta aciertos y total', () => {
    const r = resumirBloque(bloque());
    expect(r.totalQuestions).toBe(2);
    expect(r.correctQuestions).toBe(1);
  });

  it('desglosa por área', () => {
    const mixto = bloque({
      respuestas: [
        { ...respuesta(0), area: 'MAT' },
        { ...respuesta(1, false), area: 'LC' },
        { ...respuesta(2), area: 'LC' },
      ],
    });
    expect(resumirBloque(mixto).areaBreakdown).toEqual({
      MAT: { correct: 1, total: 1 },
      LC: { correct: 1, total: 2 },
    });
  });

  it('la duración sale de las marcas del estudiante', () => {
    // Four minutes between the two timestamps.
    expect(resumirBloque(bloque()).durationSeconds).toBe(240);
  });

  it('un reloj que fue hacia atrás no produce una duración negativa', () => {
    /* The server validates `min(0)`, so a negative would be rejected
       and the block retried until it gave up — losing the work for a
       clock change. */
    const raro = bloque({
      empezadoEn: '2026-11-22T10:05:00.000Z',
      terminadoEn: '2026-11-22T10:00:00.000Z',
    });
    expect(resumirBloque(raro).durationSeconds).toBeGreaterThan(0);
  });

  it('una fecha ilegible tampoco lo rompe', () => {
    const roto = bloque({ empezadoEn: 'no-es-fecha' });
    expect(resumirBloque(roto).durationSeconds).toBeGreaterThan(0);
  });
});

describe('las marcas de tiempo son del momento real', () => {
  it('un bloque viejo conserva cuándo ocurrió', () => {
    /* The server takes `startedAt` from us. If a block replayed three
       days later claimed today, the streak would count the wrong day
       and the learner would lose a day they earned. */
    const viejo = bloque({ empezadoEn: '2026-11-19T08:00:00.000Z' });
    const enCola = encolar(COLA_VACIA, viejo);
    expect(siguiente(enCola)?.empezadoEn).toBe('2026-11-19T08:00:00.000Z');
  });
});
