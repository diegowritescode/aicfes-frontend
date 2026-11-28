import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Boton, Texto } from '@/shared/ui';

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
    <SafeAreaView className="flex-1 bg-fondo">
      <View className="flex-1 justify-center gap-4 px-5">
        <Texto estilo="titulo-grande">Esta página no existe</Texto>
        <Texto estilo="apoyo">El enlace está viejo o mal escrito.</Texto>
        <Boton alTocar={() => router.replace('/inicio')}>Ir al inicio</Boton>
      </View>
    </SafeAreaView>
  );
}
