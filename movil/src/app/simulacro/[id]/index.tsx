import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { PantallaSimulacro } from '@/features/simulacro/components/PantallaSimulacro';
import { useSesion } from '@/features/sesion/hooks/useSesion';

/**
 * A sitting in progress.
 *
 * The route resolves the id and the session and hands both to the
 * feature. Everything the sitting does belongs there, which is what
 * keeps this file short enough to read in one go.
 */
export default function RutaSimulacro() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { cargando, autenticado } = useSesion();

  if (cargando) return null;
  if (!autenticado) return <Redirect href="/entrar" />;
  if (!id) return <Redirect href="/inicio" />;

  return (
    <PantallaSimulacro
      id={id}
      alTerminar={() => router.replace(`/simulacro/${id}/resultados`)}
    />
  );
}
