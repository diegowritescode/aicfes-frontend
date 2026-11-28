import { Platform } from 'react-native';

/**
 * Card elevation, which Tailwind cannot do here.
 *
 * NativeWind's `shadow-*` classes compile to the web box-shadow and
 * do nothing on Android — the first build of the redesign came out
 * completely flat because of it, and flat is what made the screen
 * look unfinished beside the mockup.
 *
 * The artifact uses two stacked shadows: a tight 1px edge and a wide
 * soft pool (`0 1px 2px rgba(26,26,36,.05), 0 6px 16px -10px
 * rgba(26,26,36,.22)`). Android cannot stack them, so `elevation`
 * approximates the pair — too low and the card vanishes into the
 * background, too high and it floats.
 */

export const sombra = {
  /** A card resting on the background: option rows, panels. */
  tarjeta: Platform.select({
    android: { elevation: 3 },
    default: {
      shadowColor: '#1a1a24',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
  })!,
  /** Something lifted above the content: a sheet, the answer bar. */
  flotante: Platform.select({
    android: { elevation: 10 },
    default: {
      shadowColor: '#1a1a24',
      shadowOffset: { width: 0, height: 9 },
      shadowOpacity: 0.18,
      shadowRadius: 20,
    },
  })!,
} as const;
