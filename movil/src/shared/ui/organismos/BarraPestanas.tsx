import { forwardRef } from 'react';
import { Pressable, Text, type PressableProps, type View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { color } from '../tokens';

/**
 * The five places the app goes.
 *
 * This replaced the drawer. A drawer hides navigation behind a tap
 * and a gesture, which is defensible on a dense dashboard and wrong
 * here: the validated design puts the five destinations on screen at
 * all times, so the learner never has to remember what exists.
 *
 * Five is the ceiling, not a target. A sixth tab would shrink every
 * label below legible, and anything that is not one of these five is
 * a setting — it belongs inside «Yo».
 *
 * Deliberately absent from the toll, the duel, the drill and the mock
 * exam: those are one task each, and a tab bar there is an invitation
 * to abandon a session halfway. The toll in particular runs over
 * another app and has no «somewhere else» to offer. That exclusion is
 * now structural rather than remembered — those routes live outside
 * `app/(pestanas)/`, so there is no way for the bar to appear on them.
 *
 * The bar itself is assembled in `app/(pestanas)/_layout.tsx`, which
 * renders one `PestanaBoton` per entry inside a `TabList`. This file
 * holds the list and the button; the navigator holds the bar. That
 * split is what stopped the bar from blinking on every change: when
 * each screen drew its own copy, switching tabs unmounted one bar and
 * mounted another, and the flicker a learner reported was those two
 * events. Nothing here tracks the current route any more — Expo
 * passes `isFocused` in, because it is the navigator that knows.
 */

/* Drawn here as paths rather than pulled from an icon package: five
   24px glyphs do not justify a dependency, and the stroke weight has
   to match the artifact's 1.9. */
const ICONOS = {
  casa: 'M3 11l9-8 9 8M5 10v10h14V10',
  pesa: 'M4 9v6M20 9v6M7 7v10M17 7v10M7 12h10',
  espadas: 'M5 3l9 9-2 2-9-9zM19 3l-9 9 2 2 9-9',
  reloj: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l3 2',
  yo: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M4 21a8 8 0 0 1 16 0',
} as const;

export interface Pestana {
  readonly ruta: string;
  readonly icono: keyof typeof ICONOS;
  readonly nombre: string;
}

export const PESTANAS: readonly Pestana[] = [
  { ruta: '/inicio', icono: 'casa', nombre: 'Inicio' },
  { ruta: '/entrenar', icono: 'pesa', nombre: 'Entrenar' },
  { ruta: '/duelos', icono: 'espadas', nombre: 'Duelos' },
  { ruta: '/repaso', icono: 'reloj', nombre: 'Repaso' },
  { ruta: '/yo', icono: 'yo', nombre: 'Yo' },
];

export type RutaPestana = Pestana['ruta'];

/**
 * One tab.
 *
 * Takes a ref and spreads the rest because `TabTrigger asChild` hands
 * it the press handler, the focus state and the accessibility role of
 * a real tab. Declaring `isFocused` separately keeps it out of that
 * spread: it is not a `Pressable` prop, and React Native warns when
 * an unknown one reaches the host component.
 */
export const PestanaBoton = forwardRef<
  React.ElementRef<typeof View>,
  PressableProps & { pestana: Pestana; isFocused?: boolean }
>(function PestanaBoton({ pestana, isFocused = false, ...resto }, ref) {
  return (
    <Pressable
      ref={ref}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={pestana.nombre}
      /* 44pt minimum, even though the glyph is 21: the row is at the
         bottom edge where thumbs are least accurate. */
      className="min-h-toque min-w-[56px] items-center justify-center gap-[3px]"
      {...resto}
    >
      <Svg width={21} height={21} viewBox="0 0 24 24">
        <Path
          d={ICONOS[pestana.icono]}
          stroke={isFocused ? color.acentoTexto : color.textoApagado}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
      <Text
        style={{ fontFamily: 'Inter_600SemiBold' }}
        className={`text-[10px] ${isFocused ? 'text-acento-texto' : 'text-texto-apagado'}`}
      >
        {pestana.nombre}
      </Text>
    </Pressable>
  );
});
