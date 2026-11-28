import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Whether the app is allowed to make noise.
 *
 * `AsyncStorage` and not `SecureStore`, for the reason the toll's own
 * store gives: this is not a secret, and the keystore would cost a
 * read that can fail for nothing.
 *
 * Reads return `true` on failure rather than throwing. Sound on is the
 * state the learner chose by not turning it off, and a storage error
 * must not silently mute a feature they enabled.
 */
const CLAVE = 'aicfes.sonido.activo';

export async function sonidoEstaActivo(): Promise<boolean> {
  try {
    const crudo = await AsyncStorage.getItem(CLAVE);
    /* Never written means never turned off. The default is on, because
       a game whose sound has to be discovered in settings is a game
       nobody hears. */
    return crudo === null ? true : crudo === 'si';
  } catch {
    return true;
  }
}

export async function guardarSonido(activo: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(CLAVE, activo ? 'si' : 'no');
  } catch {
    /* A preference that fails to save is a preference that reverts on
       restart, which is bad but not worth a crash in front of a
       learner. */
  }
}
