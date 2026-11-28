import { View, type ViewProps } from 'react-native';
import type { ReactNode } from 'react';
import { sombra } from '../sombras';

/**
 * The surface everything sits on.
 *
 * In the validated design a card separates from the background by
 * being whiter than it, not by a border. That is the entire elevation
 * system: `fondo` is tinted, `capa` is pure white, and the shadow only
 * confirms what the brightness already said.
 *
 * Four variants, and they are not interchangeable:
 *
 * - `alzada` is the default. White, with a shadow. Anything the
 *   learner acts on.
 * - `plana` is `capa-alta` with no shadow. For context that supports
 *   the card above it — «Lo que quedó anotado», «esperando». Two
 *   stacked raised cards make neither of them the subject.
 * - `acento` is the tinted panel, no shadow. Once per screen at most.
 *   The artifact uses it for «Tienes tiempo» on the dashboard.
 * - `borde` is white with a hairline and no shadow, for a figure or a
 *   diagram, where a shadow would read as part of the drawing.
 */

type Variante = 'alzada' | 'plana' | 'acento' | 'borde';

const FONDO: Record<Variante, string> = {
  alzada: 'bg-capa',
  plana: 'bg-capa-alta',
  acento: 'bg-acento-suave',
  borde: 'bg-capa border border-linea',
};

export function Tarjeta({
  children,
  variante = 'alzada',
  className = '',
  style,
  ...resto
}: ViewProps & { children: ReactNode; variante?: Variante; className?: string }) {
  return (
    <View
      /* Only the shadow goes inline: NativeWind's `shadow-*` classes
         compile to the web box-shadow and do nothing on Android.
         Nothing else belongs here — a `backgroundColor` or a
         `borderRadius` in a style object overrides the compiled class
         and the card loses its fill. `tokens.test.ts` enforces it. */
      style={[variante === 'alzada' ? sombra.tarjeta : undefined, style]}
      className={`rounded-tarjeta p-4 ${FONDO[variante]} ${className}`}
      {...resto}
    >
      {children}
    </View>
  );
}
