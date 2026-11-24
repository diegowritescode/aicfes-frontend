import { useCallback, useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { useLote } from '@/features/offline/hooks/useLote';
import { useCola } from '@/features/offline/hooks/useCola';
import { useBloqueoPersistido } from '@/features/offline/hooks/useBloqueoPersistido';
import { PantallaPeaje } from '@/features/offline/components/PantallaPeaje';
import { POR_BLOQUE } from '@/features/offline/model/lote';
import { MINUTOS_DE_EMERGENCIA, textoDelBoton } from '@/features/offline/model/emergencia';
import { MINUTOS_DESBLOQUEO } from '@/features/offline/model/peaje';
import { useBloqueo } from '@/features/bloqueo/hooks/useBloqueo';
import type { IntentoDelPeaje } from '@/features/offline/model/peaje';

/**
 * The toll, as a route.
 *
 * Opened by the native shield when a blocked app is launched, and
 * reachable directly for validating the mechanic with learners.
 *
 * Everything it needs is on the device: the questions come from the
 * offline pool and the answers go into the queue. It works with the
 * radio off, which is the only way it can work at all.
 */
export default function RutaPeaje() {
  const { cargando, autenticado } = useSesion();

  /* The block is drawn inside `Bloque`, which only mounts once the
     session is known. Drawing it here would consume five questions
     from the pool before we know whether this person is signed in. */
  if (cargando) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  return <Bloque />;
}

function Bloque() {
  const router = useRouter();
  const lote = useLote();
  const cola = useCola();

  /* Held in a ref so the hook can call it exactly once, on the mount
     where there is nothing to resume. Calling it on every render
     would eat the pool several questions at a time for one block. */
  const tomar = useRef(() => lote.tomarBloque(POR_BLOQUE));
  const bloqueo = useBloqueoPersistido(() => tomar.current());
  const nativo = useBloqueo();

  /**
   * Back does not leave.
   *
   * This is what makes the toll a toll rather than an announcement.
   * Before it, the gesture dismissed the screen and reopening the
   * blocked app showed it again from the start — so the way past was
   * to press back twice.
   *
   * The exits that remain are deliberate: clearing the block, spending
   * an emergency, or an empty pool. Android's own navigation out of
   * the app still works, and should: this is a study aid, not a kiosk.
   */
  useEffect(() => {
    const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => suscripcion.remove();
  }, []);

  const salir = useCallback(() => {
    /* The native layer is what actually unblocks the other app; this
       route's job ends here. */
    router.replace('/inicio');
  }, [router]);

  const pagar = useCallback(
    (intentos: readonly IntentoDelPeaje[]) => {
      if (intentos.length > 0) {
        const ahora = new Date();
        const preguntas = bloqueo.sesion?.preguntas ?? [];
        const porId = new Map(preguntas.map((p) => [p.id, p]));
        const total = intentos.reduce((s, i) => s + i.tiempoMs, 0);

        /* Queued rather than sent. There is no network while the toll
           runs — that is the premise — so the work waits and the queue
           drains when a connection appears. */
        cola.añadir({
          id: `peaje-${ahora.getTime()}`,
          /* Derived from the answers rather than from a timer started
             on mount: the learner may have left the screen open for an
             hour, or closed it overnight and come back. What counts is
             the time they spent answering. */
          empezadoEn: new Date(ahora.getTime() - total).toISOString(),
          terminadoEn: ahora.toISOString(),
          respuestas: intentos.map((i, indice) => {
            const p = porId.get(i.itemId);
            return {
              itemId: i.itemId,
              questionIndex: indice,
              area: p?.area ?? 'MAT',
              dificultad: p?.dificultad ?? 'media',
              elegida: i.elegida,
              correcta: i.correcta,
              tiempoMs: i.tiempoMs,
            };
          }),
          intentos: 0,
        });
      }

      /* Cleared only now. Clearing it when the last question was
         answered would lose the answers if the queue write failed. */
      bloqueo.terminar();

      /* The reason the exercises were answered at all. Granted after
         the answers are queued, so a learner who earned their minutes
         keeps them even if the queue write fails — the opposite order
         would take the time away over a bookkeeping error.

         Minutes of use, not of clock: the native budget only runs
         down while a blocked app is in the foreground. */
      void nativo.conceder(MINUTOS_DESBLOQUEO);

      salir();
    },
    [cola, bloqueo, nativo, salir],
  );

  const usarEmergencia = useCallback(() => {
    /* The half-finished block is kept on purpose: five minutes later
       the same questions are still waiting. Clearing it would make
       the emergency a free reset of work already done. */
    if (!bloqueo.gastarEmergencia()) return;
    /* Shorter than a cleared block, and that gap is the argument for
       doing the exercises. */
    void nativo.conceder(MINUTOS_DE_EMERGENCIA);
    salir();
  }, [bloqueo, nativo, salir]);

  if (bloqueo.cargando) return null;

  return (
    <PantallaPeaje
      preguntas={bloqueo.sesion?.preguntas ?? []}
      intentos={bloqueo.sesion?.intentos ?? []}
      avanzadas={bloqueo.sesion?.avanzadas ?? 0}
      retomada={bloqueo.retomada}
      emergencia={{
        texto: textoDelBoton(bloqueo.emergenciasRestantes),
        disponible: bloqueo.puedeUsarEmergencia,
        usar: usarEmergencia,
      }}
      minutosDeEmergencia={MINUTOS_DE_EMERGENCIA}
      alResponder={bloqueo.responder}
      alAvanzar={bloqueo.avanzar}
      alPagar={pagar}
      alSaltar={salir}
    />
  );
}
