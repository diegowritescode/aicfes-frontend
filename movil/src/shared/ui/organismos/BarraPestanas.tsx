import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTabTrigger } from 'expo-router/ui';
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
 * structural rather than remembered — those routes live outside
 * `app/(pestanas)/`, so the bar cannot appear on them.
 *
 * The bar is assembled in `app/(pestanas)/_layout.tsx`, which renders
 * one `PestanaBoton` per entry. This file holds the list and the
 * button; the navigator holds the bar. That split is what stopped the
 * bar from blinking on every change: when each screen drew its own
 * copy, switching tabs unmounted one bar and mounted another.
 */

/* Drawn here as paths rather than pulled from an icon package: five
   24px glyphs do not justify a dependency, and the stroke weight has
   to match the artifact's 1.9. */
const ICONOS = {
  casa: 'M3 11l9-8 9 8M5 10v10h14V10',
  pesa: 'M4 9v6M20 9v6M7 7v10M17 7v10M7 12h10',
  /* A game controller, not the crossed swords duels used to carry:
     the tab now holds contrarreloj too, and a clock is not a duel.
     What the two share is that you play them. */
  mando: 'M7 12h4M9 10v4M15.5 11.5h.01M18 13.5h.01M8 7h8a5 5 0 0 1 5 5v1a4 4 0 0 1-7 2.8L13 15h-2l-1 .8A4 4 0 0 1 3 13v-1a5 5 0 0 1 5-5Z',
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
  { ruta: '/jugar', icono: 'mando', nombre: 'Jugar' },
  { ruta: '/repaso', icono: 'reloj', nombre: 'Repaso' },
  { ruta: '/yo', icono: 'yo', nombre: 'Yo' },
];

export type RutaPestana = Pestana['ruta'];

/**
 * One tab.
 *
 * Driven by `useTabTrigger` rather than by wrapping the button in a
 * `<TabTrigger asChild>`. That wrapper was tried first and shipped
 * the bar broken: the five tabs rendered as one horizontal run of
 * icons and labels, nothing marked the current tab, and tapping did
 * nothing at all.
 *
 * Three separate faults, one cause. `asChild` is implemented with
 * `@radix-ui/react-slot`, a web component: on React Native it does
 * not clone a `Pressable`, so neither the press handler nor the
 * focused flag ever arrived. And the trigger applies its own
 * `{ flexDirection: 'row', justifyContent: 'space-between' }`, which
 * in web CSS would be overridden by the child's class but here wins
 * outright — NativeWind compiles `className` to a style object, and a
 * style the parent passes down lands on top of it. That is the same
 * failure the design system already documents for inline styles,
 * arriving from a library instead of from our own code.
 *
 * The hook hands back exactly what the wrapper was supposed to
 * deliver — `onPress`, `onLongPress`, `isFocused` — with no component
 * in between and no style of its own, so the button below is plain
 * React Native and the design survives intact.
 */
export function PestanaBoton({ pestana }: { pestana: Pestana }) {
  const { triggerProps } = useTabTrigger({ name: pestana.nombre });
  const activa = triggerProps.isFocused;

  return (
    <Pressable
      onPress={triggerProps.onPress}
      onLongPress={triggerProps.onLongPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: activa }}
      accessibilityLabel={pestana.nombre}
      /* 44pt minimum, even though the glyph is 21: the row is at the
         bottom edge where thumbs are least accurate. `flex-1` so the
         five share the width evenly — without it they bunch up
         against each other, which is how the broken bar looked. */
      className="min-h-toque flex-1 items-center justify-center gap-[3px]"
    >
      <Svg width={21} height={21} viewBox="0 0 24 24">
        <Path
          d={ICONOS[pestana.icono]}
          stroke={activa ? color.acentoTexto : color.textoApagado}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
      <Text
        style={{ fontFamily: 'Inter_600SemiBold' }}
        className={`text-[10px] ${activa ? 'text-acento-texto' : 'text-texto-apagado'}`}
      >
        {pestana.nombre}
      </Text>
    </Pressable>
  );
}
