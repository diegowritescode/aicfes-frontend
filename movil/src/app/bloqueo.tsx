import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Texto } from '@/shared/ui';
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

  /* `fondo` on both screens: the permission steps and the app rows
     are `capa` cards, and a card separates from the page by being
     whiter than it — on white there was nothing to separate from. */
  if (cargando) return <SafeAreaView className="flex-1 bg-fondo" />;
  if (!autenticado) return <Redirect href="/entrar" />;

  if (eligiendo) {
    return (
      <SafeAreaView className="flex-1 bg-fondo" edges={['top', 'bottom']}>
        <View className="min-h-toque flex-row items-center justify-between px-5 py-2">
          <Pressable
            onPress={() => setEligiendo(false)}
            accessibilityRole="button"
            className="min-h-toque justify-center pr-3"
          >
            <Texto
              estilo="cuerpo"
              style={{ fontFamily: 'Inter_600SemiBold' }}
              className="text-acento-texto"
            >
              Listo
            </Texto>
          </Pressable>
          <Texto estilo="apoyo">Lo que marques queda bloqueado</Texto>
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
    <SafeAreaView className="flex-1 bg-fondo" edges={['top', 'bottom']}>
      <PantallaBloqueo
        alElegirApps={() => setEligiendo(true)}
        alVolver={() => router.back()}
      />
    </SafeAreaView>
  );
}
