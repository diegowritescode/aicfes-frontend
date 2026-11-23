import { useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Boton } from '@/shared/ui/Boton';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { useErrorDelDia } from '@/features/panel/hooks/usePanel';
import { TarjetaErrorDelDia } from '@/features/panel/components/TarjetaErrorDelDia';
import { esRespondible } from '@/features/panel/model/errorDelDia';

/**
 * The question of the day, on its own screen.
 *
 * It used to live on the dashboard, and a Lectura Crítica item with an
 * email as its stimulus filled the screen before the learner reached
 * their own stats. A question is a task; the dashboard is a summary.
 */
export default function RutaPreguntaDelDia() {
  const router = useRouter();
  const { cargando: cargandoSesion, autenticado } = useSesion();
  const { pregunta, cargando, registrar } = useErrorDelDia();

  const volver = useCallback(() => router.replace('/inicio'), [router]);

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  return (
    <SafeAreaView className="flex-1 bg-wash">
      <ScrollView contentContainerClassName="gap-5 px-5 py-6">
        {cargando ? (
          <Text className="text-[14px] text-slate-500">Buscando tu pregunta…</Text>
        ) : null}

        {!cargando && !esRespondible(pregunta) ? (
          <View className="gap-3">
            <Text className="text-[22px] font-bold tracking-tight text-slate-900">
              Hoy no hay pregunta
            </Text>
            <Text className="text-[14px] leading-6 text-slate-600">
              {pregunta
                ? 'Ya la respondiste. Mañana hay otra.'
                : 'Aparece cuando falles alguna. Entrena un rato y vuelve.'}
            </Text>
            <Boton onPress={volver} ancho>
              Volver
            </Boton>
          </View>
        ) : null}

        {esRespondible(pregunta) ? (
          <>
            <TarjetaErrorDelDia
              pregunta={pregunta}
              alResponder={(elegida, acerto) =>
                registrar.mutate({ elegida, acerto, pregunta })
              }
            />
            <Boton variante="contorno" onPress={volver} ancho>
              Volver al inicio
            </Boton>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
