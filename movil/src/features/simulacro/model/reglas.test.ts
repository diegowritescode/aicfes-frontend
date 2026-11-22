import { describe, expect, it } from 'vitest';
import {
  alcanzaElBanco,
  areasPorPrioridad,
  avanceDe,
  comoReloj,
  mapaDe,
  siguientePendiente,
  vaApurado,
} from './reglas';
import type { PreguntaSimulacro } from '../api/esquemas';

/**
 * The rules of a sitting, checked without rendering anything.
 *
 * In the web app this logic lived inside components, so the only way
 * to test it was to mount a screen — which meant it was never tested.
 * Each case here is a decision the learner can see being made wrong.
 */

function pregunta(
  orden: number,
  extra: Partial<PreguntaSimulacro> = {},
): PreguntaSimulacro {
  return {
    orden,
    area: 'MAT',
    itemId: `i${orden}`,
    contexto: '',
    pregunta: '¿?',
    opciones: { A: '1', B: '2' },
    tieneFigura: false,
    respuesta: null,
    marcada: false,
    ...extra,
  };
}

describe('el mapa', () => {
  it('responder y marcar son estados independientes', () => {
    // "Puse C pero no estoy seguro" is what the scratch sheet is for.
    // A map that treated these as one state could not show it.
    const puntos = mapaDe([
      pregunta(0, { respuesta: 'C', marcada: true }),
      pregunta(1, { respuesta: 'A' }),
      pregunta(2, { marcada: true }),
      pregunta(3),
    ]);
    expect(puntos[0]).toMatchObject({ respondida: true, marcada: true });
    expect(puntos[1]).toMatchObject({ respondida: true, marcada: false });
    expect(puntos[2]).toMatchObject({ respondida: false, marcada: true });
    expect(puntos[3]).toMatchObject({ respondida: false, marcada: false });
  });

  it('cuenta el avance', () => {
    const avance = avanceDe(
      mapaDe([pregunta(0, { respuesta: 'A' }), pregunta(1, { marcada: true }), pregunta(2)]),
    );
    expect(avance).toEqual({ respondidas: 1, marcadas: 1, total: 3, sinResponder: 2 });
  });
});

describe('a cuál ir después', () => {
  it('prefiere una marcada sin responder', () => {
    const puntos = mapaDe([
      pregunta(0, { respuesta: 'A' }),
      pregunta(1),
      pregunta(2, { marcada: true }),
    ]);
    expect(siguientePendiente(puntos, 0)).toBe(2);
  });

  it('una marcada ya respondida va antes que una simplemente saltada', () => {
    // Flagging is deliberate; skipping may not be.
    const puntos = mapaDe([
      pregunta(0, { respuesta: 'A' }),
      pregunta(1),
      pregunta(2, { respuesta: 'B', marcada: true }),
    ]);
    expect(siguientePendiente(puntos, 0)).toBe(2);
  });

  it('da la vuelta en vez de rendirse al final', () => {
    // Working through the last questions must not stop offering the
    // ones left behind at the start.
    const puntos = mapaDe([pregunta(0), pregunta(1, { respuesta: 'A' }), pregunta(2, { respuesta: 'B' })]);
    expect(siguientePendiente(puntos, 2)).toBe(0);
  });

  it('devuelve null cuando no queda nada', () => {
    // That null is what lets the screen offer to hand the sitting in.
    const puntos = mapaDe([pregunta(0, { respuesta: 'A' }), pregunta(1, { respuesta: 'B' })]);
    expect(siguientePendiente(puntos, 0)).toBeNull();
  });
});

describe('el reloj', () => {
  it('se lee como mm:ss', () => {
    expect(comoReloj(0)).toBe('0:00');
    expect(comoReloj(65)).toBe('1:05');
    expect(comoReloj(3600)).toBe('60:00');
  });

  it('nunca muestra tiempo negativo', () => {
    // The server clamps at zero, but a clock drawn from a stale tick
    // can go under between fetches.
    expect(comoReloj(-30)).toBe('0:00');
  });

  it('avisa bajo cinco minutos', () => {
    expect(vaApurado(301)).toBe(false);
    expect(vaApurado(300)).toBe(true);
    expect(vaApurado(0)).toBe(true);
  });
});

describe('por dónde empezar a estudiar', () => {
  it('lo más flojo primero', () => {
    const orden = areasPorPrioridad({
      correctas: 5,
      total: 20,
      porcentaje: 25,
      recomendacion: [],
      areas: [
        { area: 'MAT', correctas: 8, total: 10, porcentaje: 80 },
        { area: 'LC', correctas: 2, total: 10, porcentaje: 20 },
        { area: 'CN', correctas: 5, total: 10, porcentaje: 50 },
      ],
    }).map((a) => a.area);
    expect(orden).toEqual(['LC', 'CN', 'MAT']);
  });

  it('un área sin preguntas no es un área floja', () => {
    /* This is the dashboard bug, in the one place it can be prevented:
       an untouched area read as 0% and sorted to the top of "what to
       work on", telling learners to study something they had never
       tried. Unmeasured is not weak. */
    const orden = areasPorPrioridad({
      correctas: 2,
      total: 10,
      porcentaje: 20,
      recomendacion: [],
      areas: [
        { area: 'ING', correctas: 0, total: 0, porcentaje: 0 },
        { area: 'LC', correctas: 2, total: 10, porcentaje: 20 },
      ],
    }).map((a) => a.area);
    expect(orden).toEqual(['LC', 'ING']);
  });
});

describe('qué simulacros ofrecer', () => {
  it('no ofrece uno que el banco no puede llenar', () => {
    expect(alcanzaElBanco(254, 87)).toBe(false);
    expect(alcanzaElBanco(50, 87)).toBe(true);
    expect(alcanzaElBanco(87, 87)).toBe(true);
  });

  it('si no se sabe la capacidad, ofrece todo', () => {
    // A failed capacity read should not empty the screen.
    expect(alcanzaElBanco(254, null)).toBe(true);
  });
});
