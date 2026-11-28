import Constants from 'expo-constants';

/**
 * Where the app points, resolved once.
 *
 * Read from the Expo config rather than scattered `process.env` reads:
 * on a device there is no shell to inherit variables from, so the value
 * has to be baked in at build time and there has to be one place that
 * knows how.
 *
 * It fails loudly when missing. A build that silently points at
 * localhost ships to a phone and fails there, where nobody can see the
 * console.
 */

function requerido(valor: string | undefined, nombre: string): string {
  if (!valor) {
    throw new Error(
      `Falta ${nombre}. Defínela en app.json (expo.extra) o en el entorno de build.`,
    );
  }
  return valor;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

/**
 * Which EAS profile built this binary.
 *
 * `NODE_ENV` cannot answer this: it is `production` in a preview APK
 * just as it is in the store build, so it cannot tell a tester's
 * build from a learner's. `__DEV__` is no better — false in both.
 *
 * The profile is the only signal that separates them, and it has to
 * be passed in from `eas.json` because the build environment does not
 * reach the bundle on its own. Missing means a local run.
 */
const perfil = extra.perfilDeBuild ?? process.env.EXPO_PUBLIC_PERFIL_BUILD ?? 'local';

export const entorno = {
  apiUrl: requerido(
    extra.apiUrl ?? process.env.EXPO_PUBLIC_API_URL,
    'apiUrl',
  ).replace(/\/+$/, ''),
  esProduccion: process.env.NODE_ENV === 'production',
  perfilDeBuild: perfil,
  /* A build meant for us to try things in: the development client, a
     preview APK, or a local run. The store build is the only one this
     is false for. Test-only screens key off this rather than
     `__DEV__`, which would hide them in the very APK handed to a
     tester. */
  esDePrueba: perfil !== 'production',
} as const;
