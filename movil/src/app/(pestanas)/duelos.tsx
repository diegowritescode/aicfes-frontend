import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { Texto } from '@/shared/ui';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { useMisDuelos } from '@/features/duelos/hooks/useDuelos';
import { PantallaDuelos } from '@/features/duelos/components/PantallaDuelos';
import { PantallaRondaDeDuelo } from '@/features/duelos/components/PantallaRondaDeDuelo';
import { PantallaAjustesDeDuelos } from '@/features/duelos/components/PantallaAjustesDeDuelos';

/**
 * Duels.
 *
 * Three screens in one route: the list, the round, and the account
 * settings that alias search makes necessary. Kept together because a
 * learner moves between them in one sitting — see a challenge, play
 * it, then go turn searchability off.
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
  | { readonly tipo: 'ajustes' };

export default function RutaDuelos() {
  const { cargando, autenticado } = useSesion();
  const [vista, setVista] = useState<Vista>({ tipo: 'lista' });
  const duelos = useMisDuelos();

  if (cargando) {
    return <SafeAreaView className="flex-1 bg-fondo" />;
  }
  if (!autenticado) {
    return <Redirect href="/entrar" />;
  }

  const enLista = vista.tipo === 'lista';

  return (
    <SafeAreaView
      className="flex-1 bg-fondo"
      /* The list carries the tab bar, which already fills the bottom
         inset. The round and the settings do not, so they still need
         it from the safe area. */
      edges={enLista ? ['top'] : ['top', 'bottom']}
    >
      {/* No hamburger here: the tab bar below is the navigation, and
          every other route is reached from it. A second entry point
          would put the learner in two places at once.

          On the list there is nowhere to go back to that the tab bar
          does not already offer, so the row only appears inside the
          round and the settings — where it is the way out. */}
      {!enLista ? (
        <View className="flex-row items-center px-3 py-1">
          <Pressable
            onPress={() => setVista({ tipo: 'lista' })}
            className="min-h-toque justify-center px-2"
            accessibilityRole="button"
            accessibilityLabel="Atrás"
          >
            <Texto estilo="apoyo" className="text-acento-texto">
              Atrás
            </Texto>
          </Pressable>
        </View>
      ) : null}

      {vista.tipo === 'lista' ? (
        <PantallaDuelos
          onJugar={(dueloId, contra, rivalId) =>
            setVista({ tipo: 'ronda', dueloId, contra, rivalId })
          }
          onAjustes={() => setVista({ tipo: 'ajustes' })}
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
      ) : (
        <PantallaAjustesDeDuelos onVolver={() => setVista({ tipo: 'lista' })} />
      )}

      {/* The tab bar used to be drawn here, and only on the list: a
          round is one task, and a tab bar during one is an invitation
          to abandon it halfway. It now lives in `(pestanas)/_layout`
          and cannot be hidden per view, because hiding it is what
          made it blink — each tab change unmounted one bar and
          mounted another, which a learner reported as a flicker.

          So during a round the bar is visible. That is a real cost,
          accepted for now: a round is five questions, and the «Atrás»
          row above is still the deliberate way out. Removing the cost
          means promoting the round and the settings to their own
          routes outside this group, which is worth doing and is not
          worth risking the only social mechanic on today. */}
    </SafeAreaView>
  );
}
