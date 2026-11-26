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
    const archivos = new Set<string>();
    const recorrer = (dir: string, prefijo = '') => {
      for (const entrada of readdirSync(dir)) {
        const completo = join(dir, entrada);
        if (statSync(completo).isDirectory()) {
          recorrer(completo, `${prefijo}/${entrada}`);
        } else if (entrada.endsWith('.tsx')) {
          const base = entrada.replace(/\.tsx$/, '');
          archivos.add(base === 'index' ? prefijo || '/' : `${prefijo}/${base}`);
        }
      }
    };
    recorrer(RAIZ);

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

    const archivos = new Set<string>();
    const recorrer = (dir: string, prefijo = '') => {
      for (const entrada of readdirSync(dir)) {
        const completo = join(dir, entrada);
        if (statSync(completo).isDirectory()) recorrer(completo, `${prefijo}/${entrada}`);
        else if (entrada.endsWith('.tsx')) {
          const base = entrada.replace(/\.tsx$/, '');
          archivos.add(base === 'index' ? prefijo || '/' : `${prefijo}/${base}`);
        }
      }
    };
    recorrer(RAIZ);

    const muertas = rutas.filter((r) => !archivos.has(r));
    expect(
      muertas,
      `pestañas que no llevan a ningún archivo: ${muertas.join(', ')}. ` +
        `La barra es la única navegación de la app: una pestaña muerta es una parte ` +
        `de la app a la que el estudiante no puede llegar.`,
    ).toEqual([]);
  });
});
