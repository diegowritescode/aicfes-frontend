import { useCallback, useEffect, useState } from 'react';
import { almacenPeaje } from '@/core/almacenamiento/peaje';
import type { PreguntaDelLote } from '../api/esquemas';
import type { IntentoDelPeaje } from '../model/peaje';
import {
  avanzarSesion,
  empezarSesion,
  progreso,
  registrarIntento,
  sesionUtilizable,
  type SesionGuardada,
} from '../model/sesionDelPeaje';
import {
  puedeUsarEmergencia,
  quedanHoy,
  usarEmergencia,
  type UsoDeEmergencia,
} from '../model/emergencia';

/**
 * A block that survives leaving the screen.
 *
 * The defect this fixes is not cosmetic: before it, a learner on
 * question 2 of 5 could press back, reopen the blocked app and start
 * again at zero. That turns the toll into an announcement.
 *
 * Every answer is written to the device as it happens, not at the
 * end. Saving on completion would lose exactly the case this exists
 * for — the learner who leaves midway.
 */
export function useBloqueoPersistido(nuevasPreguntas: () => readonly PreguntaDelLote[]) {
  const [sesion, setSesion] = useState<SesionGuardada | null>(null);
  const [emergencias, setEmergencias] = useState<UsoDeEmergencia | null>(null);
  const [cargando, setCargando] = useState(true);
  const [retomada, setRetomada] = useState(false);

  useEffect(() => {
    let vivo = true;

    void (async () => {
      const [guardada, uso] = await Promise.all([
        almacenPeaje.leerSesion<SesionGuardada>(),
        almacenPeaje.leerEmergencias<UsoDeEmergencia>(),
      ]);
      if (!vivo) return;

      setEmergencias(uso);

      if (sesionUtilizable(guardada)) {
        setSesion(guardada);
        setRetomada(progreso(guardada!).retomada);
      } else {
        /* Questions are drawn only when there is nothing to resume.
           Drawing them first would eat five from the pool on every
           return to a half-finished block. */
        const fresca = empezarSesion(nuevasPreguntas());
        setSesion(fresca);
        void almacenPeaje.guardarSesion(fresca);
      }

      setCargando(false);
    })();

    return () => {
      vivo = false;
    };
    /* Once, on mount. `nuevasPreguntas` draws from the pool, so a
       re-run would consume it. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Records an answer and writes it to the device immediately. */
  const responder = useCallback((intento: IntentoDelPeaje) => {
    setSesion((actual) => {
      if (!actual) return actual;
      const siguiente = registrarIntento(actual, intento);
      void almacenPeaje.guardarSesion(siguiente);
      return siguiente;
    });
  }, []);

  const avanzar = useCallback(() => {
    setSesion((actual) => {
      if (!actual) return actual;
      const siguiente = avanzarSesion(actual);
      void almacenPeaje.guardarSesion(siguiente);
      return siguiente;
    });
  }, []);

  /** Clears the saved block. Called once its answers are queued. */
  const terminar = useCallback(() => {
    void almacenPeaje.borrarSesion();
  }, []);

  /**
   * Spends one of today's ways out.
   *
   * The saved block is kept, not cleared: an emergency buys five
   * minutes, and when they run out the same half-finished block is
   * still waiting. Clearing it would make the emergency a free reset
   * of the work already done.
   */
  const gastarEmergencia = useCallback((): boolean => {
    if (!puedeUsarEmergencia(emergencias)) return false;
    const siguiente = usarEmergencia(emergencias);
    setEmergencias(siguiente);
    void almacenPeaje.guardarEmergencias(siguiente);
    return true;
  }, [emergencias]);

  return {
    sesion,
    cargando,
    /* True when this block was already in progress. Worth saying on
       screen: a learner who answered two last night and sees "3 de 5"
       would otherwise think the app invented the number. */
    retomada,
    responder,
    avanzar,
    terminar,
    emergenciasRestantes: quedanHoy(emergencias),
    puedeUsarEmergencia: puedeUsarEmergencia(emergencias),
    gastarEmergencia,
  };
}
