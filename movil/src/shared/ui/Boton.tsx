import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { ReactNode } from 'react';

/**
 * The one button.
 *
 * The web app pulled in 28 Radix packages and used 16 of them, most
 * once. Here the primitives are written rather than installed: there
 * are few of them, they are small, and owning them means a change to
 * how buttons feel is one edit instead of a fight with a library.
 *
 * Touch targets are at least 44pt tall, which is the smallest thing a
 * thumb hits reliably. The web app's 32px buttons were fine with a
 * mouse and would be missed on a phone.
 */

type Variante = 'solido' | 'contorno' | 'suave';
type Tamano = 'medio' | 'grande';

const MARCO: Record<Variante, string> = {
  solido: 'bg-brand-bright active:bg-brand',
  contorno: 'border border-brand-bright bg-transparent active:bg-brand-soft/40',
  suave: 'bg-transparent active:bg-slate-100',
};

const TEXTO: Record<Variante, string> = {
  solido: 'text-white',
  contorno: 'text-brand-bright',
  suave: 'text-slate-600',
};

const ALTO: Record<Tamano, string> = {
  medio: 'min-h-[44px] px-5',
  grande: 'min-h-[52px] px-7',
};

export function Boton({
  children,
  onPress,
  variante = 'solido',
  tamano = 'medio',
  cargando = false,
  deshabilitado = false,
  ancho = false,
  etiqueta,
}: {
  children: ReactNode;
  onPress: () => void;
  variante?: Variante;
  tamano?: Tamano;
  cargando?: boolean;
  deshabilitado?: boolean;
  /** Fills its container, for the primary action on a form. */
  ancho?: boolean;
  /** Overrides the accessible name when the label is not enough. */
  etiqueta?: string;
}) {
  /* A button that is working is not a button that is broken, but both
     must stop accepting taps — a double-submitted answer is a real
     bug, and the second tap is always an accident. */
  const inactivo = deshabilitado || cargando;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      className={`flex-row items-center justify-center gap-2 rounded-full ${MARCO[variante]} ${
        ALTO[tamano]
      } ${ancho ? 'w-full' : ''} ${inactivo ? 'opacity-50' : ''}`}
    >
      {cargando ? (
        <ActivityIndicator
          size="small"
          color={variante === 'solido' ? '#ffffff' : '#2563eb'}
        />
      ) : null}
      <View>
        <Text className={`text-[15px] font-semibold ${TEXTO[variante]}`}>{children}</Text>
      </View>
    </Pressable>
  );
}
