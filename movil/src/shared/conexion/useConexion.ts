import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import type { EstadoConexion } from '@/core/http/model/conexion';

/**
 * Whether there is a network, as the device reports it.
 *
 * Starts at `desconocido` rather than assuming either answer: on a
 * cold start the radio has not replied yet, and guessing "offline"
 * shows a flash of alarm for a connection that is fine.
 */
export function useConexion(): EstadoConexion {
  const [estado, setEstado] = useState<EstadoConexion>('desconocido');

  useEffect(() => {
    /* `isInternetReachable` is the honest field. `isConnected` is true
       on a captive portal — a hotel wifi that intercepts everything —
       where every request fails despite being "connected". It can be
       null while the check is in flight, which stays `desconocido`. */
    return NetInfo.addEventListener((red) => {
      if (red.isInternetReachable === null) {
        setEstado(red.isConnected ? 'desconocido' : 'sin-red');
        return;
      }
      setEstado(red.isInternetReachable ? 'con-red' : 'sin-red');
    });
  }, []);

  return estado;
}
