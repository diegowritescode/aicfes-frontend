import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * A screen whose whole purpose is to get the learner somewhere else
 * must say where.
 *
 * This exists because sign-in shipped without it. The mutation
 * succeeded, the token was stored, and the learner stayed on the form
 * with nothing on screen to explain why — the worst kind of failure,
 * because there is no error to read and nothing to report. Sign-up,
 * written minutes earlier, had the navigation. Nobody noticed the
 * asymmetry because both files pass a typecheck and neither has a
 * test that renders.
 *
 * It is deliberately narrow. Most mutations should NOT navigate:
 * answering a question, flagging it for review, writing to the tutor
 * and saving a session all act on the screen the learner is already
 * on. Only the gateway screens are checked.
 */

const RAIZ = join(__dirname, '../../app');

/** Screens that exist to let someone in. Getting past them IS the point. */
const PUERTAS = ['entrar.tsx', 'registro.tsx'];

function leer(archivo: string): string {
  return readFileSync(join(RAIZ, archivo), 'utf8');
}

/**
 * Every URL the app can be at, read off the filesystem.
 *
 * A folder in parentheses is a route group: Expo Router uses it to
 * share a layout and strips it from the URL, so `(pestanas)/inicio.tsx`
 * answers to `/inicio` and never to `/(pestanas)/inicio`. The five tab
 * screens moved into such a group to get a bar that persists across
 * changes, and every check below went red at once — each had built
 * this set by pasting the path together, so all three believed the
 * tabs had stopped existing.
 *
 * One function now, used by all of them: a path spelled wrong here
 * fails loudly instead of three subtly different ways.
 */
function rutasQueExisten(): Set<string> {
  const rutas = new Set<string>();
  const recorrer = (dir: string, prefijo = '') => {
    for (const entrada of readdirSync(dir)) {
      const completo = join(dir, entrada);
      if (statSync(completo).isDirectory()) {
        /* Dropped from the URL, not from the walk: the screens inside
           are reachable, they just do not carry the folder's name. */
        const grupo = /^\(.*\)$/.test(entrada);
        recorrer(completo, grupo ? prefijo : `${prefijo}/${entrada}`);
      } else if (entrada.endsWith('.tsx')) {
        const base = entrada.replace(/\.tsx$/, '');
        rutas.add(base === 'index' ? prefijo || '/' : `${prefijo}/${base}`);
      }
    }
  };
  recorrer(RAIZ);
  return rutas;
}

