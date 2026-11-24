import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
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
  const router = useRouter();
  const { cargando, autenticado } = useSesion();
  const [vista, setVista] = useState<Vista>({ tipo: 'lista' });
  const duelos = useMisDuelos();

  if (cargando) {
    return <SafeAreaView className="flex-1 bg-white" />;
  }
  if (!autenticado) {
    return <Redirect href="/entrar" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {/* No hamburger here: only `inicio` carries the drawer, and
          every other route is reached from it. A second entry point
          would put the learner in two places at once. */}
      <View className="flex-row items-center px-4 py-2">
        <Pressable
          onPress={() => (vista.tipo === 'lista' ? router.back() : setVista({ tipo: 'lista' }))}
          className="px-2 py-1"
          accessibilityRole="button"
          accessibilityLabel="Atrás"
        >
          <Text className="text-[15px] text-brand-bright">Atrás</Text>
        </Pressable>
      </View>

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
    </SafeAreaView>
  );
}
