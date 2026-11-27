import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { repasoDeRonda, temaLegible } from './repaso';
import type { ItemGenerado } from '@/shared/pregunta/api/esquemas';
import type { RespuestaDada } from '@/shared/pregunta/model/reglas';

/**
 * Turning a finished run into something worth reading.
 *
 * The end screen used to show a score and nothing else, while the
 * questions, their topics, their explanations and the time spent on
 * each were all in memory and dropped on unmount.
 */

function item(id: string, tags?: string[]): ItemGenerado {
  return {
    id,
    area: 'MAT',
    dificultad: 'media',
    contexto: '',
    pregunta: `¿Pregunta ${id}?`,
    opciones: { A: 'a', B: 'b', C: 'c', D: 'd' },
    respuesta_correcta: 'A',
    ...(tags ? { tags } : {}),
  } as ItemGenerado;
}

function respuesta(
  indice: number,
  acerto: boolean,
  tiempoMs: number | null = 30000,
): RespuestaDada {
  return {
    questionIndex: indice,
    itemId: `i${indice}`,
    area: 'MAT',
    dificultad: 'media',
    selectedAnswer: acerto ? 'A' : 'B',
    isCorrect: acerto,
    ...(tiempoMs === null ? {} : { tiempoMs }),
    answeredAt: new Date().toISOString(),
  } as RespuestaDada;
}

describe('qué se repasa de una ronda', () => {
  it('separa las falladas de las acertadas', () => {
    const r = repasoDeRonda(
      [item('i0'), item('i1'), item('i2')],
      [respuesta(0, true), respuesta(1, false), respuesta(2, false)],
    );

    expect(r.total).toBe(3);
    expect(r.correctas).toBe(1);
    expect(r.falladas).toHaveLength(2);
    expect(r.acertadas).toHaveLength(1);
  });

  it('una pregunta sin responder no cuenta como fallada', () => {
    /* When the clock runs out mid-round the learner did not fail the
       rest — they never saw them. Listing them as mistakes would tell
       them something untrue about themselves. */
    const r = repasoDeRonda(
      [item('i0'), item('i1'), item('i2')],
      [respuesta(0, false)],
    );

    expect(r.total).toBe(1);
    expect(r.falladas).toHaveLength(1);
    expect(r.acertadas).toHaveLength(0);
  });

  it('cada pregunta conserva su explicación y su opción elegida', () => {
    /* The reason the screen exists: what they picked, what was right,
       and why. */
    const r = repasoDeRonda([item('i0')], [respuesta(0, false)]);

    expect(r.falladas[0]!.elegida).toBe('B');
    expect(r.falladas[0]!.correcta).toBe('A');
    expect(r.falladas[0]!.item.pregunta).toBe('¿Pregunta i0?');
  });

  it('el tiempo llega en segundos', () => {
    const r = repasoDeRonda([item('i0')], [respuesta(0, true, 45000)]);

    expect(r.acertadas[0]!.segundos).toBe(45);
  });

  it('sin tiempo medido, la pregunta no inventa uno', () => {
    const r = repasoDeRonda([item('i0')], [respuesta(0, true, null)]);

    expect(r.acertadas[0]!.segundos).toBeNull();
    expect(r.segundosMediana).toBeNull();
  });

  it('la mediana resiste una pregunta lentísima', () => {
    /* One question left open while the phone rang is not the round's
       pace. A mean of four with that in it is a number about the
       phone call. */
    const r = repasoDeRonda(
      [item('i0'), item('i1'), item('i2'), item('i3')],
      [
        respuesta(0, true, 30000),
        respuesta(1, true, 32000),
        respuesta(2, true, 28000),
        respuesta(3, true, 600000),
      ],
    );

    expect(r.segundosMediana).toBe(31);
  });
});

describe('de qué era la ronda', () => {
  it('nombra el tema cuando domina la ronda', () => {
    /* This is what makes a plan action visible. Without it a targeted
       round looks exactly like a general one — which is what a phone
       test reported: «son prácticamente lo mismo». */
    const r = repasoDeRonda(
      [
        item('i0', ['porcentajes']),
        item('i1', ['porcentajes']),
        item('i2', ['porcentajes']),
        item('i3', ['geometria']),
      ],
      [respuesta(0, true), respuesta(1, false), respuesta(2, true), respuesta(3, true)],
    );

    expect(r.temaDominante).toBe('porcentajes');
  });

  it('no inventa un tema cuando la ronda está repartida', () => {
    /* A general round has no subject, and claiming one would be the
       screen asserting something false about what was practised. */
    const r = repasoDeRonda(
      [
        item('i0', ['porcentajes']),
        item('i1', ['geometria']),
        item('i2', ['velocidad']),
        item('i3', ['enzimas']),
      ],
      [respuesta(0, true), respuesta(1, true), respuesta(2, true), respuesta(3, true)],
    );

    expect(r.temaDominante).toBeNull();
  });

  it('usa solo la primera etiqueta de cada pregunta', () => {
    /* Generators list several tags; the first is the classification
       and the rest are detail. Counting all of them would make every
       round look mixed. */
    const r = repasoDeRonda(
      [
        item('i0', ['porcentajes', 'razonamiento', 'tablas']),
        item('i1', ['porcentajes', 'descuentos']),
      ],
      [respuesta(0, true), respuesta(1, true)],
    );

    expect(r.temaDominante).toBe('porcentajes');
  });

  it('preguntas sin etiqueta no rompen el cálculo', () => {
    const r = repasoDeRonda(
      [item('i0'), item('i1')],
      [respuesta(0, true), respuesta(1, false)],
    );

    expect(r.temaDominante).toBeNull();
    expect(r.total).toBe(2);
  });

  it('una ronda vacía no afirma nada', () => {
    const r = repasoDeRonda([], []);

    expect(r.total).toBe(0);
    expect(r.temaDominante).toBeNull();
    expect(r.segundosMediana).toBeNull();
  });
});

describe('el tema se lee como lo escribiría una persona', () => {
  it('convierte guiones y guiones bajos en espacios', () => {
    /* The bank writes both. `razonamiento_cuantitativo` on screen
       reads as a variable name, not as a subject. */
    expect(temaLegible('leyes-de-newton')).toBe('leyes de newton');
    expect(temaLegible('razonamiento_cuantitativo')).toBe('razonamiento cuantitativo');
  });
});

/**
 * The review has to be readable on its own.
 *
 * Reported from a phone, looking at the finished screen: «el usuario
 * sabe que la correcta era la C, pero no recuerda qué decía la C,
 * entonces queda en las mismas». The letters were there and the
 * options were not — and the options were in the item the screen was
 * already holding.
 *
 * A file-reading check, because this project has no render
 * environment. It pins that the text is passed, not how it looks.
 */
describe('el repaso muestra las opciones, no solo sus letras', () => {
  const componente = readFileSync(
    join(__dirname, '../components/RepasoDeLaRonda.tsx'),
    'utf8',
  );

  it('pasa el texto de la opción marcada', () => {
    expect(componente).toMatch(/texto=\{elegida \? opciones\[elegida\] : undefined\}/);
  });

  it('pasa el texto de la correcta', () => {
    expect(componente).toMatch(/texto=\{opciones\[correcta\]\}/);
  });

  it('cada fila dice cuál es cuál con palabras, no solo con color', () => {
    /* Two rows distinguished only by colour are two identical rows
       for anyone who cannot tell those colours apart. */
    expect(componente).toMatch(/rotulo="Marcaste"/);
    expect(componente).toMatch(/rotulo="Era"/);
  });
});
