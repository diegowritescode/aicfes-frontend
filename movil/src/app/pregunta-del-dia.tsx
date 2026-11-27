import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { BarraRespuesta, Boton, Encabezado, Texto } from '@/shared/ui';
import { EsqueletoPregunta } from '@/shared/ui/Esqueleto';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { useErrorDelDia } from '@/features/panel/hooks/usePanel';
import { TarjetaErrorDelDia } from '@/features/panel/components/TarjetaErrorDelDia';
import { esRespondible } from '@/features/panel/model/errorDelDia';

/**
 * The question of the day, on its own screen.
 *
 * It used to live on the dashboard, and a Lectura Crítica item with an
 * email as its stimulus filled the screen before the learner reached
 * their own stats. A question is a task; the dashboard is a summary.
 *
 * The way out sits in the answer bar, outside the scroll view. Inside
 * it, a long stimulus pushed «Volver al inicio» past the end of the
 * card and the only exit from the screen was the hardware back
 * button.
 */
export default function RutaPreguntaDelDia() {
  const router = useRouter();
  const { cargando: cargandoSesion, autenticado } = useSesion();
  const { pregunta, cargando, registrar } = useErrorDelDia();

  const volver = useCallback(() => router.replace('/inicio'), [router]);

  /* The question this screen is showing, kept once it arrives.
     Answering invalidates `error-del-dia` and the server then answers
     null, so reading the live value on every render unmounted the
     card the instant the learner picked an option — taking the
     explanation with it and replacing it with «ya la respondiste».
     They answered and never found out why they were wrong, which is
     the only reason the question of the day exists.

     The card already froze its own copy for exactly this reason; the
     defence was useless while the parent kept removing it.

     `useState` holds the first non-null one it is given: the query is
     still loading on the first render, so this cannot be decided at
     mount. */
  const [congelada, setCongelada] = useState<typeof pregunta>(null);
  if (!congelada && esRespondible(pregunta)) setCongelada(pregunta);

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  const mostrada = congelada ?? pregunta;
  const respondible = esRespondible(mostrada);

  return (
    <SafeAreaView className="flex-1 bg-fondo">
      <ScrollView contentContainerClassName="gap-4 px-5 py-5">
        <Encabezado rotulo="Pregunta del día" />

        {cargando ? <EsqueletoPregunta /> : null}

        {!cargando && !respondible ? (
          <View className="gap-2">
            <Texto estilo="titulo">Hoy no hay pregunta</Texto>
            <Texto estilo="cuerpo" className="text-texto-apagado">
              {pregunta
                ? 'Ya la respondiste. Mañana hay otra.'
                : 'Aparece cuando falles alguna. Entrena un rato y vuelve.'}
            </Texto>
          </View>
        ) : null}

        {respondible ? (
          <TarjetaErrorDelDia
            pregunta={mostrada}
            alResponder={(elegida, acerto) =>
              registrar.mutate({ elegida, acerto, pregunta: mostrada })
            }
          />
        ) : null}
      </ScrollView>

      <BarraRespuesta>
        <Boton variante={respondible ? 'contorno' : 'principal'} alTocar={volver}>
          Volver al inicio
        </Boton>
      </BarraRespuesta>
    </SafeAreaView>
  );
}
