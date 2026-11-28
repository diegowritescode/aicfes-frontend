import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ranuraDe } from './color-de-avatar';
import { colorTintaDeAvatar } from '../tokens';
import { FIGURAS, esFigura } from './figuras-de-avatar';

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
 * A learner may now pick one of 24 drawn figures instead of their
 * initials, and a colour behind it. That is an amendment to the above
 * rather than a reversal: the figures ship inside the app, so there
 * is still nothing uploaded, nothing stored and nothing to moderate.
 * What changed is that the avatar is a choice. `figura` null is not a
 * missing value — it is the derived avatar, which is what every
 * account had before the column existed and what every account keeps
 * until it picks.
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

/* The drawn figure, in pixels, per box. Smaller than the box so the
   figure has air around it — a path filling its tile reads as cramped
   beside the initials it replaces. */
const FIGURA_PX = {
  chico: 20,
  normal: 26,
  grande: 46,
} as const;

/* Thinner at the large size. A 1.9 stroke scaled to 46px looks
   heavier than the same stroke at 20px, because the stroke does not
   scale with the box: it is set in the viewBox's units. */
const TRAZO_FIGURA = {
  chico: 2.1,
  normal: 2,
  grande: 1.7,
} as const;

export function Avatar({
  nombre,
  tamano = 'normal',
  figura,
  color,
}: {
  nombre: string;
  /**
   * `chico` is for the opponent's name inside a running duel.
   * `grande` is for a profile screen, where the avatar is the subject
   * rather than a label on a row.
   */
  tamano?: keyof typeof CAJA;
  /**
   * The figure this person picked, or null/undefined for initials.
   *
   * Takes an unvalidated string on purpose: it arrives from the
   * server, and a slug added in a later release reaches an older
   * build as a word this one cannot draw. `esFigura` decides, and the
   * fallback is the derived avatar rather than an empty tile.
   */
  figura?: string | null;
  /**
   * Which background, 0-7. Null means derive it from the name, which
   * is what every avatar did before a learner could choose.
   *
   * Out-of-range is treated as unset rather than clamped: a colour
   * silently becoming a different colour is the bug nobody reports.
   */
  color?: number | null;
}) {
  const dibujo = esFigura(figura) ? FIGURAS[figura] : null;

  /* The picked colour wins, then the one derived from the name, then
     the grey for nobody yet. `??` and not `||`, because slot 0 is
     índigo and a real choice. */
  const ranura =
    typeof color === 'number' && color >= 0 && color < FONDO.length ? color : ranuraDe(nombre);

  return (
    <View
      /* Decorative: the name it stands for is always written beside
         it, so a screen reader announcing «SR» twice is noise. That
         holds for a figure too — «Zorro» is not this person's name,
         and reading it out would introduce someone who is not there. */
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={`items-center justify-center ${FONDO[ranura ?? -1] ?? FONDO_SIN_NOMBRE} ${CAJA[tamano]}`}
    >
      {dibujo ? (
        <Svg
          width={FIGURA_PX[tamano]}
          height={FIGURA_PX[tamano]}
          viewBox="0 0 24 24"
          fill="none"
        >
          <Path
            d={dibujo}
            /* White, like the initials it replaces, and for the same
               reason: the eight backgrounds were chosen to carry it.
               From a token and not written here: `tokens.ts` is the
               only file in `shared/ui` that may hold a hex, and
               `tokens.test.ts` fails the build over it. */
            stroke={colorTintaDeAvatar}
            strokeWidth={TRAZO_FIGURA[tamano]}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ) : (
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
      )}
    </View>
  );
}
