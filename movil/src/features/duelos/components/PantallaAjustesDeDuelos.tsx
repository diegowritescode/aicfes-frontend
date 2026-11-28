import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Boton, FilaEnlace, GrupoDeFilas, Texto } from '@/shared/ui';
import { usePerfilDeDuelos } from '../hooks/useDuelos';

/**
 * The duel account, now that it is three screens.
 *
 * This used to hold everything: the alias, the description, the
 * guardian's authorisation, the searchability switch, the blocked
 * list and the way into moderation. All of it still exists, and all
 * of it moved — the alias and the description to `/perfil-publico`,
 * the authorisation and both privacy switches to `/privacidad`, the
 * blocked list to `/bloqueados`, moderation to `/ajustes`.
 *
 * It moved because «my name in the app» is not a question anybody
 * goes to a game screen to answer. Diego could not find his own
 * profile at all, and the reason was this file: it was reached from
 * the Jugar tab, so the profile lived inside duels.
 *
 * What is left is the signpost. Deleting the screen outright would
 * strand the «Mi cuenta» button on the duels list, and leaving the
 * forms here would mean two places to change an alias — which is the
 * disorder this whole pass was about.
 */
export function PantallaAjustesDeDuelos({ onVolver }: { onVolver: () => void }) {
  const router = useRouter();
  const { perfil } = usePerfilDeDuelos();

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 py-6">
      <Texto estilo="titulo">Mi cuenta</Texto>

      <GrupoDeFilas>
        <FilaEnlace
          primera
          icono="gente"
          titulo="Mi nombre y mi descripción"
          /* The warning that used to sit under the description field
             travels with the link, because this is now the last place
             a learner reads anything before opening that form. The
             description is served to anybody who searches — not only
             to friends — and `descripcion-es-publica.test.ts` pins
             that sentence wherever it lives. */
          detalle="Lo ve cualquiera que lo encuentre al buscarlo"
          valor={perfil?.alias ?? 'sin nombre'}
          alTocar={() => router.push('/perfil-publico')}
        />
        <FilaEnlace
          icono="candado"
          tono={perfil?.visible ? 'ganado' : 'neutro'}
          titulo="Privacidad"
          detalle="Quién te encuentra y qué puede ver"
          valor={perfil?.visible ? 'visible' : 'oculto'}
          alTocar={() => router.push('/privacidad')}
        />
        <FilaEnlace
          ultima
          icono="escudo"
          titulo="Bloqueados"
          alTocar={() => router.push('/bloqueados')}
        />
      </GrupoDeFilas>

      {/* The way in for whoever moderates, and still the only one.
          The notice on the dashboard appears once the account holds
          the role — but the screen that takes the token was behind
          that notice, which made it a door whose key is inside the
          room. This line is how somebody gets in the first time, so
          it survives every reshuffle of this screen.

          Plain text, no explanation: a learner who taps it finds a
          box asking for something they do not have. */}
      <View className="items-center">
        <Boton variante="plano" ancho={false} alTocar={() => router.push('/moderacion')}>
          Moderación
        </Boton>
      </View>

      <Boton ancho={false} variante="contorno" alTocar={onVolver}>
        Volver
      </Boton>
    </ScrollView>
  );
}
