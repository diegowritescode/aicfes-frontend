import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Two bugs Diego found on a real phone, in one pass.
 *
 * Both have the same shape: a screen doing something on the learner's
 * behalf that the learner had not asked for and could not see coming.
 */

const RAIZ = join(__dirname, '..', '..');

describe('responder una pregunta resuelve la pregunta', () => {
  const FUENTE = readFileSync(
    join(RAIZ, 'features', 'examen', 'components', 'PantallaExamen.tsx'),
    'utf8',
  );

  /** `confirmar` only — the rest of the file cannot answer for it. */
  function confirmar(): string {
    const desde = FUENTE.indexOf('const confirmar = ');
    expect(desde, 'confirmar ya no se llama así').toBeGreaterThan(-1);
    const resto = FUENTE.slice(desde);
    const hasta = resto.indexOf('\n  const siguiente');
    const cuerpo = hasta === -1 ? resto : resto.slice(0, hasta);
    return cuerpo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  }

  /* Diego answered, and before he could see which option was right or
     read the explanation underneath, the tutoring panel opened over
     it asking what he had been thinking. He did not recognise the
     mechanic — correctly, because the screen underneath already does
     the thing he remembered, and the modal was covering it.

     ADR 17 decides what the tutor says once opened. It never said the
     panel opens by itself, and it describes a thread the learner
     opens. */
  it('responder no abre el tutor por su cuenta', () => {
    expect(
      /setTutoriaAbierta\(true\)/.test(confirmar()),
      'el tutor vuelve a taparle el resultado antes de que lo vea',
    ).toBe(false);
  });

  it('el resultado y la explicación se pintan al responder', () => {
    expect(/respondida \?/.test(FUENTE)).toBe(true);
    expect(
      /<Explicacion/.test(FUENTE),
      'sin explicación en pantalla, lo único que queda es el modal',
    ).toBe(true);
  });

  it('el tutor sigue siendo un botón que el estudiante escoge', () => {
    expect(/No entiendo por qué/.test(FUENTE)).toBe(true);
    expect(
      /debeAbrirTutoria\(item, elegida\)/.test(FUENTE),
      'sin esta regla el botón aparece sobre ítems que no tienen nada que decir',
    ).toBe(true);
  });
});

describe('entrenar abre en la materia que le dijeron', () => {
  const FUENTE = readFileSync(
    join(RAIZ, 'app', '(pestanas)', 'entrenar.tsx'),
    'utf8',
  );

  /* Inicio dice «Practicar Ciencias Naturales», el estudiante lo
     toca, y Entrenar abría en MIXTO. El parámetro sí viajaba: lo que
     fallaba era leerlo como estado inicial. Entrenar es una PESTAÑA —
     se monta una vez y se queda montada, así que el inicializador de
     `useState` corrió la primera vez que abrió la pestaña, sin
     parámetro, y no volvió a correr nunca. */
  it('reacciona al parámetro, no solo al montarse', () => {
    expect(
      /useEffect\(/.test(FUENTE),
      'sin efecto, una pestaña ya montada ignora el área que le mandan',
    ).toBe(true);

    const efecto = FUENTE.slice(FUENTE.indexOf('useEffect('));
    expect(
      /\[areaPedida\]/.test(efecto.slice(0, 400)),
      'el efecto tiene que depender del parámetro',
    ).toBe(true);
  });

  it('no pisa al que después escoge otra materia', () => {
    const efecto = FUENTE.slice(FUENTE.indexOf('useEffect('), FUENTE.indexOf('useEffect(') + 400);
    /* Keyed on the parameter and nothing else. A `[]` would apply it
       once and a missing array would re-apply it on every render,
       undoing a learner who arrived aimed at CN and then tapped
       Matemáticas. */
    expect(/\}, \[areaPedida\]\)/.test(efecto)).toBe(true);
  });

  it('quien manda el área la manda bien', () => {
    for (const pantalla of [
      join(RAIZ, 'app', '(pestanas)', 'inicio.tsx'),
      join(RAIZ, 'app', 'materias.tsx'),
    ]) {
      const fuente = readFileSync(pantalla, 'utf8');
      expect(
        /\/entrenar\?area=/.test(fuente),
        `${pantalla} ofrece practicar una materia y no dice cuál`,
      ).toBe(true);
    }
  });
});
