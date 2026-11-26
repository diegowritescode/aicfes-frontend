import { useEffect, useState } from 'react';
import { AppState, Text, View } from 'react-native';
import { nativo } from '../api/nativo';

/**
 * How much of the earned time is left.
 *
 * The first real user asked whether the block would come back at a
 * fixed clock time, which it does not — the budget only runs down
 * while the blocked app is in the foreground. The honest answer is
 * more generous than a timer and impossible to guess, so it has to
 * be shown somewhere.
 *
 * Read on every return to the foreground rather than ticked down:
 * the native side meters in thirty-second steps, so a smooth
 * countdown here would be a lie told once a second. The module's own
 * documentation says not to render it as one.
 */
export function AvisoDeTiempo() {
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    let vivo = true;

    const leer = async () => {
      const r = await nativo.segundosRestantes();
      if (vivo && r.ok) setSegundos(r.valor ?? 0);
    };

    void leer();

    /* Coming back from the blocked app is exactly when the number
       changed, and the only moment it can be read accurately. */
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void leer();
    });

    return () => {
      vivo = false;
      suscripcion.remove();
    };
  }, []);

  if (segundos <= 0) return null;

  /* Rounded up, and in minutes. Seconds would imply a precision the
     thirty-second metering does not have. */
  const minutos = Math.ceil(segundos / 60);

  return (
    <View className="gap-1 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <Text className="text-[11.5px] font-bold uppercase tracking-widest text-emerald-700">
        Tiempo ganado
      </Text>
      <Text className="text-[15px] font-semibold leading-6 text-slate-900">
        Te {minutos === 1 ? 'queda' : 'quedan'} {minutos} {minutos === 1 ? 'minuto' : 'minutos'} de uso
      </Text>
      <Text className="text-[13px] leading-5 text-slate-500">
        Solo corren cuando estás adentro, así que puedes dejarlos para
        después. A medianoche se van.
      </Text>
    </View>
  );
}
