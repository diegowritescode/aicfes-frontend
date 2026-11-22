import '@/app/global.css';
import { useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { crearClienteConsultas } from '@/core/http/consultas';

/**
 * The shell every screen sits in.
 *
 * The query client is created in state rather than at module scope:
 * on web a module-level client is shared between requests during
 * server rendering, which leaks one user's cached data into another's
 * page. It costs nothing to be correct here.
 */
export default function Layout() {
  const [cliente] = useState(crearClienteConsultas);

  return (
    <QueryClientProvider client={cliente}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
