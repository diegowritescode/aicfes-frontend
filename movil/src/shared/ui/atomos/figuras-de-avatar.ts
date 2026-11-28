/**
 * The figures a learner may pick, as paths.
 *
 * Vector and bundled, for the same three reasons the character is:
 * the whole set weighs about what one photograph would, it draws at
 * any size without a second asset, and it never fails to load — which
 * matters on the connections this app actually runs on, and matters
 * more on a profile screen where a missing avatar reads as a broken
 * account.
 *
 * Nothing here goes to a server and nothing is uploaded. A learner
 * stores a slug like `zorro`; the drawing lives in the app. That is
 * what makes a picked avatar cost nothing to moderate: there is no
 * image to review, because every possible image is in this file.
 *
 * Why no human faces: «which one looks like me» is a question with no
 * good answer in a product for Colombian teenagers, and the honest
 * options are either twelve skin tones per figure or none. Animals
 * and objects dodge it entirely, and a 16-year-old picking a fox is
 * not settling for less.
 *
 * Drawn as strokes on a 24×24 grid at stroke 1.9, matching every
 * other icon in the app. Single-colour on purpose: the figure is
 * white on the chosen background, so one path per figure is the whole
 * drawing and a learner's two choices stay independent.
 *
 * The slugs must match `src/duelos/model/avatares.ts` on the server,
 * which is the authority on which exist. `catalogo.test.ts` fails the
 * build if they drift.
 */

export const FIGURAS = {
  /* Animals. */
  zorro: 'M4 7l3 5M20 7l-3 5M7 12c0 3 2.3 5 5 5s5-2 5-5l-2.5-4h-5ZM10 11v.5M14 11v.5M12 14v1',
  pulpo:
    'M8 9a4 4 0 0 1 8 0v3H8ZM10 8v.5M14 8v.5M8 12c-1 2-2.5 2.5-3.5 4M10.5 12c-.5 2.5-.5 3.5-1 5.5M13.5 12c.5 2.5.5 3.5 1 5.5M16 12c1 2 2.5 2.5 3.5 4',
  buho: 'M6 6.5V4l2.5 2M18 6.5V4l-2.5 2M12 4.5a6.5 6.5 0 0 0-6 6.5c0 4 2.7 7 6 7s6-3 6-7a6.5 6.5 0 0 0-6-6.5ZM9.5 10.5v.5M14.5 10.5v.5M12 12.5l-1 1h2Z',
  tortuga:
    'M8 16a5 5 0 0 1 8-4 5 5 0 0 1-8 4ZM7 16.5v2M17 16.5v2M18 12.5c1-.5 2-.5 2.5 0M12 11V8',
  gato: 'M7 8.5V5l3 2.5M17 8.5V5l-3 2.5M12 6.5c-3 0-5 2.5-5 5.5s2 5.5 5 5.5 5-2.5 5-5.5-2-5.5-5-5.5ZM10 11v.5M14 11v.5M12 13v1M9 13.5h-2M15 13.5h2',
  perro: 'M7 7c-1.5 0-2 1.5-2 3v3M17 7c1.5 0 2 1.5 2 3v3M12 7c-2.8 0-5 2.2-5 5.5S9.2 18 12 18s5-2.2 5-5.5S14.8 7 12 7ZM10 12v.5M14 12v.5M12 14.5v.5M10.5 16h3',
  delfin: 'M4 14c3-6 9-8 15-7-1 5-4 9-9 10-2.5.5-4.5-1-6-3ZM12 7V4.5M15 10v.5M4 14c-.5 2 0 3.5 1.5 4.5',
  leon: 'M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M11 11v.5M13 11v.5M12 13v1M5 9l-1.5-1M19 9l1.5-1M5 15l-1.5 1M19 15l1.5 1',
  rana: 'M6 9a3 3 0 1 1 6 0M12 9a3 3 0 1 1 6 0M8 9v.5M16 9v.5M6 12c0 3 2.7 5 6 5s6-2 6-5ZM5 17l-1.5 2M19 17l1.5 2',
  abeja: 'M12 7a4 4 0 0 1 4 4v3a4 4 0 0 1-8 0v-3a4 4 0 0 1 4-4ZM8 11h8M8 14h8M10 6l-1-2M14 6l1-2M8 10C5.5 8.5 4 9 3.5 10.5M16 10c2.5-1.5 4-1 4.5.5',
  pinguino:
    'M12 4a5 5 0 0 0-5 5v6a5 5 0 0 0 10 0V9a5 5 0 0 0-5-5ZM10 8v.5M14 8v.5M12 10l-1 1h2ZM12 12v5M7 19l2-1M17 19l-2-1',
  mariposa:
    'M12 7v10M12 9c-2-3-5-3.5-6.5-2s-.5 5 1.5 6 4-1 5-2M12 9c2-3 5-3.5 6.5-2s.5 5-1.5 6-4-1-5-2M11 6l-1.5-1.5M13 6l1.5-1.5',
  /* Objects. */
  cohete:
    'M12 3c2.5 2.5 4 6 4 9l-4 3-4-3c0-3 1.5-6.5 4-9ZM12 9v.5M8 13l-2 4 3-1.5M16 13l2 4-3-1.5M10.5 19h3',
  cactus: 'M12 20V7a2.5 2.5 0 0 1 5 0v4M12 13H8.5A2.5 2.5 0 0 1 6 10.5V9M12 20h-2M12 20h2M17 11v1.5a2 2 0 0 1-2 2',
  guitarra:
    'M10 13a4 4 0 1 0 5 5 4 4 0 0 0-5-5ZM12.5 15.5l6-6M17 8l3-3M18.5 9.5l1.5-1.5M12 17.5v.5',
  libro: 'M4 5h7a2.5 2.5 0 0 1 2.5 2.5V19a2 2 0 0 0-2-2H4ZM20 5h-5a2.5 2.5 0 0 0-2.5 2.5V19a2 2 0 0 1 2-2H20ZM6.5 9h3M6.5 12h3',
  balon: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM12 8l3 2-1 3.5h-4L9 10ZM12 4v4M19.5 10l-4.5.5M4.5 10l4.5.5M8 19l2-5.5M16 19l-2-5.5',
  cafe: 'M5 8h12v5a5 5 0 0 1-10 0ZM17 9h2a2 2 0 0 1 0 4h-2M5 19h13M9 5.5C9 4.5 10 4.5 10 3.5M13 5.5c0-1 1-1 1-2',
  bicicleta:
    'M6.5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6M17.5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6M6.5 15h5l3-7M11 8h4M14.5 8l3 7',
  audifonos:
    'M5 15v-3a7 7 0 0 1 14 0v3M5 14h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1ZM19 14h-2a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1Z',
  /* Symbols. */
  rayo: 'M13.5 3 6 13.5h5l-1.5 7.5L18 10.5h-5l.5-7.5Z',
  estrella: 'M12 4l2.4 5.2 5.6.7-4.1 3.9 1.1 5.6L12 16.6l-5 2.8 1.1-5.6-4.1-3.9 5.6-.7Z',
  luna: 'M15 4a8 8 0 1 0 5 13A9 9 0 0 1 15 4ZM17.5 6.5l.7 1.4 1.5.2-1.1 1 .3 1.5-1.4-.7-1.4.7.3-1.5-1.1-1 1.5-.2Z',
  planeta:
    'M12 5a6 6 0 1 0 0 12 6 6 0 0 0 0-12M4 14c3.5 2 12.5 2 16-2M6 9.5c1.5 1 3.5 1.5 5.5 1.5',
} as const;

