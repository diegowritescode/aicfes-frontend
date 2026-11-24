import { useEffect, useState } from 'react';
import { almacenModeracion } from '@/core/almacenamiento/moderacion';

/**
 * Whether this device holds a moderation token.
 *
 * Reads the store in `core` rather than the moderation feature's own
 * hook: this lives in `shared`, and `shared` importing from `features`
 * is a layer violation the architecture test catches — correctly, since
 * it would make the drawer depend on a feature that may not exist.
 *
 * Only a boolean leaves this hook. The drawer needs to know whether to
 * show one entry; it has no business holding the secret.
 */
export function useHayTokenDeModeracion(): boolean {
  const [hay, setHay] = useState(false);

  useEffect(() => {
    let vivo = true;
    void almacenModeracion.leer().then((token) => {
      if (vivo) setHay(token !== null);
    });
    return () => {
      vivo = false;
    };
  }, []);

  return hay;
}
