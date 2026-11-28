import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * «No hay nada» and «no cargó» must not look the same.
 *
 * A review of the profile redesign found this nine times in one
 * pass, which makes it a pattern rather than nine mistakes. Every
 * instance had the same shape: a hook defaults its data to `[]` or
 * `0`, the screen checks only `!cargando`, and a request that failed
 * renders as a confident statement about the learner —
 *
 *   «No has bloqueado a nadie» over a blocked list that never
 *   arrived. «Todavía no hay logros» to somebody with three.
 *   «Hoy no hay retos» when the panel request died. «Falta la
 *   autorización de tu acudiente», with the button to declare it,
 *   to an account that was authorised months ago.
 *
 * The last one is the reason this is a test and not a note. It does
 * not merely mislead: it invites a 16-year-old to go ask a parent
 * for permission they already gave, because the phone lost signal.
 *
 * The rule: a screen may only assert an empty state when it has the
 * data to assert it. `!cargando` is not that evidence — `isLoading`
 * goes false on failure too. The evidence is the data itself being
 * present, or the absence of an error.
 */

const RAIZ = join(__dirname, '..', '..');

function leer(...partes: string[]): string {
  return readFileSync(join(RAIZ, ...partes), 'utf8');
}

function codigo(fuente: string): string {
  return fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

describe('las pantallas nuevas distinguen vacío de fallo', () => {
  it('privacidad no afirma nada sin el perfil', () => {
    const c = codigo(leer('app', 'privacidad.tsx'));

    /* The strongest case. Every sentence on that screen is false by
       default, so it refuses to render any of them without the
       profile rather than guarding them one by one. */
    expect(
      /if \(!perfil\)/.test(c),
      'privacidad volvió a renderizar su contenido con el perfil ausente',
    ).toBe(true);
    expect(
      /tutorAutorizoEn/.test(c) && /const autorizado = Boolean\(perfil\.tutorAutorizoEn\)/.test(c),
      'la autorización se está leyendo con `?.`, que la da por ausente si falla la carga',
    ).toBe(true);
  });

  it('los estados vacíos esperan a tener datos, no solo a dejar de cargar', () => {
    for (const [archivo, centinela] of [
      ['retos.tsx', 'panel'],
      ['materias.tsx', 'panel'],
    ] as const) {
      const c = codigo(leer('app', archivo));

      /* `!cargando &&` alone is the bug: `isLoading` is false after a
         failure too. The empty state has to name the data it is
         talking about. */
      const vacios = c.match(/\{!cargando &&[^?]*\?/g) ?? [];
      for (const v of vacios) {
        expect(
          v.includes(centinela),
          `${archivo}: un estado vacío no comprueba ${centinela}, así que un fallo se lee como «no hay nada»`,
        ).toBe(true);
      }
    }
  });

  it('bloqueados y logros muestran el fallo antes que el vacío', () => {
    for (const archivo of ['bloqueados.tsx', 'logros.tsx']) {
      const c = codigo(leer('app', archivo));

      expect(
        /fallo \?/.test(c),
        `${archivo} no muestra el fallo: una lista vacía por error se lee como una lista vacía`,
      ).toBe(true);
    }
  });

  it('«Yo» pone — en vez de cero cuando no sabe', () => {
    const c = codigo(leer('app', '(pestanas)', 'yo.tsx'));

    /* Three counts, three sources that each default to empty. A row
       that says «0 de 0» or «al día» over a failed request is a
       statement about the learner that nothing supports. */
    expect(/'—'/.test(c), 'se perdió el marcador de «no sé» en las filas').toBe(true);
    expect(
      /amigos\.fallo/.test(c),
      '«Yo» cuenta amigos sin mirar si la consulta falló: isLoading es false tras un error',
    ).toBe(true);
  });
});

describe('los hooks no cachean un fallo como éxito', () => {
  it('useLogros y useDesgloseXp lanzan en vez de devolver null', () => {
    const c = codigo(leer('features', 'panel', 'hooks', 'usePanel.ts'));

    /* `return r.ok ? r.datos : null` inside a queryFn stores the
       failure AS DATA for the whole staleTime — ten minutes here —
       so a single bad request hides the achievements for ten
       minutes and no retry is attempted. */
    expect(
      /return r\.ok \? r\.datos : null/.test(c),
      'un queryFn volvió a devolver null en vez de lanzar: eso cachea el fallo como éxito',
    ).toBe(false);
  });
});
