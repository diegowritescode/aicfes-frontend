import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Texto } from '@/shared/ui';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { useAmigos, useMisDuelos } from '@/features/duelos/hooks/useDuelos';
import { PantallaDuelos } from '@/features/duelos/components/PantallaDuelos';
import { PantallaRondaDeDuelo } from '@/features/duelos/components/PantallaRondaDeDuelo';
import { PantallaAjustesDeDuelos } from '@/features/duelos/components/PantallaAjustesDeDuelos';
import { PantallaPerfil } from '@/features/duelos/components/PantallaPerfil';

/**
 * Duels.
 *
 * Three screens in one route: the list, the round, and the account
 * settings that alias search makes necessary. Kept together because a
 * learner moves between them in one sitting — see a challenge, play
 * it, then go turn searchability off.
 *
 * Outside the tab group, reached from Jugar. It used to be a tab, and
 * the round rendered with the tab bar underneath it: the bar lives in
 * the group's layout and cannot be hidden for one view without
 * remounting it, which a learner reported as a flicker. That was
 * written down here as a cost being paid. Moving the whole route out
 * settles it — a duel is five questions, and a tab bar during one is
 * an invitation to abandon it.
 */
type Vista =
  | { readonly tipo: 'lista' }
  | {
      readonly tipo: 'ronda';
      readonly dueloId: string;
      readonly contra: string;
      /* Carried so the result screen can offer a rematch. Without it
         a rematch means going back, finding the alias and searching
         again — which is how rematches stop happening. */
      readonly rivalId: string | null;
    }
  | { readonly tipo: 'ajustes' }
  /* Somebody found by searching, before deciding anything about
     them. Diego asked for exactly this: «buscar y verlo, y si me
     gusta lo que veo pues le envío la soli, como en Facebook».

     A view and not a route, like the friend profile on `amigos`: a
     URL for it would make a minor's profile a link that can be
     shared outside the app. */
  | { readonly tipo: 'perfil'; readonly usuarioId: string };

export default function RutaDuelos() {
  const router = useRouter();
  const { cargando, autenticado } = useSesion();
  const [vista, setVista] = useState<Vista>({ tipo: 'lista' });
  const duelos = useMisDuelos();
  /* Read here rather than inside the profile view, so sending a
     request from a profile invalidates the same cache the search
     and the friends list read. */
  const amigos = useAmigos();

  if (cargando) {
    return <SafeAreaView className="flex-1 bg-fondo" />;
  }
  if (!autenticado) {
    return <Redirect href="/entrar" />;
  }

  const enLista = vista.tipo === 'lista';

  return (
    /* No tab bar anywhere in here now, so the bottom inset is this
       screen's to fill in every view — it used to be the bar's job on
       the list. */
    <SafeAreaView className="flex-1 bg-fondo" edges={['top', 'bottom']}>
      {/* Always a way out, which is new: as a tab, the list needed no
          back row because the bar was underneath it. Outside the group
          the only exit left is the system gesture, and a screen whose
          one exit is a gesture is a screen some learners cannot
          leave.

          From the list it goes to Jugar, which is where this route is
          reached from. From the round and the settings it goes to the
          list first, because that is one step back and not two. */}
      <View className="flex-row items-center px-3 py-1">
        <Pressable
          onPress={() => (enLista ? router.replace('/jugar') : setVista({ tipo: 'lista' }))}
          className="min-h-toque justify-center px-2"
          accessibilityRole="button"
          accessibilityLabel={enLista ? 'Volver a Jugar' : 'Atrás'}
        >
          <Texto estilo="apoyo" className="text-acento-texto">
            Atrás
          </Texto>
        </Pressable>
      </View>

      {vista.tipo === 'lista' ? (
        <PantallaDuelos
          onJugar={(dueloId, contra, rivalId) =>
            setVista({ tipo: 'ronda', dueloId, contra, rivalId })
          }
          onAjustes={() => setVista({ tipo: 'ajustes' })}
          onVerPerfil={(usuarioId) => setVista({ tipo: 'perfil', usuarioId })}
        />
      ) : vista.tipo === 'ronda' ? (
        <PantallaRondaDeDuelo
          dueloId={vista.dueloId}
          contra={vista.contra}
          onSalir={() => setVista({ tipo: 'lista' })}
          onRevancha={
            vista.rivalId
              ? async () => {
                  const r = await duelos.retar(vista.rivalId!).catch(() => null);
                  /* Back to the list either way: on success the new
                     duel is waiting there, and on failure the list is
                     where the reason shows. */
                  setVista({ tipo: 'lista' });
                  return r;
                }
              : undefined
          }
          retando={duelos.retando}
        />
      ) : vista.tipo === 'perfil' ? (
        <PantallaPerfil
          usuarioId={vista.usuarioId}
          alCerrar={() => setVista({ tipo: 'lista' })}
          alPedirAmistad={(id) => void amigos.pedir(id)}
          pidiendoAmistad={amigos.pidiendo}
          alRetar={async (id) => {
            await duelos.retar(id).catch(() => null);
            /* Back to the list either way: on success the new duel is
               waiting there, and on failure that is where the reason
               shows. */
            setVista({ tipo: 'lista' });
          }}
        />
      ) : (
        <PantallaAjustesDeDuelos onVolver={() => setVista({ tipo: 'lista' })} />
      )}

      {/* The tab bar was drawn here once, and later moved to
          `(pestanas)/_layout`, where it could no longer be hidden for
          the round alone — hiding it per view is what made it blink,
          because each change unmounted one bar and mounted another.
          For a while the round rendered with the bar underneath it,
          written down here as a cost being paid.

          The cost is gone: this route left the group, so no bar
          reaches any of its three views. The «Atrás» row above is the
          way out, and during a round it is the only one — which is
          the point. */}
    </SafeAreaView>
  );
}
