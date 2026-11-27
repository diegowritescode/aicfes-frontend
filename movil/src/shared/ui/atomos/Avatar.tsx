import { Text, View } from 'react-native';
import { ranuraDe } from './color-de-avatar';

/**
 * Someone else, in two letters.
 *
 * A squared-off rounded tile rather than a circle: the whole design
 * is built on 12–20px radii, and a circle beside those reads as
 * borrowed from somewhere else.
 *
 * No photographs. These are minors, the accounts are made with a
 * school email, and a duel does not need a face to work. Initials
 * also never fail to load, which matters on the connections this app
 * actually runs on.
 *
 * The fill comes from the name, not from the theme. Everyone sharing
 * `bg-acento-suave` was fine beside a single opponent's name in a
 * duel, but a list of friends is where an avatar earns its place:
 * colour is what separates one row from the next without reading.
 * See `color-de-avatar.ts` for why the palette is fixed hex and not
 * theme tokens.
 */

/** Two letters at most: more does not fit and does not help. */
function iniciales(nombre: string): string {
  const partes = nombre
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0]!.slice(0, 2).toUpperCase();
  return (partes[0]![0]! + partes[partes.length - 1]![0]!).toUpperCase();
}

/**
 * One class per colour, written out.
 *
 * `bg-avatar-${n}` would be a class NativeWind never sees and never
 * compiles, so the tile would come out unpainted. Passing the hex
 * through `style` has the opposite failure: a `style` colour can beat
 * a compiled class, which once shipped a button with no fill at all,
 * and `tokens.test.ts` fails the build over it. Nine literals are the
 * price of obeying both.
 */
const FONDO = [
  'bg-avatar-0',
  'bg-avatar-1',
  'bg-avatar-2',
  'bg-avatar-3',
  'bg-avatar-4',
  'bg-avatar-5',
  'bg-avatar-6',
  'bg-avatar-7',
] as const;

/** Nobody yet. */
const FONDO_SIN_NOMBRE = 'bg-avatar-sin-nombre';

/* Three sizes, and the classes written out rather than built from a
   number: NativeWind compiles what it can see, so `h-[${n}px]` is a
   class that never reaches the stylesheet. */
const CAJA = {
  chico: 'h-[30px] w-[30px] rounded-[10px]',
  normal: 'h-10 w-10 rounded-chico',
  grande: 'h-[72px] w-[72px] rounded-tarjeta',
} as const;

const LETRA = {
  chico: 'text-[12px]',
  normal: 'text-[15px]',
  grande: 'text-[28px]',
} as const;

export function Avatar({
  nombre,
  tamano = 'normal',
}: {
  nombre: string;
  /**
   * `chico` is for the opponent's name inside a running duel.
   * `grande` is for a profile screen, where the avatar is the subject
   * rather than a label on a row.
   */
  tamano?: keyof typeof CAJA;
}) {

  return (
    <View
      /* Decorative: the name it stands for is always written beside
         it, so a screen reader announcing «SR» twice is noise. */
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={`items-center justify-center ${FONDO[ranuraDe(nombre) ?? -1] ?? FONDO_SIN_NOMBRE} ${CAJA[tamano]}`}
    >
      <Text
        /* White rather than `text-acento-texto`: the fill is now one
           of eight colours instead of the one pale accent, and the
           palette is chosen to carry white at this weight. The colour
           is a class, not a `style`, for the reason `FONDO` exists. */
        style={{ fontFamily: 'Nunito_800ExtraBold' }}
        className={`text-white ${LETRA[tamano]}`}
      >
        {iniciales(nombre)}
      </Text>
    </View>
  );
}
