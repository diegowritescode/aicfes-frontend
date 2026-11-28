const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Takes the device-admin receiver out of the merged manifest.
 *
 * `expo-screen-time` declares `ScreenTimeDeviceAdminReceiver`, and its
 * own manifest says why it matters: "an active admin cannot be
 * force-stopped from Settings and must be deactivated before the app
 * can be uninstalled".
 *
 * Google Play allows preventing uninstall only when "authorized by a
 * parent or guardian through a parental control app or by authorized
 * administrators through enterprise management software". AICFES is a
 * learner restricting themselves. No exception covers it. Blocking
 * ACCESS to an app is fine; preventing UNINSTALL is not.
 *
 * The library's own `features` option cannot drop it. Its gate reads
 * `['blocking', 'appRemovalProtection']` and keeps the element when
 * EITHER is requested — and `blocking` is the entire product. Leaving
 * `appRemovalProtection` out of `app.json` changes nothing on its
 * own; this was verified by running prebuild and finding the receiver
 * still merged. So the removal is written here instead.
 *
 * `tools:node="remove"` is the manifest merger's own instruction: the
 * app's manifest wins over a library's, and this is how a consumer
 * drops an element a dependency declares. Google documents it for
 * exactly this case — "an element in your merged manifest that you
 * don't need that was provided by a lower-priority manifest file
 * that's out of your control (such as an imported library)".
 *
 * ORDER MATTERS, and this cost an hour. In `app.json` this plugin is
 * registered BEFORE `expo-screen-time`, which makes it run AFTER —
 * Expo applies mods in reverse registration order. Registered after,
 * the library's own mod runs last, and its gate for this receiver
 * reads `['blocking', 'appRemovalProtection']`: since `blocking` IS
 * requested, the receiver counts as needed, and the mod actively
 * DELETES any removal node it finds for it. Our node was written and
 * then wiped, and the prebuilt manifest looked untouched.
 *
 * Verified against the real merged manifest, not this file:
 *
 *   ./gradlew :app:processReleaseManifest
 *   grep -c DeviceAdmin app/build/intermediates/merged_manifest/\
 *     release/processReleaseMainManifest/AndroidManifest.xml   # 0
 *
 * Declaring it is not activating it — the app never asks for the
 * `deviceAdmin` step, and `PASOS_PROHIBIDOS` keeps it off the screen.
 * But a reviewer reads the manifest, not our intentions, and an
 * element that cannot be activated has no reason to ship.
 */
const RECEPTOR = 'expo.modules.screentime.ScreenTimeDeviceAdminReceiver';

module.exports = function sinDeviceAdmin(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) throw new Error('[sin-device-admin] no hay <application> en el manifest');

    app.receiver = app.receiver ?? [];

    /* Idempotent: a prebuild that runs twice must not write it twice,
       and two identical removals are a merger error. */
    const yaEsta = app.receiver.some(
      (r) => r.$?.['android:name'] === RECEPTOR && r.$?.['tools:node'] === 'remove',
    );
    if (yaEsta) return cfg;

    /* Any real declaration of the same element goes first: requesting
       and removing one element in a single manifest is an error, not
       a last-one-wins. */
    app.receiver = app.receiver.filter((r) => r.$?.['android:name'] !== RECEPTOR);

    app.receiver.push({ $: { 'android:name': RECEPTOR, 'tools:node': 'remove' } });

    /* The `tools` namespace has to exist or the attribute is just a
       string the merger ignores. */
    const manifest = cfg.modResults.manifest;
    manifest.$ = manifest.$ ?? {};
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    return cfg;
  });
};
