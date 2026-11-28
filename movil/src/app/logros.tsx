import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Boton, Tarjeta, Texto } from '@/shared/ui';
import { Aviso } from '@/shared/ui/Aviso';
import { EsqueletoLista } from '@/shared/ui/Esqueleto';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { useLogros } from '@/features/panel/hooks/usePanel';
import { SeccionLogros } from '@/features/panel/components/SeccionLogros';

/**
 * Achievements, with room to be read.
 *
 * They were the last section of «Yo», under everything else, which
 * is where things go to not be seen. The component is unchanged —
 * earned ones stay on the list rather than vanishing, because they
 * are the evidence the work added up.
 */
export default function RutaLogros() {
  const router = useRouter();
  const { cargando: cargandoSesion, autenticado } = useSesion();
  const { logros, cargando, fallo } = useLogros();

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  return (
    <SafeAreaView className="flex-1 bg-fondo" edges={['top', 'bottom']}>
      <ScrollView contentContainerClassName="gap-5 px-5 py-5">
        <View className="flex-row items-center justify-between gap-3">
          <Texto estilo="titulo-grande">Logros</Texto>
          <Boton variante="plano" ancho={false} alTocar={() => router.back()}>
            Atrás
          </Boton>
        </View>

        {cargando ? <EsqueletoLista filas={3} /> : null}

        {/* «No hay logros» and «esto no cargó» look the same and
            must not read the same: the first is about the learner,
            the second about the network. */}
        {fallo ? <Aviso mensaje={fallo.mensaje} detalle={fallo.detalle} /> : null}

        <SeccionLogros logros={logros} />

        {!cargando && !fallo && (!logros || logros.length === 0) ? (
          <Tarjeta variante="plana" className="gap-1">
            <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
              Todavía no hay logros
            </Texto>
            <Texto estilo="apoyo">
              Aparecen solos a medida que estudias.
            </Texto>
          </Tarjeta>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
