import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { Boton, Cifra, Tarjeta, Texto } from '@/shared/ui';
import { useBloqueo } from '../hooks/useBloqueo';
import { resumenDeSaldos, textoDeSaldos, type AppConSaldo } from '../model/saldos';

/**
 * The earned time, when there is any.
 *
 * The first version read `getRemainingUnlockSeconds`, a single
 * whole-block number — and said 15 while Instagram had 0, because
 * answering for a second app had replaced the first app's budget
 * rather than adding to it.
 *
 * Now each app has its own grant, and the module cannot report what
 * is left on a targeted one: it says so, and it is why this shows
 * what was granted rather than counting down. "Hasta 15 min" is what
 * can honestly be said; a ticking number would be invented.
 *
 * This is also the validated design's «Tienes tiempo» card, and there
 * is one of them rather than two. That card's subject is this
 * component's subject exactly, and a second card beside it would have
 * to re-read the same per-app balances through the same `AppState`
 * listener to say the same thing — two places to get the number wrong
 * instead of one. So the accent panel moved in here.
 */
export function AvisoDeTiempo({ alGanarMas }: { alGanarMas?: () => void }) {
  const bloqueo = useBloqueo();
  const [saldos, setSaldos] = useState<readonly AppConSaldo[]>([]);

  useEffect(() => {
    let vivo = true;

    const leer = async () => {
      const s = await bloqueo.leerSaldos();
      if (vivo) setSaldos(s);
    };

    void leer();

    /* Coming back from a blocked app is when this changed. */
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void leer();
    });

    return () => {
      vivo = false;
      suscripcion.remove();
    };
    /* `bloqueo` is rebuilt every render; depending on it would loop. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Still the gate on rendering at all, so «no earned time» stays one
     decision made in one place. */
  const texto = textoDeSaldos(saldos);
  if (!texto) return null;

  const { conTiempo, minutosMaximos } = resumenDeSaldos(saldos);

  /* The unit carries the honesty the figure cannot. One app can be
     named outright; several share no single number, so the unit says
     the minutes are the largest of them rather than a total — which
     is the exact claim the per-app balances were built to stop. */
  const unidad =
    conTiempo === 1
      ? minutosMaximos === 1
        ? 'min que te queda'
        : 'min que te quedan'
      : `min en una de ${conTiempo} apps`;

  return (
    <Tarjeta variante="acento" className="gap-3">
      <Texto estilo="rotulo">Tienes tiempo</Texto>
      <Cifra valor={minutosMaximos} unidad={unidad} tono="acento" />
      <Texto estilo="apoyo">
        Cada app tiene el suyo y solo corre cuando estás adentro. A medianoche se
        van.
      </Texto>
      {/* Only when the screen said where more time comes from. A
          caller that cannot offer the toll — or is the toll — gets the
          card without a button rather than a button that loops. */}
      {alGanarMas ? (
        <Boton variante="contorno" alTocar={alGanarMas}>
          Ganar más tiempo
        </Boton>
      ) : null}
    </Tarjeta>
  );
}
