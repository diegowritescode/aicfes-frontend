import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { PantallaModeracion } from '@/features/moderacion/components/PantallaModeracion';

/**
 * The moderation queue, on the phone.
 *
 * Reachable by typing the path or from the menu entry, which only
 * appears once this device holds a token. A learner who never pastes
 * one sees an empty screen asking for a token, not the queue.
 */
export default function RutaModeracion() {
  const router = useRouter();
  const { cargando, autenticado } = useSesion();

  if (cargando) return <SafeAreaView className="flex-1 bg-white" />;
  if (!autenticado) return <Redirect href="/entrar" />;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <PantallaModeracion onVolver={() => router.back()} />
    </SafeAreaView>
  );
}
