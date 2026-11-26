import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The app speaks to a sixteen-year-old, not to a bank customer.
 *
 * This exists because "usted" crept into the toll beside screens
 * that said "tú" — "Hoy no puedo (le quedan 2)" one tap away from
 * "Cinco preguntas y entras." Two registers in one flow read as two
 * different apps talking, and the formal one is the register of
 * paperwork.
 *
 * Only the toll and blocking are checked. The rest of the app is
 * older and mixed, and a test that fails on day one is a test
 * somebody deletes.
 */

const RAIZ = new URL('../../', import.meta.url).pathname;

const VIGILADAS = [
  'features/offline',
  'features/bloqueo',
  'app/peaje.tsx',
  'app/salida.tsx',
];

/* Forms that only exist in the formal register. `su` is absent on
   purpose: "su respuesta" is ambiguous and the false positives would
   outnumber the finds. */
const FORMALES = [
  /\bustedes?\b/i,
  /\ble quedan?\b/,
  /\bsu[s]? (salidas?|avance|tiempo)\b/i,
  /\bYa us[oó]/,
  /\bEscoja\b/,
  /\bRevise\b/,
  /\bVuelva\b/,
  /\bConceda\b/,
  /\bTermine\b/,
  /\bInt[eé]ntelo\b/,
  /\bEspere\b/,
];

/* No trailing `\b` after an accented letter. JavaScript's `\b` is
   defined over `[A-Za-z0-9_]`, so there is no word boundary after
   `ó` — `/\bYa usó\b/` matches nothing at all. That is how the first
   version of this test passed while the string it was written for
   sat in the code: a test that cannot fail is worse than no test,
   because it is counted as coverage. */

/* `puede` is deliberately absent from this list. It flags "el
   teléfono no puede" and "Android puede apagarnos", where the
   subject is the device rather than the learner — correct in both
   registers. A check that fires on correct text is a check somebody
   disables. */

function archivos(ruta: string): string[] {
  const completa = join(RAIZ, ruta);
  if (statSync(completa).isFile()) return [completa];
  return readdirSync(completa, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? archivos(join(ruta, e.name))
      : e.name.endsWith('.ts') || e.name.endsWith('.tsx')
        ? [join(completa, e.name)]
        : [],
  );
}

/**
 * Only what a learner reads: quoted strings and JSX text.
 *
 * The first version filtered these again for accents or a loose
 * lowercase word, and that filter silently dropped the very string
 * this test was written for — "Ya usó sus dos salidas de hoy". A
 * test that cannot fail is worse than no test, so the filter is gone
 * and the few identifiers that slip through are harmless: the
 * formal-register patterns do not match code.
 */
function textosVisibles(fuente: string): string[] {
  const sinComentarios = fuente
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  const literales = sinComentarios.match(/'[^'\n]{8,}'/g) ?? [];
  const plantillas = sinComentarios.match(/`[^`\n]{8,}`/g) ?? [];
  const jsx = sinComentarios.match(/>\s*[A-ZÁÉÍÓÚÑ¿¡][^<>{}\n]{8,}</g) ?? [];
  return [...literales, ...plantillas, ...jsx];
}

describe('el peaje tutea', () => {
  const encontrados = VIGILADAS.flatMap(archivos).filter(
    (f) => !f.endsWith('.test.ts') && !f.endsWith('.test.tsx'),
  );

  it('encuentra los archivos que vigila', () => {
    /* A list that comes back empty would make the assertion below
       pass without reading anything. */
    expect(encontrados.length).toBeGreaterThan(5);
  });

  const sospechosos = encontrados.flatMap((f) =>
    textosVisibles(readFileSync(f, 'utf8'))
      .filter((t) => FORMALES.some((r) => r.test(t)))
      .map((t) => `${f.replace(RAIZ, '')}: ${t.trim()}`),
  );

  it('no quedan formas de "usted" en lo que lee el estudiante', () => {
    expect(sospechosos).toEqual([]);
  });
});
