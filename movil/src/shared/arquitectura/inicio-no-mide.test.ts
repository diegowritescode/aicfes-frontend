import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The dashboard does not measure the learner, and nothing was deleted
 * in the process.
 *
 * This has gone wrong three times, in both directions.
 *
 * First the dashboard grew the level, the XP breakdown, the missions,
 * the achievements and a reminder setting — eight sections of
 * self-measurement before anything to do. Those moved to «Yo». Then
 * the streak chip and five subject rows were still there, the same
 * drift in smaller pieces, so they moved too.
 *
 * Then it overshot. What was left on the dashboard was a greeting,
 * one line and a button — Diego's word was «vacía» — while «Yo» had
 * become a wall of eight stacked sections nobody could read. Both
 * screens were wrong at once, for the same reason: the question had
 * been «which of the two screens holds this», when the answer for
 * most of it was «its own screen, behind a link».
 *
 * So the rule these tests protect is not a split between two files.
 * It is:
 *
 *   - The dashboard may show what is true TODAY and what to do about
 *     it. Not accumulated self-measurement: the level bar, the XP
 *     breakdown, the per-subject percentages, the achievements.
 *   - «Yo» is an index, not a wall. It links to the detail; it does
 *     not render it.
 *   - Nothing may be deleted on the way. Every number has to be
 *     somewhere, and these tests name the file.
 *
 * The streak chip is the one deliberate exception, and it is worth
 * writing down rather than quietly allowing. It is one glyph and one
 * digit in the header — not a card, not a section. It is the only
 * number that changes BY opening the app today, so it is the receipt
 * for having opened it. The full streak, with the longest run and the
 * forgiven day, still lives on «Yo». The test below pins the chip to
 * that shape: if it grows a card, this fails.
 */

const RAIZ = join(__dirname, '..', '..');

function leer(...partes: string[]): string {
  return readFileSync(join(RAIZ, ...partes), 'utf8');
}

const INICIO = leer('app', '(pestanas)', 'inicio.tsx');
const YO = leer('app', '(pestanas)', 'yo.tsx');
const MATERIAS = leer('app', 'materias.tsx');
const RETOS = leer('app', 'retos.tsx');
const LOGROS = leer('app', 'logros.tsx');

