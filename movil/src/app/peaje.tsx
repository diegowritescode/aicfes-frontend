import { useCallback, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { useLote } from '@/features/offline/hooks/useLote';
import { useCola } from '@/features/offline/hooks/useCola';
import { PantallaPeaje } from '@/features/offline/components/PantallaPeaje';
import { POR_BLOQUE } from '@/features/offline/model/lote';
import type { IntentoDelPeaje } from '@/features/offline/model/peaje';
import type { PreguntaDelLote } from '@/features/offline/api/esquemas';

/**
 * The toll, as a route.
 *
 * Reachable today by navigating here, which is how the mechanic gets
 * validated with real learners before the native app-blocking exists.
 * When that exists, the shield's button opens this same route — on iOS
 * through `openParentalControlsApp`, on Android from the overlay.
 *
 * Everything it needs is already on the device: the questions come
 * from the offline pool and the answers go into the queue. It works
 * with the radio off, which is the only way it can work at all.
 */
export default function RutaPeaje() {
  const { cargando, autenticado } = useSesion();

  /* The block is drawn inside `Bloque`, which only mounts once the
     session is known. Drawing it here would consume five questions
     from the pool before we know whether this person is signed in —
     and an anonymous visit would quietly cost a learner their next
     toll block. */
  if (cargando) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  return <Bloque />;
}

function Bloque() {
  const router = useRouter();
  const lote = useLote();
  const cola = useCola();

  /* Drawn once and held. Calling `tomarBloque` on every render would
     eat the pool several questions at a time for one block the learner
     is answering — a bug that surfaces days later as "the toll ran out
     of questions".
     
     An effect would be the usual shape and is wrong here: the block
     has to exist for the first render, or the screen flashes its
     empty-pool message and tells the learner they pass free when they
     do not. */
  const [preguntas] = useState<readonly PreguntaDelLote[]>(() =>
    lote.tomarBloque(POR_BLOQUE),
  );

  const salir = useCallback(() => {
    /* Back to where they were. The native layer is what actually
       unblocks the other app; this route's job ends here. */
    router.replace('/inicio');
  }, [router]);

  const pagar = useCallback(
    (intentos: readonly IntentoDelPeaje[]) => {
      if (intentos.length > 0) {
        const ahora = new Date();
        const porId = new Map(preguntas.map((p) => [p.id, p]));
        const total = intentos.reduce((s, i) => s + i.tiempoMs, 0);

        /* Queued rather than sent. There is no network while the toll
           runs — that is the premise — so the work waits and the queue
           drains when a connection appears. */
        cola.añadir({
          id: `peaje-${ahora.getTime()}`,
          /* Derived from the answers rather than from a timer started
             on mount: the learner may have left the screen open for an
             hour. What counts is the time they spent answering. */
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
      salir();
    },
    [cola, preguntas, salir],
  );

  return <PantallaPeaje preguntas={preguntas} alPagar={pagar} alSaltar={salir} />;
}
