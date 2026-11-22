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
const esProduccion = process.env.NODE_ENV === 'production';

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
  } catch (error) {
    /* This used to swallow the error entirely, on the theory that a
       session which cannot be persisted still works for this run.
       That reasoning was wrong here: the very next thing that happens
       after a sign-in is a navigation to a screen that re-reads the
       store, so a write that silently failed sends the learner
       straight back to the form with their typing gone and nothing on
       screen to explain it.
     *
       It still does not fail the sign-in — but it says so, loudly in
       development, and it rethrows so the caller can decide. */
    if (!esProduccion) {
      console.error(
        `No se pudo guardar "${clave}" en el almacén seguro:`,
        error instanceof Error ? error.message : error,
      );
    }
    throw error;
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

    /* Read it back. A keystore that accepts a write and returns
       nothing is not hypothetical — it is what a failed write looks
       like from the outside, and the failure only surfaces one screen
       later as a redirect nobody can explain. Better to know here. */
    const confirmado = await leerCrudo(CLAVE_SESION);
    if (!confirmado) {
      throw new Error(
        'La sesión no quedó guardada: el almacén aceptó la escritura pero devolvió vacío.',
      );
    }
  },

  async borrar(): Promise<void> {
    await borrarCrudo(CLAVE_SESION);
  },
};
