import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The dashboard does not measure the learner. «Yo» does.
 *
 * This has gone wrong twice. The dashboard first grew the level, the
 * XP breakdown, the day's missions, the achievements and a reminder
 * setting — eight sections of self-measurement before the learner
 * reached anything to do. Those moved to «Yo». Then the streak chip
 * and five subject rows with percentages were still there, which is
 * the same drift in smaller pieces.
 *
 * It keeps happening because every one of those numbers is genuinely
 * interesting, and the dashboard is the screen everyone opens. The
 * rule that holds is about the screen's job: it exists to get
 * somebody into practice, and a number that does not change what they
 * tap next belongs in the tab for looking at yourself.
 *
 * Nothing here is about deleting numbers. Every one of them is in
 * «Yo», and these tests check both ends — gone from one screen and
 * present on the other — because a move that only deletes is a
 * regression wearing a tidy diff.
 */

const RAIZ = join(__dirname, '..', '..');

const INICIO = readFileSync(join(RAIZ, 'app', '(pestanas)', 'inicio.tsx'), 'utf8');
const YO = readFileSync(join(RAIZ, 'app', '(pestanas)', 'yo.tsx'), 'utf8');

/** Source with comments stripped: the comments here name the numbers. */
function codigo(fuente: string): string {
  return fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

describe('inicio no mide', () => {
  it('no muestra la racha', () => {
    expect(
      /streak\./.test(codigo(INICIO)),
      'la racha volvió al panel: es un número que no cambia qué toca el estudiante',
    ).toBe(false);
  });

  it('no muestra el nivel ni el XP', () => {
    const c = codigo(INICIO);

    for (const campo of ['level.', 'currentXp', 'nextLevelXp', 'avanceDeNivel']) {
      expect(
        c.includes(campo),
        `${campo} volvió al panel: eso es «Yo»`,
      ).toBe(false);
    }
  });

  it('no lista las cinco materias con su porcentaje', () => {
    const c = codigo(INICIO);

    expect(
      /FilaMateria/.test(c),
      'las filas de materia volvieron: el panel pedía leer cinco cifras para decidir una cosa',
    ).toBe(false);
    expect(/filasDeArea/.test(c)).toBe(false);
  });

  it('no muestra las misiones ni los logros', () => {
    const c = codigo(INICIO);

    expect(/misionesPendientes|SeccionLogros|DesgloseXp/.test(c)).toBe(false);
  });

  it('nombra el área más floja y abre la práctica en ella', () => {
    const c = codigo(INICIO);

    /* The replacement for the five rows. A dashboard that names a subject and
       then opens a generic picker has named it for nothing. */
    expect(/areaMasFloja/.test(c)).toBe(true);
    expect(
      /entrenar\?area=/.test(c),
      'el botón ya no lleva el área: nombrarla no sirve de nada',
    ).toBe(true);
  });
});

describe('yo tiene lo que inicio dejó', () => {
  it('tiene la racha', () => {
    const c = codigo(YO);

    expect(
      /streak\.currentDays/.test(c),
      'la racha no está en ninguna de las dos pantallas: se borró en vez de moverse',
    ).toBe(true);
    /* The chip had room for the current run only. The longest run and
       the forgiven day were in the API and shown nowhere. */
    expect(/streak\.longestDays/.test(c)).toBe(true);
    expect(/perdonUsado/.test(c)).toBe(true);
  });

  it('tiene las cinco materias con su porcentaje', () => {
    const c = codigo(YO);

    expect(
      /FilaMateria/.test(c),
      'las materias no están en ninguna de las dos pantallas',
    ).toBe(true);
    expect(/filasDeArea/.test(c)).toBe(true);
    expect(/porcentaje=/.test(c)).toBe(true);
  });

  it('sigue teniendo el nivel y el XP', () => {
    const c = codigo(YO);

    expect(/avanceDeNivel/.test(c)).toBe(true);
    expect(/DesgloseXp/.test(c)).toBe(true);
  });

  it('no muestra una racha de cero', () => {
    /* A streak of zero is a reproach, not encouragement — the rule
       `muestraRacha` exists for, and it had to travel with it. */
    expect(/muestraRacha/.test(codigo(YO))).toBe(true);
  });
});
