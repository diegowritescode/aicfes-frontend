import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Boton } from '@/shared/ui/Boton';
import { useAccionesSesion, useSesion } from '@/features/sesion/hooks/useSesion';

/**
 * The signed-in shell. Deliberately almost empty: this phase proves
 * the scaffolding carries a session end to end, and filling it before
 * that is proven would be building on an unchecked floor.
 */
export default function Inicio() {
  const router = useRouter();
  const { sesion, cargando, autenticado } = useSesion();
  const { salir } = useAccionesSesion();

  if (cargando) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  return (
    <SafeAreaView className="flex-1 bg-wash">
      <ScrollView contentContainerClassName="gap-6 px-6 py-8">
        <View className="gap-1.5">
          <Text className="text-[12px] font-bold uppercase tracking-widest text-slate-400">
            Sesión iniciada
          </Text>
          <Text className="text-[24px] font-bold text-slate-900">{sesion?.email}</Text>
        </View>

        <View className="gap-2 rounded-2xl border border-slate-200 bg-white p-5">
          <Text className="text-[16px] font-bold text-slate-900">Entrenar</Text>
          <Text className="text-[13.5px] leading-6 text-slate-600">
            Sabe al instante si acertó, y puede hablar con el tutor cuando no.
          </Text>
          <Boton onPress={() => router.push('/entrenar')}>Entrenar ahora</Boton>
        </View>

        <View className="gap-2 rounded-2xl border border-slate-200 bg-white p-5">
          <Text className="text-[16px] font-bold text-slate-900">Simulacro</Text>
          <Text className="text-[13.5px] leading-6 text-slate-600">
            Como el examen real: puede saltar, volver y cambiar su respuesta. La nota llega al
            final.
          </Text>
          <Boton onPress={() => router.push('/simulacro')}>Ir al simulacro</Boton>
        </View>

        <Boton variante="contorno" onPress={() => void salir()}>
          Cerrar sesión
        </Boton>
      </ScrollView>
    </SafeAreaView>
  );
}