export type Figura = keyof typeof FIGURAS;

/** The order they appear in the picker. Object key order is not a contract. */
export const ORDEN_DE_FIGURAS = [
  'zorro', 'pulpo', 'buho', 'tortuga',
  'gato', 'perro', 'delfin', 'leon',
  'rana', 'abeja', 'pinguino', 'mariposa',
  'cohete', 'cactus', 'guitarra', 'libro',
  'balon', 'cafe', 'bicicleta', 'audifonos',
  'rayo', 'estrella', 'luna', 'planeta',
] as const satisfies readonly Figura[];

/**
 * Whether a slug is one we can draw.
 *
 * The server validates on the way in, but a profile read back from an
 * older or newer build can carry a slug this binary does not know.
 * That is not an error to show: it falls back to initials, which is
 * what every account had before any of this existed.
 */
export function esFigura(valor: unknown): valor is Figura {
  return typeof valor === 'string' && valor in FIGURAS;
}

/** What each figure is, for a screen reader and for the picker's label. */
export const NOMBRE_DE_FIGURA: Record<Figura, string> = {
  zorro: 'Zorro',
  pulpo: 'Pulpo',
  buho: 'Búho',
  tortuga: 'Tortuga',
  gato: 'Gato',
  perro: 'Perro',
  delfin: 'Delfín',
  leon: 'León',
  rana: 'Rana',
  abeja: 'Abeja',
  pinguino: 'Pingüino',
  mariposa: 'Mariposa',
  cohete: 'Cohete',
  cactus: 'Cactus',
  guitarra: 'Guitarra',
  libro: 'Libro',
  balon: 'Balón',
  cafe: 'Café',
  bicicleta: 'Bicicleta',
  audifonos: 'Audífonos',
  rayo: 'Rayo',
  estrella: 'Estrella',
  luna: 'Luna',
  planeta: 'Planeta',
};
