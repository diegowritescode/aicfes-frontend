/**
 * What the menu offers, and in what order.
 *
 * Here rather than inside the drawer component because the order is a
 * product decision — what a learner should reach first — and a
 * decision deserves a test rather than a reading of JSX.
 */

export interface EntradaDeMenu {
  readonly ruta: string;
  readonly titulo: string;
  /** One line, so the learner knows what it is before tapping. */
  readonly descripcion: string;
}

/**
 * Ordered by what gets someone closer to the exam.
 *
 * Practice first, because that is the product. The toll sits second
 * rather than first: it is the strongest mechanic but the one a
 * learner reaches for least on their own, and putting it at the top
 * would make the app feel like it is about blocking rather than about
 * studying.
 */
export const ENTRADAS: readonly EntradaDeMenu[] = [
  {
    ruta: '/entrenar',
    titulo: 'Entrenar',
    descripcion: 'Preguntas con respuesta inmediata.',
  },
  {
    ruta: '/peaje',
    titulo: 'Modo intensivo',
    descripcion: 'Cinco preguntas antes de volver a lo tuyo.',
  },
  {
    ruta: '/repaso',
    titulo: 'Repasar errores',
    descripcion: 'Lo que fallaste y sigue sin salirte.',
  },
  {
    ruta: '/jugar',
    titulo: 'Jugar',
    descripcion: 'Contra alguien o contra el reloj.',
  },
  {
    ruta: '/simulacro',
    titulo: 'Simulacro',
    descripcion: 'El examen completo, con su nota al final.',
  },
  {
    ruta: '/bloqueo',
    titulo: 'Bloquear apps',
    descripcion: 'Cinco preguntas antes de abrir Instagram.',
  },
];

/**
 * The moderation queue.
 *
 * Shown only when this device holds a moderation token, which a
 * learner never has. Not gated on the build profile: the person who
 * moderates uses the same app as everyone else, so it has to work in
 * the store build.
 */
const MODERACION: EntradaDeMenu = {
  ruta: '/moderacion',
  titulo: 'Denuncias',
  descripcion: 'Leer y atender lo que los estudiantes reportan.',
};

export function entradasDeModeracion(tieneToken: boolean): readonly EntradaDeMenu[] {
  return tieneToken ? [MODERACION] : [];
}

export function esDelMenu(ruta: string): boolean {
  return ENTRADAS.some((e) => ruta.startsWith(e.ruta));
}

/** The entry matching a path, so the drawer can mark where you are. */
export function entradaActiva(ruta: string): EntradaDeMenu | null {
  /* Longest match first: `/simulacro/abc` must match `/simulacro` and
     not something shorter that happens to be a prefix. */
  return (
    [...ENTRADAS]
      .sort((a, b) => b.ruta.length - a.ruta.length)
      .find((e) => ruta.startsWith(e.ruta)) ?? null
  );
}
