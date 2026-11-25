import '@/app/global.css';
import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useLlegadaDelEscudo } from '@/features/bloqueo/hooks/useLlegadaDelEscudo';
import { StatusBar } from 'expo-status-bar';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { crearClienteConsultas } from '@/core/http/consultas';
import { opcionesDePersistencia } from '@/core/http/persistencia';
import { conectarRenovacion } from '@/features/sesion/api/peticiones';

/**
 * The shell every screen sits in.
 *
 * The query client is created in state rather than at module scope:
 * on web a module-level client is shared between requests during
 * server rendering, which leaks one user's cached data into another's
 * page. It costs nothing to be correct here.
 */
/* Done at module scope, once: it only stores a function, and doing it
   in an effect would leave the first requests of a cold start unable
   to renew — which is exactly when a stale token is most likely. */
conectarRenovacion();

export default function Layout() {
  const [cliente] = useState(crearClienteConsultas);

  /* Persisting rather than plain: without this the cache dies with the
     process, so the app is blank with no connection. The provider
     holds children until the stored cache is read, which is a few
     milliseconds and avoids a flash of empty screen followed by data. */
  return (
    <PersistQueryClientProvider client={cliente} persistOptions={opcionesDePersistencia}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <LlevarAlPeaje />
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}

/**
 * Sends the learner to the toll when the shield is what opened the app.
 *
 * Here, at the root, rather than in a screen: Android usually resumes
 * the existing process, so whichever screen was last open is the one
 * that mounts. A check living in Inicio would miss every launch that
 * resumed somewhere else.
 *
 * Renders nothing. It exists for the effect.
 */
function LlevarAlPeaje() {
  const router = useRouter();
  const vieneDelEscudo = useLlegadaDelEscudo();

  useEffect(() => {
    if (!vieneDelEscudo) return;
    /* `replace`, not `push`: the toll is where this launch belongs,
       and leaving Inicio underneath would make the back gesture —
       which the toll blocks — the one way out of a block. */
    router.replace('/peaje');
  }, [vieneDelEscudo, router]);

  return null;
}
