import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * What Google Play actually reads.
 *
 * Every other guard in this folder checks a source file: `app.json`'s
 * feature list, the plugin's registration order, the absence of a
 * `fetch`. Those are inputs. The manifest Gradle produces after
 * merging the app's own file with every library's is the output, and
 * the gap between the two is where the device-admin receiver hid for
 * a whole release: `app.json` looked right, the prebuilt manifest
 * looked right, and the merged manifest shipped the receiver anyway
 * because `expo-screen-time`'s mod ran last and deleted the removal
 * node.
 *
 * So this file asserts on the merged manifest itself.
 *
 * It is NOT regenerated here. Producing it means a Gradle run of
 * several minutes, which does not belong in a unit-test suite. The
 * test skips when the file is absent — on a clean checkout, in CI —
 * and runs when it exists, which is after every local release build.
 * A skip is honest: it says «not measured», which is different from
 * «fine». The alternative, asserting the file must exist, would turn
 * a fresh clone into a red suite and teach everyone to ignore it.
 *
 * Regenerate with:
 *   cd android && ./gradlew :app:processReleaseMainManifest
 */

const MANIFEST = join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'android',
  'app',
  'build',
  'intermediates',
  'merged_manifest',
  'release',
  'processReleaseMainManifest',
  'AndroidManifest.xml',
);

const existe = existsSync(MANIFEST);
const manifest = existe ? readFileSync(MANIFEST, 'utf8') : '';

/* `describe.skipIf` rather than a silent pass: a skipped test is
   visible in the runner's output, and a test that passes without
   reading anything is a lie about what was checked. */
describe.skipIf(!existe)('el manifest fusionado que Play va a leer', () => {
  it('no declara ningún receptor de device admin', () => {
    /* Device admin is a `<receiver>` with
       `android:permission="BIND_DEVICE_ADMIN"`, not a
       `uses-permission` — which is why `aapt2 dump permissions` shows
       nothing and I once told Diego the APK was clean when it was
       not. Both spellings are checked because the element and the
       permission can appear independently. */
    expect(
      manifest.includes('DeviceAdmin'),
      'volvió el receptor de device admin: impide desinstalar y es motivo de retiro de Play',
    ).toBe(false);

    expect(manifest.includes('BIND_DEVICE_ADMIN')).toBe(false);
  });

  it('no declara un AccessibilityService', () => {
    /* `accessibilityEngine: false` keeps this out. Turning it on
       costs a Play Console declaration, a demo video, listing
       documentation, and Google's instruction to «use more narrowly
       scoped APIs and permissions in lieu of the Accessibility API
       when possible» — which UsageStats plus an overlay already is.
       It is also the single biggest review risk this app could take
       on, so the absence is worth pinning at the output. */
    expect(
      manifest.includes('android.accessibilityservice'),
      'apareció un AccessibilityService: cambia por completo la revisión de Play',
    ).toBe(false);

    expect(manifest.includes('BIND_ACCESSIBILITY_SERVICE')).toBe(false);
  });

  it('no pide QUERY_ALL_PACKAGES', () => {
    /* A restricted permission: Google demands a permitted use and a
       declaration. The app does not need it — the learner picks apps
       in a system picker and the module returns an opaque id, so
       JavaScript never sees a package name and never enumerates. */
    expect(
      manifest.includes('QUERY_ALL_PACKAGES'),
      'QUERY_ALL_PACKAGES es un permiso restringido y la app no lo necesita',
    ).toBe(false);
  });

  it('sí pide los permisos que el bloqueo necesita', () => {
    /* The negative assertions above are worthless on their own: a
       manifest that lost the blocking permissions would satisfy every
       one of them. This is the paired positive — the thing Diego
       confirmed works on his phone has to still be declared. */
    expect(
      manifest.includes('android.permission.PACKAGE_USAGE_STATS'),
      'sin PACKAGE_USAGE_STATS la app no sabe qué app está adelante y no bloquea nada',
    ).toBe(true);

    expect(
      manifest.includes('android.permission.SYSTEM_ALERT_WINDOW'),
      'sin SYSTEM_ALERT_WINDOW no se puede dibujar el escudo encima de la otra app',
    ).toBe(true);
  });

  it('no pide el micrófono', () => {
    /* `expo-audio` declares `RECORD_AUDIO` for the whole library even
       when an app only plays sound. `useSonido` plays four synthesised
       tones and never records; nothing in the app asks for a
       microphone.
     *
     * It matters beyond tidiness: a declared microphone permission is
     * a question on the Data safety form and a line in the Play
     * listing's permission list, and «why does a study app listen?»
     * is the kind of doubt a reviewer resolves against a new
     * developer. If this test is red, the fix is a `tools:node`
     * removal in the same plugin that removed device admin — not a
     * change to this expectation. */
    expect(
      manifest.includes('android.permission.RECORD_AUDIO'),
      'RECORD_AUDIO está declarado: la app nunca graba, hay que quitarlo del manifest',
    ).toBe(false);
  });
});
