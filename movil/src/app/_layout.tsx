import '@/app/global.css';
import { useState } from 'react';
import { Stack } from 'expo-router';
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
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}
