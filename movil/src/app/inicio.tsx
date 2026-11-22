import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { Boton } from '@/shared/ui/Boton';
import { useAccionesSesion, useSesion } from '@/features/sesion/hooks/useSesion';

/**
 * The signed-in shell. Deliberately almost empty: this phase proves
 * the scaffolding carries a session end to end, and filling it before
 * that is proven would be building on an unchecked floor.
 */
export default function Inicio() {
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

        <View className="rounded-2xl border border-slate-200 bg-white p-5">
          <Text className="text-[14px] leading-relaxed text-slate-600">
            El andamiaje funciona: la sesión viaja cifrada en el llavero del teléfono y la
            pantalla la lee desde una sola caché.
          </Text>
        </View>

        <Boton variante="contorno" onPress={() => void salir()}>
          Cerrar sesión
        </Boton>
      </ScrollView>
    </SafeAreaView>
  );
}
