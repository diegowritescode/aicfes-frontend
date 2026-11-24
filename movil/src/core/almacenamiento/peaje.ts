import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * What the toll remembers between launches.
 *
 * `AsyncStorage` and not `SecureStore`: none of this is a secret, and
 * the toll has to work with no connection on a phone whose data ran
 * out — which is most phones, late in the month. The keystore would
 * buy nothing and cost a read that can fail.
 *
 * Every read returns the safe value on failure rather than throwing.
 * A corrupted block should start a new one, never leave a learner
 * staring at a crash with their phone locked.
 *
 * Generic in what it stores, because `core` must not know about a
 * feature's shapes — the layer test says so, and it is right: the
 * store's job is bytes and failure handling, and what those bytes
 * mean belongs to the feature that wrote them.
 */
const CLAVE_SESION = 'aicfes.peaje.sesion';
const CLAVE_EMERGENCIAS = 'aicfes.peaje.emergencias';
const CLAVE_DESBLOQUEO = 'aicfes.peaje.desbloqueoHasta';

async function leerJson<T>(clave: string): Promise<T | null> {
  try {
    const crudo = await AsyncStorage.getItem(clave);
    if (!crudo) return null;
    return JSON.parse(crudo) as T;
  } catch {
    /* Unparseable is the same as absent. The alternative — throwing
       into a screen the learner cannot leave — is worse than losing
       two answered questions. */
    return null;
  }
}

async function escribirJson(clave: string, valor: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* A block that cannot be saved still works for this run. Silence
       is right here, unlike in the session store, where a write that
       fails means the next launch signs the learner out. */
  }
}

export const almacenPeaje = {
  leerSesion: <T>() => leerJson<T>(CLAVE_SESION),

  guardarSesion: (sesion: unknown) => escribirJson(CLAVE_SESION, sesion),

  async borrarSesion(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CLAVE_SESION);
    } catch {
      // Nothing useful to do; the next block overwrites it anyway.
    }
  },

  leerEmergencias: <T>() => leerJson<T>(CLAVE_EMERGENCIAS),

  guardarEmergencias: (uso: unknown) => escribirJson(CLAVE_EMERGENCIAS, uso),

  /**
   * When the current unlock runs out, as an upper bound.
   *
   * The native layer meters the real budget — it only runs down while
   * a blocked app is in the foreground — so this is what the screen
   * can say before asking the native side. Stored so that the shield
   * does not re-block a learner who just paid and then closed the app.
   */
  async leerDesbloqueoHasta(): Promise<Date | null> {
    const iso = await leerJson<string>(CLAVE_DESBLOQUEO);
    if (!iso) return null;
    const fecha = new Date(iso);
    return Number.isFinite(fecha.getTime()) ? fecha : null;
  },

  guardarDesbloqueoHasta: (hasta: Date) =>
    escribirJson(CLAVE_DESBLOQUEO, hasta.toISOString()),
};
