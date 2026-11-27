import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Boton, Chip, Tarjeta, Texto } from '@/shared/ui';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { useMisDuelos } from '@/features/duelos/hooks/useDuelos';

/**
 * The two modes where answering is a game rather than a session.
 *
 * Duels had a tab of its own and contrarreloj was filed under
 * «Otras formas de practicar» in Entrenar, three cards down. They
 * belong together: in both you answer against something — a rival or
 * a clock — and in neither do you choose an area or a length first.
 * Entrenar, repaso, simulacro and the toll are all study. These two
 * are not, and a learner looking for one was looking in the wrong
 * place for the other.
 *
 * Grouping also fixed something the duels route had written down as a
 * cost it was paying: the round used to render with the tab bar
 * underneath it, because the round lived inside the tab group and the
 * bar cannot be hidden per view without making it blink. The round
 * now lives at `/duelos`, outside the group, so the bar is gone
 * during it for free — a duel is five questions, and a tab bar during
 * one is an invitation to abandon it.
 */

/**
 * One mode, as a card you can read before you tap.
 *
 * The same shape Entrenar uses for its modes: title with the fact
 * beside it, one line of what it is, and the way in. The fact is what
 * decides whether you want it today — how many people are waiting,
 * how long it takes — not a pitch.
 */
function TarjetaJuego({
  titulo,
  dato,
  descripcion,
  etiquetaBoton,
  variante,
  alTocar,
}: {
  titulo: string;
  dato: string;
  descripcion: string;
  etiquetaBoton: string;
  variante: 'principal' | 'contorno';
  alTocar: () => void;
}) {
  return (
    <Tarjeta className="gap-2">
      <View className="flex-row items-baseline justify-between gap-3">
        <Texto estilo="cuerpo" style={{ fontFamily: 'Nunito_800ExtraBold' }}>
          {titulo}
        </Texto>
        <Chip>{dato}</Chip>
      </View>
      <Texto estilo="cuerpo" className="text-texto-apagado">
        {descripcion}
      </Texto>
      <View className="mt-1">
        <Boton variante={variante} alTocar={alTocar} etiqueta={`${etiquetaBoton}: ${titulo}`}>
          {etiquetaBoton}
        </Boton>
      </View>
    </Tarjeta>
  );
}

export default function RutaJugar() {
  const router = useRouter();
  const { cargando, autenticado } = useSesion();

  /* Read here so the duel card can say how many are waiting. That
     number is the whole reason to open the screen on a given day, and
     a card that says «Duelos» and nothing else is a card nobody
     taps. */
  const duelos = useMisDuelos();

  if (cargando) return <SafeAreaView className="flex-1 bg-fondo" />;
  if (!autenticado) return <Redirect href="/entrar" />;

  /* Both counts, because both are something to act on: a challenge
     nobody accepted yet and a duel waiting to be played read the same
     to a learner — «alguien te está esperando». */
  const esperando = duelos.porAceptar.length + duelos.enCurso.length;

  /* The accent goes to whichever card has something waiting, because
     that is what the learner came for. With nothing waiting it goes
     to duels anyway: contrarreloj is always available and never
     urgent, so making it the loud one would be shouting about the
     thing that can wait. One accent per screen either way. */
  return (
    <SafeAreaView className="flex-1 bg-fondo" edges={['top']}>
      <ScrollView contentContainerClassName="gap-6 px-5 py-6">
        <View className="gap-2">
          <Texto estilo="titulo-grande">Jugar</Texto>
          <Texto estilo="cuerpo" className="text-texto-apagado">
            Las mismas preguntas, pero contra alguien o contra el reloj.
          </Texto>
        </View>

        <View className="gap-3">
          <TarjetaJuego
            titulo="Duelos"
            dato={esperando > 0 ? `${esperando} esperando` : 'Cinco preguntas'}
            descripcion="Retas a alguien a las mismas cinco preguntas. Ganas si aciertas más, y el empate se decide por tiempo."
            etiquetaBoton="Abrir"
            variante="principal"
            /* `push` and not `replace`: these are places the learner
               goes and comes back from, and the back gesture should
               land here rather than walk out of the app. */
            alTocar={() => router.push('/duelos')}
          />

          <TarjetaJuego
            titulo="Contrarreloj"
            dato="5 niveles"
            descripcion="Respondes con el reloj corriendo. En el examen real tienes 64 segundos por pregunta, y la escalera te lleva hasta ahí."
            etiquetaBoton="Abrir"
            variante="contorno"
            alTocar={() => router.push('/contrarreloj')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
