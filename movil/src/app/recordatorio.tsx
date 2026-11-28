import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Boton, Texto } from '@/shared/ui';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { usePanel } from '@/features/panel/hooks/usePanel';
import { useRecordatorio } from '@/features/recordatorio/hooks/useRecordatorio';
import { TarjetaRecordatorio } from '@/features/recordatorio/components/TarjetaRecordatorio';
import { temaMasFlojo } from '@/features/recordatorio/model/mensaje';

/**
 * The daily reminder, on its own screen.
 *
 * It was a card near the bottom of «Yo», below the achievements. The
 * card itself is unchanged — it already previews the real message,
 * which is the thing worth seeing before agreeing to be notified —
 * what changed is that it is now reached deliberately from Ajustes
 * instead of being passed on the way down a long scroll.
 *
 * The weak topic is read here and handed down, because a feature may
 * not import another feature: the reminder needs the dashboard's
 * answer, and the route is what is allowed to know both.
 */
export default function RutaRecordatorio() {
  const router = useRouter();
  const { cargando: cargandoSesion, autenticado } = useSesion();
  const { panel } = usePanel();
  const recordatorio = useRecordatorio(temaMasFlojo(panel?.areaProgress ?? []));

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  return (
    <SafeAreaView className="flex-1 bg-fondo" edges={['top', 'bottom']}>
      <ScrollView contentContainerClassName="gap-5 px-5 py-5">
        <View className="flex-row items-center justify-between gap-3">
          <Texto estilo="titulo-grande">Recordatorio</Texto>
          <Boton variante="plano" ancho={false} alTocar={() => router.back()}>
            Atrás
          </Boton>
        </View>

        <TarjetaRecordatorio
          activo={recordatorio.activo}
          hora={recordatorio.hora}
          permiso={recordatorio.permiso}
          temaDeHoy={recordatorio.temaDeHoy}
          onActivar={(h) => void recordatorio.activar(h)}
          onCancelar={() => void recordatorio.cancelar()}
        />

        {/* Said because the alternative is a learner concluding the
            feature is broken. Notifications here are scheduled on the
            device: nothing is pushed from a server, so a phone that
            was off at the chosen hour simply did not ring. */}
        <Texto estilo="apoyo">
          El recordatorio lo programa tu teléfono, no nuestros servidores. Si
          apagas el teléfono a esa hora, no suena.
        </Texto>
      </ScrollView>
    </SafeAreaView>
  );
}
