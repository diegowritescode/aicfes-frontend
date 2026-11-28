import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Every native call this app makes must exist in the module.
 *
 * This is here because one did not. `getScreenTimePermissionStatus`
 * was a guess; the module exports `getScreenTimePermissionsAsync`.
 * The wrapper did the right thing — it reported that the module has
 * no such call — and the screen showed an empty "Permisos" section
 * with no chips and no button. It read as a feature that had not been
 * built, which is the worst shape a typo can take: nothing errors,
 * nothing logs, and the person testing concludes the work is missing.
 *
 * TypeScript cannot catch it. The wrapper reaches the module through
 * a dynamic import and indexes it by string, which is deliberate —
 * the native side does not exist in Expo Go or on web, and a static
 * import there takes the whole screen down. The cost of that choice
 * is this test.
 */

function leer(ruta: string): string {
  return readFileSync(new URL(ruta, import.meta.url), 'utf8');
}

describe('los nombres nativos existen', () => {
  const envoltorio = leer('./nativo.ts');
  const tipos = leer(
    '../../../../node_modules/expo-screen-time/build/ExpoScreenTimeModule.d.ts',
  );

  /* Every string handed to `llamar(...)`, which is the only way this
     app reaches the native module. */
  /* The first string literal after each `llamar`. Matching through
     the generic argument was brittle: it can nest angle brackets and
     unions, so `[^>]*` stopped at the wrong place and found only
     some of the calls. A regex that matched nothing would make every
     assertion below pass vacuously, which is what the count check
     above exists to catch. */
  const llamados = [...envoltorio.matchAll(/llamar<[\s\S]*?\(\s*'([a-zA-Z]+)'/g)].map(
    (m) => m[1]!,
  );

  it('encuentra las llamadas en el envoltorio', () => {
    // A regex that matches nothing would make every assertion below vacuous.
    expect(llamados.length).toBeGreaterThanOrEqual(8);
  });

  it.each([...new Set(llamados)])('%s está declarado en el módulo', (nombre) => {
    /* Matched with its indentation so that a method named in a
       comment does not count as a declaration. */
    expect(tipos).toMatch(new RegExp(`\\n\\s{4}${nombre}\\s*[(<]`));
  });
});
