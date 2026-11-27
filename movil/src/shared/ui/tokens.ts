/**
 * The design tokens, in one place.
 *
 * Taken from the validated design system
 * (https://claude.ai/artifact/4fxQ8Vc4XrDDN3BzXPfvnM) rather than
 * chosen here: every value was checked for contrast before it landed,
 * and the ones that failed were changed, not waived.
 *
 * Named by role, never by hue. `acento` can stop being purple without
 * a sweep through the codebase; `morado` could not.
 *
 * `tailwind.config.js` re-exports these so a component can write
 * `bg-capa` instead of a style object. The two must agree — there is
 * a test for that.
 */

export const color = {
  /* Surfaces. The card separates from the background by being whiter,
     not by a border: that difference is the whole elevation system. */
  fondo: '#f7f6fc',
  capa: '#ffffff',
  capaAlta: '#f2f1f9',
  linea: '#ebeaf4',

  /* 3,36:1 against capa. The reference design used a prettier
     #d6d4e6, which measures 1,46:1 — a field nobody can see is a
     field nobody fills. */
  bordeControl: '#8c8a9e',

  texto: '#1a1a24',
  textoApagado: '#6b6977',

  /* The one structural colour. Once per screen: the button that says
     what the screen is for. */
  acento: '#6a57e0',
  sobreAcento: '#ffffff',
  acentoTexto: '#5b48d4',
  acentoSuave: '#efecfd',

  /* What the learner earned. Never a button that moves forward.
     Darker than it looks like it needs to be: the lighter green it
     started as carried white text at 3,38:1, which the "Cobrar 15
     minutos" button would have failed. */
  ganado: '#258055',
  sobreGanado: '#ffffff',
  ganadoSuave: '#e8f6ee',

  /* A wrong answer. Amber, not red: failing here is the data that
     feeds the weakness profile, not an offence. Deliberately quieter
     than `ganado` — the saturated version outweighed the correct
     answer on screen, which is backwards. */
  fallo: '#b4701c',
  falloSuave: '#fdf3e5',

  /* Only what can actually be lost: an unreviewed report, a dropped
     session, a permission Android refuses outright. Never a learner's
     mistake — that is `fallo`, and it is amber.

     `alertaSuave` is the surface to sit it on. Before it existed the
     three places that needed one reached for `bg-red-50` out of the
     discarded palette, which is how a colour nobody chose ends up in
     a design system. */
  alerta: '#c33a52',
  alertaSuave: '#fdecef',

  foco: '#6a57e0',
} as const;

/**
 * The colours an avatar can be, and the grey for nobody yet.
 *
 * Apart from the palette above on purpose, and not reachable through
 * `color`: these are not roles. `acento` can stop being purple
 * without touching a class string, which is the point of naming by
 * role — but an avatar's colour must NOT move, because a learner
 * recognises a friend in a list by it. Putting them in `color` would
 * invite the next restyle to change them and break that.
 *
 * Fixed rather than theme-derived for the same reason they do not
 * change for dark mode: the person you recognise cannot be a
 * different colour in the evening.
 *
 * Chosen to carry white text at the weight the initials use.
 */
export const colorAvatar = [
  '#6366F1', // índigo
  '#0891B2', // cian
  '#059669', // esmeralda
  '#D97706', // ámbar
  '#DC2626', // rojo
  '#7C3AED', // violeta
  '#DB2777', // rosa
  '#2563EB', // azul
] as const;

/** Nobody yet. Its own colour, so they do not all look like one person. */
export const colorAvatarSinNombre = '#64748B';

export const espacio = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 28,
} as const;

export const radio = {
  chico: 12,
  medio: 16,
  tarjeta: 20,
  pildora: 999,
} as const;

/** Nothing touchable is smaller than `minimo`. */
export const control = {
  minimo: 44,
  boton: 56,
  opcion: 60,
  anchoMaximo: 560,
} as const;

export const tipo = {
  marca: 'Nunito',
  texto: 'Inter',
} as const;

/** Milliseconds. Shared so the character and the screens agree. */
export const duracion = {
  pose: 420,
  parpadeoBaja: 110,
  parpadeoSube: 130,
  trazo: 180,
  rapido: 140,
} as const;

export type Color = keyof typeof color;
