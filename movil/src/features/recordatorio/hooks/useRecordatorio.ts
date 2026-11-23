import { useCallback, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import {
  horaValida,
  recordatorioDeHoy,
  valeLaPenaRecordar,
  type TemaParaHoy,
} from '../model/mensaje';

/**
 * A daily nudge, scheduled on the device.
 *
 * Local rather than pushed from a server, and that is the right trade
 * here: a local notification needs no token registry, no push
 * credentials for two platforms, and it fires with the radio off — on
 * a prepaid line that runs out mid-month, a server push is the one
 * that does not arrive.
 *
 * The cost is that the text is decided when the reminder is scheduled
 * rather than when it fires, so it can be a day stale. Worth it:
 * "logaritmos, que fallaste tres veces" is still true tomorrow.
 */

const CLAVE_PREFERENCIA = 'recordatorio';

/* Android needs a channel before anything shows. Without one the
   notification is accepted, scheduled, and silently never appears. */
const CANAL = 'recordatorio-diario';

/* The weak topic arrives as data rather than being read here. A
   feature importing another feature is the rule `capas.test.ts`
   enforces, and it caught this: the route already has the dashboard,
   so passing the topic down costs nothing and keeps the dependency
   pointing one way. */
export function useRecordatorio(temaDeHoy: TemaParaHoy | null = null) {
  const [permiso, setPermiso] = useState<'concedido' | 'negado' | 'sin-pedir'>(
    'sin-pedir',
  );
  const [activo, setActivo] = useState(false);
  const [hora, setHora] = useState(horaValida(19));

  /* Read the current state without asking. Asking is a one-shot on
     iOS — a declined prompt cannot be shown again from inside the app
     — so it only happens when the learner turns the reminder on. */
  useEffect(() => {
    let vivo = true;
    void (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (!vivo) return;
      setPermiso(
        status === 'granted' ? 'concedido' : status === 'denied' ? 'negado' : 'sin-pedir',
      );
      const programadas = await Notifications.getAllScheduledNotificationsAsync();
      if (!vivo) return;
      setActivo(programadas.some((n) => n.identifier.startsWith(CLAVE_PREFERENCIA)));
    })();
    return () => {
      vivo = false;
    };
  }, []);

  /** Turn the reminder on, asking for permission only now. */
  const activar = useCallback(
    async (horaElegida: number) => {
      const h = horaValida(horaElegida);

      const actual = await Notifications.getPermissionsAsync();
      let concedido = actual.status === 'granted';
      if (!concedido && actual.canAskAgain) {
        const pedido = await Notifications.requestPermissionsAsync();
        concedido = pedido.status === 'granted';
      }

      if (!concedido) {
        setPermiso('negado');
        return { ok: false as const, motivo: 'sin-permiso' as const };
      }
      setPermiso('concedido');

      await Notifications.setNotificationChannelAsync(CANAL, {
        name: 'Recordatorio de estudio',
        importance: Notifications.AndroidImportance.DEFAULT,
      });

      /* Replace rather than add. Scheduling without cancelling first
         is how a learner who changes the hour twice ends up with three
         notifications a day. */
      await cancelar();

      const { titulo, cuerpo } = recordatorioDeHoy(temaDeHoy, 0);
      await Notifications.scheduleNotificationAsync({
        identifier: `${CLAVE_PREFERENCIA}-diario`,
        content: { title: titulo, body: cuerpo },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: h,
          minute: 0,
          channelId: CANAL,
        },
      });

      setHora(h);
      setActivo(true);
      return { ok: true as const };
    },
    [temaDeHoy],
  );

  const cancelar = useCallback(async () => {
    const programadas = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      programadas
        .filter((n) => n.identifier.startsWith(CLAVE_PREFERENCIA))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
    setActivo(false);
  }, []);

  return {
    permiso,
    activo,
    hora,
    /* Whether a reminder is worth having at all right now, which the
       screen uses to avoid offering something pointless. */
    tieneSentido: valeLaPenaRecordar({ estudioHoy: false, activado: true }),
    temaDeHoy,
    activar,
    cancelar,
  };
}
