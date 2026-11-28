import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { color } from '@/shared/ui';
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
      <View className="flex-1 items-center justify-center bg-fondo">
        {/* The accent token. The blue that was here belonged to the
            palette this design system replaced, and a cold-start
            spinner is the first colour the learner ever sees from
            us. */}
        <ActivityIndicator size="large" color={color.acento} />
      </View>
    );
  }

  return <Redirect href={autenticado ? '/inicio' : '/entrar'} />;
}
