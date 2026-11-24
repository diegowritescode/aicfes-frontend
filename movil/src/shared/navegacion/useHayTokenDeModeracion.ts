import { useEffect, useState } from 'react';
import { almacenModeracion } from '@/core/almacenamiento/moderacion';

/**
 * Whether this device can reach the moderation queue.
 *
 * Two ways, and the role is the one that matters (ADR 34): a
 * moderator signs in and the entry is there. The stored token stays
 * as a fallback, because losing access to the account must not lock
 * the only moderator out of a queue minors report into.
 *
 * Reads the store in `core` rather than the moderation feature's own
 * hook: this lives in `shared`, and `shared` importing from
 * `features` is a layer violation the architecture test catches.
 *
 * Only a boolean leaves here. The drawer needs to know whether to
 * show one entry; it has no business holding the secret.
 */
export function useHayTokenDeModeracion(esModerador: boolean): boolean {
  const [hayToken, setHayToken] = useState(false);

  useEffect(() => {
    let vivo = true;
    void almacenModeracion.leer().then((token) => {
      if (vivo) setHayToken(token !== null);
    });
    return () => {
      vivo = false;
    };
  }, []);

  return esModerador || hayToken;
}
