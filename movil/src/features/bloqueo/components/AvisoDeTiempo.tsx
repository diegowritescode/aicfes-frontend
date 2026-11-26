import { useEffect, useState } from 'react';
import { AppState, Text, View } from 'react-native';
import { useBloqueo } from '../hooks/useBloqueo';
import { textoDeSaldos, type AppConSaldo } from '../model/saldos';

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
 */
export function AvisoDeTiempo() {
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

  const texto = textoDeSaldos(saldos);
  if (!texto) return null;

  return (
    <View className="gap-1 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <Text className="text-[11.5px] font-bold uppercase tracking-widest text-emerald-700">
        Tiempo ganado
      </Text>
      <Text className="text-[15px] font-semibold leading-6 text-slate-900">{texto}</Text>
      <Text className="text-[13px] leading-5 text-slate-500">
        Cada app tiene el suyo y solo corre cuando estás adentro. A medianoche se
        van.
      </Text>
    </View>
  );
}
