import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * What a profile is allowed to put on screen, and what the app must
 * not decide for itself.
 *
 * The profile of somebody who is NOT your friend is new. It is the
 * first surface where one 16-year-old reads numbers about another,
 * and it only exists because that learner opted in — `progresoPublico`
 * is false by default and separate from being findable.
 *
 * Two things can go wrong here and neither is loud:
 *
 *   1. The screen renders a field the server did not mean for this
 *      viewer. The server already withholds those, so the real risk
 *      is the app inventing a value for a missing one.
 *   2. The screen decides for itself who may see what, drifting from
 *      the server's rule. There must be exactly one rule, and it is
 *      not here.
 */

const RAIZ = join(__dirname, '..', '..');
const PERFIL = readFileSync(
  join(__dirname, 'components', 'PantallaPerfil.tsx'),
  'utf8',
);

function codigo(fuente: string): string {
  return fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

function archivos(dir: string, acc: string[] = []): string[] {
  for (const entrada of readdirSync(dir)) {
    if (entrada === 'node_modules') continue;
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) archivos(ruta, acc);
    else if (/\.tsx?$/.test(entrada)) acc.push(ruta);
  }
  return acc;
}

describe('el perfil no decide quién ve qué', () => {
  it('usa la relación que manda el servidor', () => {
    const c = codigo(PERFIL);

    /* The server sends `relacion` precisely so this decision is made
       once. Working it out on the phone would need a friend list and
       a request list loaded first, and a screen that guesses offers
       «Enviar solicitud» to somebody who is already a friend. */
    expect(/perfil\.relacion/.test(c), 'el perfil dejó de leer la relación del servidor').toBe(
      true,
    );
  });

  it('no deduce la privacidad de que falten los datos', () => {
    const c = codigo(PERFIL);

    /* «No comparte su progreso» and «esto no cargó» look identical
       on screen and must not read the same. The server says which it
       is with `progresoOculto`; inferring it from `progreso === null`
       would show «es privado» every time the request failed. */
    expect(/progresoOculto/.test(c), 'ya no se lee progresoOculto').toBe(true);
    expect(
      /progreso\s*===\s*null|!perfil\.progreso\b/.test(c),
      'la privacidad se está deduciendo de la ausencia de datos en vez de leerla',
    ).toBe(false);
  });

  it('no inventa ceros cuando el progreso no viaja', () => {
    const c = codigo(PERFIL);

    /* A level of 0 on a private profile is a lie about that learner,
       and `?? 0` is how it would get written. */
    expect(
      /progreso\?\.\w+\s*\?\?\s*0/.test(c),
      'se está rellenando con cero un progreso que el servidor no mandó',
    ).toBe(false);
  });

  it('el cara a cara solo aparece con duelos jugados', () => {
    const c = codigo(PERFIL);

    /* A 0-0 record on a fresh friendship is noise on every profile. */
    expect(/caraACara\.jugados\s*>\s*0/.test(c)).toBe(true);
  });
});

describe('nadie pide el perfil de un amigo por el camino viejo', () => {
  it('solo PantallaPerfil usa usePerfilDeAmigo', () => {
    /* `perfilDeAmigo` survives for one thing: the weeks-in-a-row
       streak, which the public endpoint does not compute. If another
       screen starts calling it, there are two profile shapes again
       and they will disagree. */
    const usan = archivos(RAIZ)
      .filter((f) => /usePerfilDeAmigo\s*\(/.test(readFileSync(f, 'utf8')))
      .filter((f) => !/useDuelos\.ts$/.test(f))
      .map((f) => f.replace(RAIZ, ''));

    expect(usan).toEqual(['/features/duelos/components/PantallaPerfil.tsx']);
  });
});
