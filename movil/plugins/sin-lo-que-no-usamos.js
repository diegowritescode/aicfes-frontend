const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Takes out of the merged manifest the things a library declares and
 * this app does not use.
 *
 * Two of them today, for two different reasons — but one mechanism,
 * because they fail the same way: the declaration comes from a
 * dependency, `app.json` cannot reach it, and nothing warns.
 *
 * **1. `ScreenTimeDeviceAdminReceiver`, from `expo-screen-time`.**
 * Its own manifest says why it matters: "an active admin cannot be
 * force-stopped from Settings and must be deactivated before the app
 * can be uninstalled". Google Play allows preventing uninstall only
 * when "authorized by a parent or guardian through a parental control
 * app or by authorized administrators through enterprise management
 * software". AICFES is a learner restricting themselves. No exception
 * covers it. Blocking ACCESS to an app is fine; preventing UNINSTALL
 * is grounds for removal.
 *
 * The library's own `features` option cannot drop it. Its gate reads
 * `['blocking', 'appRemovalProtection']` and keeps the element when
 * EITHER is requested — and `blocking` is the entire product. Leaving
 * `appRemovalProtection` out of `app.json` changes nothing on its
 * own; verified by running prebuild and finding the receiver still
 * merged.
 *
 * **2. `RECORD_AUDIO`, from `expo-audio`.** The library declares it
 * for the whole package even when an app only plays sound.
 * `useSonido` plays four synthesised tones and never records; there
 * is no recording API call anywhere in `src`. A declared microphone
 * permission becomes a question on the Data safety form and a line in
 * the Play listing's permission list, and "why does a study app
 * listen?" is a doubt a reviewer resolves against a new developer.
 *
 * `tools:node="remove"` is the manifest merger's own instruction: the
 * app's manifest wins over a library's, and this is how a consumer
 * drops an element a dependency declares. Google documents it for
 * exactly this case — "an element in your merged manifest that you
 * don't need that was provided by a lower-priority manifest file
 * that's out of your control (such as an imported library)".
 *
 * ORDER MATTERS, and it cost an hour. In `app.json` this plugin is
 * registered BEFORE `expo-screen-time`, which makes it run AFTER —
 * Expo applies mods in reverse registration order. Registered after,
 * the library's own mod runs last, and its gate for the receiver
 * reads `['blocking', 'appRemovalProtection']`: since `blocking` IS
 * requested, the receiver counts as needed, and the mod actively
 * DELETES any removal node it finds for it. The node was written and
 * then wiped, and the prebuilt manifest looked untouched.
 *
 * Verified against the real merged manifest, never against this file:
 *
 *   cd android && ./gradlew :app:processReleaseMainManifest
 *
 * and `el-manifest-fusionado.test.ts` asserts on that output, so a
 * regression is a red test rather than a rejected release.
 *
 * Declaring is not activating: the app never asks for the
 * `deviceAdmin` step, `PASOS_PROHIBIDOS` keeps it off the screen, and
 * no code records audio. But a reviewer reads the manifest, not our
 * intentions, and a capability that cannot be used has no reason to
 * ship.
 */
const RECEPTOR = 'expo.modules.screentime.ScreenTimeDeviceAdminReceiver';

const PERMISOS = ['android.permission.RECORD_AUDIO'];

const TOOLS = 'http://schemas.android.com/tools';

module.exports = function sinLoQueNoUsamos(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    const app = manifest.application?.[0];
    if (!app) throw new Error('[sin-lo-que-no-usamos] no hay <application> en el manifest');

    /* The `tools` namespace has to exist or every attribute below is
       just a string the merger ignores — silently, which is the worst
       possible failure for a compliance fix. */
    manifest.$ = manifest.$ ?? {};
    if (!manifest.$['xmlns:tools']) manifest.$['xmlns:tools'] = TOOLS;

    quitar(app, 'receiver', RECEPTOR);
    for (const permiso of PERMISOS) quitar(manifest, 'uses-permission', permiso);

    return cfg;
  });
};

/**
 * Replaces every declaration of `nombre` under `padre[clave]` with a
 * single removal node.
 *
 * Idempotent, and it drops any real declaration first: requesting and
 * removing the same element in one manifest is a merger error, not a
 * last-one-wins.
 */
function quitar(padre, clave, nombre) {
  const lista = padre[clave] ?? [];

  const yaEsta = lista.some(
    (n) => n.$?.['android:name'] === nombre && n.$?.['tools:node'] === 'remove',
  );
  if (yaEsta) {
    padre[clave] = lista;
    return;
  }

  padre[clave] = [
    ...lista.filter((n) => n.$?.['android:name'] !== nombre),
    { $: { 'android:name': nombre, 'tools:node': 'remove' } },
  ];
}
