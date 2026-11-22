import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Where the session lives.
 *
 * On a device this is the OS keystore — encrypted, bound to the app,
 * unreadable by other apps. The web version kept the token in
 * `localStorage`, which any script on the page can read; moving to the
 * keystore is the one security gain that comes free with the port.
 *
 * On web there is no keystore, so it falls back to `localStorage`,
 * which is what the web app already did. The fallback is explicit
 * rather than silent: the same code runs on both platforms, and
 * pretending the guarantees are equal would be the dangerous part.
 *
 * Every read can fail — a cleared keystore, a private window, a
 * platform that refuses — and a failure to read a token means "not
 * signed in", never a crash on launch.
 */

const CLAVE_SESION = 'aicfes.sesion';

export interface Sesion {
  readonly token: string;
  readonly userId: string;
  readonly email: string;
  readonly nombre?: string;
}

const esWeb = Platform.OS === 'web';

async function leerCrudo(clave: string): Promise<string | null> {
  try {
    if (esWeb) return globalThis.localStorage?.getItem(clave) ?? null;
    return await SecureStore.getItemAsync(clave);
  } catch {
    return null;
  }
}

async function escribirCrudo(clave: string, valor: string): Promise<void> {
  try {
    if (esWeb) {
      globalThis.localStorage?.setItem(clave, valor);
      return;
    }
    await SecureStore.setItemAsync(clave, valor);
  } catch {
    /* A session that cannot be persisted still works for this run.
       Failing the sign-in over it would be worse than forgetting it. */
  }
}

async function borrarCrudo(clave: string): Promise<void> {
  try {
    if (esWeb) {
      globalThis.localStorage?.removeItem(clave);
      return;
    }
    await SecureStore.deleteItemAsync(clave);
  } catch {
    /* Already gone, or unreadable. Either way there is nothing left
       to do, and signing out must never fail. */
  }
}

export const almacenSesion = {
  async leer(): Promise<Sesion | null> {
    const crudo = await leerCrudo(CLAVE_SESION);
    if (!crudo) return null;
    try {
      const datos = JSON.parse(crudo) as Partial<Sesion>;
      // Stored by an older version, or corrupted. Treat it as absent
      // rather than handing a half-built session to the app.
      if (!datos.token || !datos.userId) return null;
      return datos as Sesion;
    } catch {
      return null;
    }
  },

  async guardar(sesion: Sesion): Promise<void> {
    await escribirCrudo(CLAVE_SESION, JSON.stringify(sesion));
  },

  async borrar(): Promise<void> {
    await borrarCrudo(CLAVE_SESION);
  },
};
