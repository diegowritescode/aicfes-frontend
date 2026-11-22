import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Boton } from '@/shared/ui/Boton';

/**
 * A link that went nowhere.
 *
 * It exists mostly for web, where people type and share URLs. On a
 * phone it catches a deep link to a screen that moved — and either
 * way, the only useful thing it can offer is a way back.
 */
export default function NoEncontrado() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-wash">
      <View className="flex-1 justify-center gap-4 px-6">
        <Text className="text-[26px] font-bold tracking-tight text-slate-900">
          Esta página no existe
        </Text>
        <Text className="text-[15px] leading-6 text-slate-600">
          El enlace puede estar viejo o mal escrito.
        </Text>
        <Boton onPress={() => router.replace('/inicio')}>Ir al inicio</Boton>
      </View>
    </SafeAreaView>
  );
}
