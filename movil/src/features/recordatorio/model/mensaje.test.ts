import { describe, expect, it } from 'vitest';
import {
  HORA_POR_OMISION,
  horaValida,
  legible,
  recordatorioDeHoy,
  temaMasFlojo,
  valeLaPenaRecordar,
} from './mensaje';

/**
 * What the daily reminder says, which is the feature.
 *
 * The decision pinned here is that it talks about content and not
 * about the streak. A streak reminder works for retention and is also
 * the contingency that measures negative on intrinsic motivation
 * (d = −0.36, worse in adolescents). These tests exist so that choice
 * cannot be reversed by someone adding "no la rompas" without reading
 * why it is absent.
 */

describe('habla del contenido, no de la racha', () => {
  it('nombra el tema que toca', () => {
    const r = recordatorioDeHoy({ tema: 'logaritmos', area: 'MAT', falladas: 3 });
    expect(r.titulo).toContain('logaritmos');
  });

  it('nunca menciona la racha ni los días seguidos', () => {
    /* The whole point. If this test fails, someone added streak
       pressure — read ADR 10 before deciding that is an improvement. */
    const casos = [
      recordatorioDeHoy({ tema: 'funciones', area: 'MAT', falladas: 5 }),
      recordatorioDeHoy({ tema: 'inferencia', area: 'LC', falladas: 1 }),
      recordatorioDeHoy(null, 20),
      recordatorioDeHoy(null, 0),
    ];
    for (const r of casos) {
      const texto = `${r.titulo} ${r.cuerpo}`.toLowerCase();
      for (const prohibida of ['racha', 'días seguidos', 'no la rompas', 'perder']) {
        expect(texto).not.toContain(prohibida);
      }
    }
  });

  it('da la razón cuando hay un patrón', () => {
    const r = recordatorioDeHoy({ tema: 'logaritmos', area: 'MAT', falladas: 4 });
    expect(r.cuerpo).toContain('4 veces');
  });

  it('no regaña por un solo fallo', () => {
    /* One wrong answer is not a pattern. "Que fallaste 1 vez" reads
       like being told off for a single mistake. */
    const r = recordatorioDeHoy({ tema: 'logaritmos', area: 'MAT', falladas: 1 });
    expect(r.cuerpo).not.toContain('1 vez');
    expect(r.cuerpo).not.toContain('fallado');
  });
});

describe('sin historial, no se inventa una debilidad', () => {
  it('menciona las preguntas disponibles si las hay', () => {
    const r = recordatorioDeHoy(null, 20);
    expect(r.cuerpo).toContain('20');
    expect(r.cuerpo).toContain('sin internet');
  });

  it('sin preguntas tampoco promete nada', () => {
    const r = recordatorioDeHoy(null, 0);
    expect(r.cuerpo).not.toContain('0');
    expect(r.titulo.length).toBeGreaterThan(0);
  });
});

describe('los nombres de tema son legibles', () => {
  it('convierte el slug en algo que una persona lea', () => {
    expect(legible('funciones-cuadraticas')).toBe('funciones cuadraticas');
    expect(legible('comprension_lectora')).toBe('comprension lectora');
  });

  it('un tema ya legible no se estropea', () => {
    expect(legible('logaritmos')).toBe('logaritmos');
  });
});

describe('cuándo no se manda nada', () => {
  it('si ya estudió hoy, no se le recuerda', () => {
    /* Telling someone to do what they just did is how an app teaches
       people to ignore its notifications — and the one that matters is
       the one they then miss. */
    expect(valeLaPenaRecordar({ estudioHoy: true, activado: true })).toBe(false);
  });

  it('si no lo activó, no se le manda', () => {
    expect(valeLaPenaRecordar({ estudioHoy: false, activado: false })).toBe(false);
  });

  it('activado y sin estudiar: se manda', () => {
    expect(valeLaPenaRecordar({ estudioHoy: false, activado: true })).toBe(true);
  });
});

describe('la hora', () => {
  it('respeta la que eligió el estudiante', () => {
    expect(horaValida(7)).toBe(7);
    expect(horaValida(21)).toBe(21);
  });

  it('una hora imposible cae en la de por omisión', () => {
    // A bug or a bad migration must not produce a 3am notification.
    for (const mala of [0, 3, 5, 23, 25, -1, 7.5, NaN]) {
      expect(horaValida(mala)).toBe(HORA_POR_OMISION);
    }
  });

  it('la de por omisión es después del colegio y antes de la noche', () => {
    expect(HORA_POR_OMISION).toBeGreaterThanOrEqual(17);
    expect(HORA_POR_OMISION).toBeLessThanOrEqual(20);
  });
});

describe('elegir el tema más flojo del panel', () => {
  it('toma el área con menos acierto', () => {
    const tema = temaMasFlojo([
      { area: 'MAT', accuracy: 40, questions: 10 },
      { area: 'LC', accuracy: 90, questions: 10 },
    ]);
    expect(tema?.tema).toBe('MAT');
  });

  it('`accuracy` es un porcentaje, no una fracción', () => {
    /* Verified against `dashboard-math.ts:71`, which does
       `round((correct/total) * 100)`. Treating it as a fraction gives
       a negative count — this test is why that bug did not ship. */
    const tema = temaMasFlojo([{ area: 'MAT', accuracy: 40, questions: 10 }]);
    expect(tema?.falladas).toBe(6);
  });

  it('con acierto perfecto, cero fallos y nunca negativo', () => {
    const tema = temaMasFlojo([{ area: 'MAT', accuracy: 100, questions: 8 }]);
    expect(tema?.falladas).toBe(0);
  });

  it('por debajo de cuatro respuestas no opina', () => {
    /* The same floor the backend uses. Naming an area on three
       answers sends the learner to practise noise. */
    expect(temaMasFlojo([{ area: 'MAT', accuracy: 0, questions: 3 }])).toBeNull();
    expect(temaMasFlojo([{ area: 'MAT', accuracy: 0, questions: 4 }])).not.toBeNull();
  });

  it('un panel vacío no inventa un tema', () => {
    expect(temaMasFlojo([])).toBeNull();
  });

  it('no muta la lista que recibe', () => {
    // It comes from react-query's cache; sorting in place would
    // mutate cached data.
    const filas = [
      { area: 'MAT', accuracy: 90, questions: 10 },
      { area: 'LC', accuracy: 20, questions: 10 },
    ];
    temaMasFlojo(filas);
    expect(filas[0]!.area).toBe('MAT');
  });
});
