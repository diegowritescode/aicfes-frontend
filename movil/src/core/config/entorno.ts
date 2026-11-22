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

export const entorno = {
  apiUrl: requerido(
    extra.apiUrl ?? process.env.EXPO_PUBLIC_API_URL,
    'apiUrl',
  ).replace(/\/+$/, ''),
  esProduccion: process.env.NODE_ENV === 'production',
} as const;
