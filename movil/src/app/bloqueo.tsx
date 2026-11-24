import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { PantallaBloqueo } from '@/features/bloqueo/components/PantallaBloqueo';
import { SelectorDeApps } from '@/features/bloqueo/components/SelectorDeApps';
import { useBloqueo } from '@/features/bloqueo/hooks/useBloqueo';

/**
 * Setting up which apps the toll guards.
 *
 * Two screens: the setup, and the picker on its own full height. The
 * picker was a 384-pixel box inside a scrolling page, showing four
 * apps on a phone that has sixty — and the learner is choosing what
 * to lock themselves out of.
 */
export default function RutaBloqueo() {
  const router = useRouter();
  const { cargando, autenticado } = useSesion();
  const [eligiendo, setEligiendo] = useState(false);
  const bloqueo = useBloqueo();

  if (cargando) return <SafeAreaView className="flex-1 bg-white" />;
  if (!autenticado) return <Redirect href="/entrar" />;

  if (eligiendo) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="flex-row items-center justify-between px-4 py-2">
          <Pressable onPress={() => setEligiendo(false)} className="px-2 py-1">
            <Text className="text-[15px] text-brand-bright">Listo</Text>
          </Pressable>
          <Text className="text-[13px] text-slate-500">
            Lo que marques queda bloqueado
          </Text>
        </View>

        {/* Every change applies the block at once. No Block button:
            "what is selected is blocked" explains itself, while a
            separate button leaves a state where something is picked
            and nothing is blocked. */}
        <SelectorDeApps alCambiar={() => void bloqueo.aplicar()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <PantallaBloqueo
        alElegirApps={() => setEligiendo(true)}
        alVolver={() => router.back()}
      />
    </SafeAreaView>
  );
}