describe('las pantallas de entrada llevan a alguna parte', () => {
  it.each(PUERTAS)('%s navega cuando la mutación tiene éxito', (archivo) => {
    const fuente = leer(archivo);

    expect(fuente, `${archivo} no llama ninguna mutación`).toMatch(/\.mutate\(/);

    /* Either an explicit onSuccess with a router call, or a redirect
       driven by the session — both are real answers to "and then?". */
    const navegaAlLograrlo = /onSuccess:[\s\S]{0,120}?router\.(replace|push)/.test(fuente);
    const redirigePorSesion = /<Redirect\b/.test(fuente);

    expect(
      navegaAlLograrlo || redirigePorSesion,
      `${archivo} llama .mutate() y nunca navega al tener éxito. ` +
        `Una sesión iniciada que deja al estudiante en el formulario no muestra ningún error: ` +
        `parece que las credenciales fallaron cuando en realidad funcionaron.`,
    ).toBe(true);
  });

  it('toda ruta en app/ existe como archivo, para que los destinos no sean inventados', () => {
    /* A router.replace to a path that does not exist fails silently on
       web and throws on device. Catching it here is cheaper. */
    const archivos = rutasQueExisten();

    const destinos = new Set<string>();
    const buscarEn = (dir: string) => {
      for (const entrada of readdirSync(dir)) {
        const completo = join(dir, entrada);
        if (statSync(completo).isDirectory()) buscarEn(completo);
        else if (/\.tsx?$/.test(entrada) && !entrada.endsWith('.test.ts')) {
          const fuente = readFileSync(completo, 'utf8');
          for (const m of fuente.matchAll(
            /(?:router\.(?:replace|push)|href=)\(?["'`](\/[a-z-/]*)["'`]/g,
          )) {
            if (m[1] && !m[1].includes('${')) destinos.add(m[1]);
          }
        }
      }
    };
    buscarEn(join(__dirname, '../..'));

    const inexistentes = [...destinos].filter((d) => !archivos.has(d === '/' ? '/' : d));
    expect(inexistentes, `rutas que nadie define: ${inexistentes.join(', ')}`).toEqual([]);
  });

  /**
   * The tab bar's destinations, which the check above cannot see.
   *
   * That check scans for a literal path next to the call —
   * `router.push('/repaso')`. `BarraPestanas` holds its five routes in
   * an array and calls `router.replace(p.ruta as never)`, so every one
   * of them is invisible to it. The bar shipped with a fifth tab
   * pointing at `/yo`, a route that did not exist: a dead tab passed
   * the test whose entire job is to catch dead tabs.
   *
   * Read out of the array instead. The bar is the app's only
   * navigation now that the drawer is gone, so a tab that goes
   * nowhere is not a cosmetic defect — it is a part of the app the
   * learner cannot reach.
   */
  it('las pestañas de la barra apuntan a rutas que existen', () => {
    const fuente = readFileSync(
      join(__dirname, '../ui/organismos/BarraPestanas.tsx'),
      'utf8',
    );

    const rutas = [...fuente.matchAll(/ruta:\s*'(\/[a-z-/]+)'/g)].map((m) => m[1]!);

    /* An empty list would make the loop below assert nothing, which
       is exactly the failure this test exists to correct. */
    expect(rutas.length, 'no se leyó ninguna ruta de BarraPestanas').toBe(5);

    const archivos = rutasQueExisten();

    const muertas = rutas.filter((r) => !archivos.has(r));
    expect(
      muertas,
      `pestañas que no llevan a ningún archivo: ${muertas.join(', ')}. ` +
        `La barra es la única navegación de la app: una pestaña muerta es una parte ` +
        `de la app a la que el estudiante no puede llegar.`,
    ).toEqual([]);

    /* Reading the array is not enough on its own: the layout is what
       hands those routes to the navigator, and it could ignore them.
       Checking this was not hypothetical — replacing the layout's
       `href={p.ruta}` with a literal dead path left all five entries
       in the array correct and every test passing, because the array
       was the only thing anyone looked at.

       So: the layout must build its triggers from the list, and must
       not spell a path itself. Any literal `href` here is a route
       that no check in this file can follow. */
    const layout = readFileSync(join(RAIZ, '(pestanas)/_layout.tsx'), 'utf8');

    expect(
      layout,
      'el layout de pestañas no usa PESTANAS: las rutas verificadas arriba no son las que navega',
    ).toMatch(/PESTANAS\.map/);

    expect(
      layout,
      'el layout de pestañas recorre PESTANAS pero no pasa la ruta de cada entrada a su href',
    ).toMatch(/href=\{[a-z]+\.ruta\}/);

    const literales = [...layout.matchAll(/href=["'{]\s*["'`](\/[^"'`]*)["'`]/g)].map(
      (m) => m[1]!,
    );
    expect(
      literales,
      `el layout de pestañas escribe rutas a mano: ${literales.join(', ')}. ` +
        `Deben venir de PESTANAS, que es la lista que esta prueba verifica.`,
    ).toEqual([]);
  });
  /**
   * Every screen is reachable from inside the app.
   *
   * The checks above verify that the paths the code names exist. This
   * one verifies the opposite direction, which is the one that
   * actually failed: that a screen which exists is named by somebody.
   *
   * When the drawer was replaced by the five-tab bar, three finished
   * and fully designed modes — the mock exam, the timed ladder and
   * the app-blocking setup — lost their only entrance. Their only
   * caller had been the drawer's menu model, which stopped being
   * rendered. Nothing failed: the routes existed, the files compiled,
   * every test passed, and the modes were simply gone from the
   * running app. The user found them missing.
   *
   * A screen nobody links to is dead code that still costs a build,
   * or — worse, and this was the case — a whole feature the learner
   * paid for in download size and cannot open.
   */
  it('toda pantalla es alcanzable desde la app', () => {
    /* Reached some way other than by a link, and each for a reason:
       `index` is the entry point Expo Router mounts; `_layout` is a
       template, not a page; `+not-found` is Expo's own fallback;
       `peaje` and `salida` are opened by the native shield through
       `LlevarAlPeaje`, not by a tap; `entrar` and `registro` are
       reached by `<Redirect>` when there is no session. */
    const SIN_ENLACE = new Set([
      '/',
      '/_layout',
      '/+not-found',
      '/peaje',
      '/salida',
      '/entrar',
      '/registro',
    ]);

    const pantallas = [...rutasQueExisten()];

    /* Read from everything the app actually renders. A path named
       only inside a file that nothing imports — the dead drawer model
       was exactly that — must not count as an entrance, so the menu
       model is excluded by name until it is deleted. */
    let citado = '';
    const acumular = (dir: string) => {
      for (const entrada of readdirSync(dir)) {
        const completo = join(dir, entrada);
        if (statSync(completo).isDirectory()) acumular(completo);
        else if (/\.tsx?$/.test(entrada) && !/\.test\.tsx?$/.test(entrada)) {
          if (completo.includes('navegacion/model/menu.ts')) continue;
          citado += readFileSync(completo, 'utf8');
        }
      }
    };
    acumular(join(__dirname, '../..'));

    const huerfanas = pantallas.filter((p) => {
      if (SIN_ENLACE.has(p)) return false;
      /* A layout is a template wrapping its siblings, not a page
         anyone navigates to. True of `_layout` in any group. */
      if (p.endsWith('/_layout')) return false;
      /* A dynamic route is named by its directory: `/simulacro/[id]`
         is reached as `/simulacro/${id}`, so match the stem. */
      const raiz = p.replace(/\/\[[^\]]+\].*$/, '');
      return !citado.includes(`'${p}'`) && !citado.includes(`'${raiz}`) &&
        !citado.includes(`"${p}"`) && !citado.includes(`"${raiz}`) &&
        !citado.includes(`\`${raiz}`);
    });

    expect(
      huerfanas,
      `pantallas que existen y nadie abre: ${huerfanas.join(', ')}. ` +
        `El estudiante no puede llegar a ellas: pesan en la descarga y no se usan. ` +
        `Enlázalas desde una pestaña o desde una pantalla que sí sea alcanzable, ` +
        `o bórralas.`,
    ).toEqual([]);
  });
});
