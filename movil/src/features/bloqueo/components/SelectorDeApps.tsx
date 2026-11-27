import { useEffect, useState, type ComponentType } from 'react';
import { View } from 'react-native';
import { Texto } from '@/shared/ui';
import { SELECCION } from '../model/escudo';

/**
 * The app picker, on its own screen.
 *
 * Full height on purpose: it was a 384-pixel box inside a scrolling
 * page, which showed about four apps on a phone that has sixty. The
 * learner is choosing what to lock themselves out of — that deserves
 * the screen.
 *
 * `style={{ flex: 1 }}` is not decoration. The native view measures
 * itself from the style React Native gives it, and without one it
 * lays out at zero height: the first real-device test showed an empty
 * box and the module looked broken when the only thing missing was a
 * height.
 */
export function SelectorDeApps({
  alCambiar,
}: {
  /** Called on every change, because selecting is what blocks. */
  alCambiar: () => void;
}) {
  const [Picker, setPicker] = useState<ComponentType<Record<string, unknown>> | null>(
    null,
  );
  const [fallo, setFallo] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    void import('expo-screen-time')
      .then((mod) => {
        if (vivo) setPicker(() => mod.ActivityPicker as never);
      })
      .catch(() => {
        if (vivo) setFallo('Este teléfono no puede mostrar la lista de apps.');
      });
    return () => {
      vivo = false;
    };
  }, []);

  if (fallo) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        {/* Announced, because this replaces the whole screen the
            learner was expecting: a screen reader that says nothing
            leaves them waiting on a list that is never coming. */}
        <Texto
          estilo="cuerpo"
          className="text-center text-texto-apagado"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {fallo}
        </Texto>
      </View>
    );
  }

  if (!Picker) {
    return (
      <View className="flex-1 items-center justify-center">
        <Texto estilo="apoyo" accessibilityLiveRegion="polite">
          Cargando tus apps…
        </Texto>
      </View>
    );
  }

  return (
    <Picker
      selectionId={SELECCION}
      style={{ flex: 1 }}
      searchPlaceholder="Buscar una app"
      emptyText="Este teléfono no reporta apps que se puedan bloquear."
      noMatchText="Ninguna app con ese nombre."
      /* Every change applies the block. There is no Block button, and
         that is the design: "what is selected is blocked" explains
         itself, while a separate button leaves a state where
         something is picked and nothing is blocked. */
      onSelectionChange={alCambiar}
    />
  );
}
