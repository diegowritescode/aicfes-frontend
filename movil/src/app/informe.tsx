import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Boton, Texto } from '@/shared/ui';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { TarjetaInforme } from '@/features/informe/components/TarjetaInforme';

/**
 * The weekly report, on its own.
 *
 * The card already renders the whole thing, including the plan whose
 * actions open a drill on the exact topic. What it did not have was
 * room: it sat between the subjects and the day's missions on a
 * screen with eight sections.
 *
 * The card renders nothing when there is no report yet, which is
 * most Mondays, so the screen says so itself rather than appearing
 * broken.
 */
export default function RutaInforme() {
  const router = useRouter();
  const { cargando: cargandoSesion, autenticado } = useSesion();

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  return (
    <SafeAreaView className="flex-1 bg-fondo" edges={['top', 'bottom']}>
      <ScrollView contentContainerClassName="gap-5 px-5 py-5">
        <View className="flex-row items-center justify-between gap-3">
          <Texto estilo="titulo-grande">Mi semana</Texto>
          <Boton variante="plano" ancho={false} alTocar={() => router.back()}>
            Atrás
          </Boton>
        </View>

        <TarjetaInforme />

        {/* Under the card rather than instead of it: the card decides
            on its own whether it has anything, and this line explains
            the silence when it does not. */}
        <Texto estilo="apoyo">
          El informe se arma con lo que estudiaste en los últimos siete días.
          Si todavía no aparece, es que falta actividad de la semana.
        </Texto>
      </ScrollView>
    </SafeAreaView>
  );
}
