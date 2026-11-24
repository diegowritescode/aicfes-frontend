import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * The moderation token, kept on this device.
 *
 * Separate from the session store because it is a different kind of
 * secret: the session belongs to a learner and rotates on its own,
 * while this one is a shared server secret that a person pastes in
 * once.
 *
 * Kept in `SecureStore`, which is the keystore on Android rather than
 * a file the app can read back in plain text. It is still a secret on
 * a phone that can be lost — which is why rotating it is one
 * `openssl rand` and a container restart, documented in
 * `docs/MODERACION.md`, and why nothing here is on by default.
 */
const CLAVE = 'aicfes.moderacion.token';

const esWeb = Platform.OS === 'web';

export const almacenModeracion = {
  async leer(): Promise<string | null> {
    try {
      if (esWeb) return globalThis.localStorage?.getItem(CLAVE) ?? null;
      return await SecureStore.getItemAsync(CLAVE);
    } catch {
      /* A keystore that cannot be read means no token, which means the
         moderation screens stay hidden. Failing closed is right here:
         the alternative is a screen that looks available and is not. */
      return null;
    }
  },

  async guardar(token: string): Promise<boolean> {
    const limpio = token.trim();
    if (limpio.length === 0) return false;
    try {
      if (esWeb) {
        globalThis.localStorage?.setItem(CLAVE, limpio);
        return true;
      }
      await SecureStore.setItemAsync(CLAVE, limpio);
      return true;
    } catch {
      return false;
    }
  },

  async borrar(): Promise<void> {
    try {
      if (esWeb) {
        globalThis.localStorage?.removeItem(CLAVE);
        return;
      }
      await SecureStore.deleteItemAsync(CLAVE);
    } catch {
      // Nothing useful to do: the caller is signing out either way.
    }
  },
};
