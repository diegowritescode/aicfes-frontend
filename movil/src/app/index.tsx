import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSesion } from '@/features/sesion/hooks/useSesion';

/**
 * Where the app opens.
 *
 * Reading the keystore is asynchronous, so there is a moment where we
 * genuinely do not know. Showing a spinner for it beats guessing:
 * redirecting to sign-in and then bouncing to the dashboard is a flash
 * of the wrong screen, and on a cold start it is the first thing the
 * learner sees.
 */
export default function Index() {
  const { cargando, autenticado } = useSesion();

  if (cargando) {
    return (
      <View className="flex-1 items-center justify-center bg-wash">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return <Redirect href={autenticado ? '/inicio' : '/entrar'} />;
}
