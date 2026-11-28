/**
 * The four poses, as numbers rather than drawings.
 *
 * Each field is an animatable property, so moving between poses is
 * interpolation and not a cut. That is the whole reason the character
 * is vector and not a sprite sheet: a blink is one value changing,
 * not four images.
 *
 * The distinction the whole design rests on: a grimace of disapproval
 * is a reaction to *you*; one of concentration is a reaction to the
 * data. On `fallo` the eyes go to the page, never to the learner.
 * Failing gives the character more work, not disappointment.
 */

export type Pose = 'espera' | 'acierto' | 'fallo' | 'invocado' | 'celebra';

export interface Figura {
  /** 0 = eye fully open, 1 = fully covered. */
  readonly parpado: number;
  /** Pupil offset, -1 to 1 on each axis. */
  readonly mirada: readonly [number, number];
  readonly libreta: { readonly x: number; readonly y: number; readonly rot: number };
  readonly lapiz: boolean;
  readonly hoja: 'limpia' | 'marcada' | 'tachada';
  /** Degrees. Positive leans into the work. */
  readonly inclina: number;
}

export const POSES: Record<Pose, Figura> = {
  /* Waiting, not greeting: the gaze goes off to one side, away from
     both the viewer and the page. */
  espera: {
    parpado: 0.44,
    mirada: [-0.34, 0.06],
    libreta: { x: 150, y: 196, rot: 22 },
    lapiz: false,
    hoja: 'limpia',
    inclina: 0,
  },
  /* A correct answer is unremarkable to a recorder: one stroke, and
     on with it. No celebration lives here. */
  acierto: {
    parpado: 0.14,
    mirada: [0.1, 0.4],
    libreta: { x: 138, y: 190, rot: 18 },
    lapiz: true,
    hoja: 'marcada',
    inclina: 1.5,
  },
  /* Head down into the work. Never looking at the learner. */
  fallo: {
    parpado: 0.3,
    mirada: [0.12, 0.62],
    libreta: { x: 140, y: 196, rot: 20 },
    lapiz: true,
    hoja: 'tachada',
    inclina: 4,
  },
  /* The only pose with eye contact, and it happens because it was
     asked for. The contrast with the other three is the point. */
  invocado: {
    parpado: 0,
    mirada: [0.04, 0.02],
    libreta: { x: 132, y: 176, rot: 26 },
    lapiz: true,
    hoja: 'marcada',
    inclina: -2,
  },
  /* Reserved for finishing a full simulacro — 254 questions, hours of
     work. The one thing in the app that actually cost something, and
     the only place this pose is allowed. Straightens up, closes the
     notepad, looks up. If it appeared anywhere else it would stop
     meaning that something was hard. */
  celebra: {
    parpado: 0,
    mirada: [0, -0.1],
    libreta: { x: 146, y: 206, rot: 8 },
    lapiz: false,
    hoja: 'marcada',
    inclina: -4,
  },
};

/** The body outline, traced from the approved artwork. */
export const RUTA_CUERPO =
  'M104 36 C104 22 116 12 132 12 L188 12 C204 12 216 22 216 36 L244 236 C248 258 236 272 214 272 L106 272 C84 272 72 258 76 236 Z';

/** The tone division at 54% of the height, curved as in the drawing. */
export const RUTA_BASE =
  'M86 168 C118 150 150 164 184 158 C208 154 228 148 240 142 L244 236 C248 258 236 272 214 272 L106 272 C84 272 72 258 76 236 Z';

export const OJOS = [
  { cx: 118, cy: 104 },
  { cx: 196, cy: 104 },
] as const;

export const OJO = { rx: 29, ry: 33, pupila: 13 } as const;

/** How far the lid travels from clear of the eye to fully covering it. */
export const RECORRIDO_PARPADO = OJO.ry * 2 + 20;

/**
 * Where the pencil's ORIGIN goes so its TIP lands on the page.
 *
 * The pencil is drawn vertical with its tip at (6.5, 88). Rotating it
 * moves that tip, so placing the origin on the paper leaves the tip
 * 90px away — which is why an earlier version appeared to write in
 * mid-air. The tip's offset is subtracted.
 */
export function puntoDeEscritura(lib: Figura['libreta']): { x: number; y: number; rot: number } {
  const r = (lib.rot * Math.PI) / 180;
  const cx = lib.x + 46 * Math.cos(r) - 58 * Math.sin(r);
  const cy = lib.y + 46 * Math.sin(r) + 58 * Math.cos(r);
  const a = ((lib.rot + 26) * Math.PI) / 180;
  return {
    x: cx - (6.5 * Math.cos(a) - 88 * Math.sin(a)),
    y: cy - (6.5 * Math.sin(a) + 88 * Math.cos(a)),
    rot: lib.rot + 26,
  };
}