/** Source with comments stripped: the comments here name the numbers. */
function codigo(fuente: string): string {
  return fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

describe('inicio no acumula medición', () => {
  it('no muestra el nivel ni el XP', () => {
    const c = codigo(INICIO);

    for (const campo of ['level.', 'currentXp', 'nextLevelXp', 'avanceDeNivel']) {
      expect(c.includes(campo), `${campo} volvió al panel: eso es «Yo»`).toBe(false);
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

  it('no muestra los logros ni el desglose de XP', () => {
    expect(/SeccionLogros|DesgloseXp/.test(codigo(INICIO))).toBe(false);
  });

  it('nombra el área más floja y abre la práctica en ella', () => {
    const c = codigo(INICIO);

    /* A dashboard that names a subject and then opens a generic
       picker has named it for nothing. */
    expect(/areaMasFloja/.test(c)).toBe(true);
    expect(
      /entrenar\?area=/.test(c),
      'el botón ya no lleva el área: nombrarla no sirve de nada',
    ).toBe(true);
  });

  it('la racha en inicio es un chip, no una tarjeta', () => {
    const c = codigo(INICIO);

    /* The exception, pinned to its shape. The chip may read
       `currentDays`; it may not grow the longest run or the forgiven
       day, because those turn it into a section about how the
       learner is doing. */
    expect(/streak\.longestDays/.test(c), 'la racha larga es de «Yo»').toBe(false);
    expect(/perdonUsado/.test(c), 'el día perdonado es de «Yo»').toBe(false);
    expect(
      /muestraRacha/.test(c),
      'una racha de cero es un reproche: hay que seguir usando muestraRacha',
    ).toBe(true);
  });

  it('muestra un solo reto, no la lista', () => {
    const c = codigo(INICIO);

    /* One mission with its bar is today's work. Three stacked cards
       is the list, and the list has its own screen. */
    expect(/misionesPendientes/.test(c)).toBe(true);
    expect(
      /\.slice\(0,\s*3\)/.test(c),
      'volvieron las tres misiones apiladas: eso es /retos',
    ).toBe(false);
  });
});

describe('yo enlaza en vez de apilar', () => {
  it('no renderiza las materias, los retos ni los logros', () => {
    const c = codigo(YO);

    /* The wall. Each of these is a section «Yo» used to draw inline,
       and each now has a screen. */
    expect(/FilaMateria/.test(c), 'las materias volvieron a apilarse en «Yo»').toBe(false);
    expect(/SeccionLogros/.test(c), 'los logros volvieron a apilarse').toBe(false);
    expect(/DesgloseXp/.test(c), 'el desglose de XP volvió a apilarse').toBe(false);
    expect(
      /TarjetaInforme/.test(c),
      'el informe volvió a apilarse: tiene pantalla propia',
    ).toBe(false);
  });

  it('enlaza a cada una de esas pantallas', () => {
    const c = codigo(YO);

    for (const ruta of ['/materias', '/retos', '/logros', '/informe', '/amigos']) {
      expect(c.includes(ruta), `«Yo» ya no lleva a ${ruta}`).toBe(true);
    }
  });

  it('tiene la rueda de ajustes y no la sección', () => {
    const c = codigo(YO);

    expect(c.includes('/ajustes'), 'se perdió la entrada a Ajustes').toBe(true);
    /* The two settings that used to be cards at the bottom of this
       screen. They live in `/ajustes` now. */
    expect(/TarjetaRecordatorio/.test(c), 'el recordatorio volvió a «Yo»').toBe(false);
    expect(
      /'\/bloqueo'/.test(c),
      'el bloqueo de apps volvió a «Yo»: está en Ajustes',
    ).toBe(false);
  });

  it('muestra quién es el estudiante, que es lo que le faltaba', () => {
    const c = codigo(YO);

    /* The complaint that started this: «yo no veo mi perfil, dónde
       está pues». The alias and the avatar were behind the Jugar tab
       and this screen showed an email. */
    expect(/CabeceraDePerfil/.test(c), 'no hay perfil en la pantalla del perfil').toBe(true);
    expect(c.includes('/perfil-publico'), 'no hay forma de editar el perfil').toBe(true);
  });

  it('no muestra el correo', () => {
    /* It identifies the account off-app, and this is the screen a
       learner shows a friend. It lives in Ajustes. */
    expect(
      /sesion\?\.email/.test(codigo(YO)),
      'el correo volvió a «Yo»: es el único campo que identifica la cuenta fuera de la app',
    ).toBe(false);
  });
});

describe('nada se borró al repartir', () => {
  it('la racha completa sigue existiendo', () => {
    const c = codigo(YO);

    expect(
      /streak\.currentDays/.test(c),
      'la racha no está en ninguna pantalla: se borró en vez de moverse',
    ).toBe(true);
    expect(/perdonUsado/.test(c), 'el día perdonado se perdió').toBe(true);
  });

  it('el nivel y su barra siguen en «Yo»', () => {
    expect(/avanceDeNivel/.test(codigo(YO))).toBe(true);
  });

  it('las materias y el desglose están en /materias', () => {
    const c = codigo(MATERIAS);

    expect(/FilaMateria/.test(c)).toBe(true);
    expect(/filasDeArea/.test(c)).toBe(true);
    expect(/porcentaje=/.test(c)).toBe(true);
    expect(/DesgloseXp/.test(c), 'el desglose de XP se perdió al mover').toBe(true);
  });

  it('los retos están en /retos, y ahora todos', () => {
    const c = codigo(RETOS);

    expect(/misionesPendientes/.test(c)).toBe(true);
    expect(
      /\.slice\(0,\s*3\)/.test(c),
      'la pantalla propia no debería recortar a tres: ese tope existía por falta de espacio',
    ).toBe(false);
  });

  it('los logros están en /logros', () => {
    expect(/SeccionLogros/.test(codigo(LOGROS))).toBe(true);
  });
});
