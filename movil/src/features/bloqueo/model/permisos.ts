/**
 * The permission steps, as something a learner can read.
 *
 * The bench showed them as a log: `paso overlay: undetermined
 * (requerido)`. That is the right data in the wrong clothes — it
 * names a state nobody outside this codebase knows, and it offers one
 * button called "pedir el siguiente" that does not say what it will
 * ask for.
 *
 * Pure, because the wording and the order are product decisions.
 */

export type EstadoDePaso = 'granted' | 'denied' | 'undetermined' | 'restricted' | 'unknown';

export interface PasoNativo {
  readonly id: string;
  readonly status: EstadoDePaso;
  readonly required: boolean;
}

export interface PasoLegible {
  readonly id: string;
  /** What it is, in the learner's words. */
  readonly nombre: string;
  /** Why it is needed, in one line. Only shown when not yet granted. */
  readonly porQue: string;
  readonly concedido: boolean;
  readonly requerido: boolean;
  /** The OS refuses it until the learner lifts a restriction first. */
  readonly bloqueadoPorElSistema: boolean;
}

const NOMBRES: Record<string, { nombre: string; porQue: string }> = {
  overlay: {
    nombre: 'Mostrar sobre otras apps',
    porQue: 'Es lo que deja poner las preguntas encima de Instagram.',
  },
  usageAccess: {
    nombre: 'Ver qué app está abierta',
    porQue: 'Sin esto no sabemos cuándo abres una app bloqueada.',
  },
  notifications: {
    nombre: 'Notificaciones',
    porQue: 'Para avisarte cuando se acaben tus minutos.',
  },
  deviceAdmin: {
    nombre: 'Evitar que la cierren a la fuerza',
    porQue: 'Opcional. Hace más difícil saltarse el bloqueo en un mal momento.',
  },
  batteryOptimization: {
    nombre: 'Seguir viva en segundo plano',
    porQue: 'Opcional. Sin esto Android puede apagarnos y el bloqueo falla.',
  },
  backgroundAutostart: {
    nombre: 'Arrancar sola al prender el teléfono',
    porQue: 'Opcional, y solo en algunas marcas.',
  },
  screenTime: {
    nombre: 'Tiempo de uso',
    porQue: 'El permiso de Apple para poder bloquear apps.',
  },
};

export function aLegible(paso: PasoNativo): PasoLegible {
  const texto = NOMBRES[paso.id] ?? {
    nombre: paso.id,
    porQue: 'Hace falta para bloquear apps.',
  };

  return {
    id: paso.id,
    nombre: texto.nombre,
    porQue: texto.porQue,
    concedido: paso.status === 'granted',
    requerido: paso.required,
    /* `restricted` on Android is the sideloaded-app wall: Settings
       refuses the toggle until "Allow restricted settings" is turned
       on, and says nothing about why. Distinguished because the fix
       is different — sending someone to the same screen again does
       nothing. */
    bloqueadoPorElSistema: paso.status === 'restricted',
  };
}

/**
 * The required steps first, and granted ones last within each group.
 *
 * What the learner has to do should be at the top. A list that opens
 * with three green chips and buries the red one is a list that gets
 * closed.
 */
export function ordenar(pasos: readonly PasoLegible[]): readonly PasoLegible[] {
  return [...pasos].sort((a, b) => {
    if (a.requerido !== b.requerido) return a.requerido ? -1 : 1;
    if (a.concedido !== b.concedido) return a.concedido ? 1 : -1;
    return 0;
  });
}

/** The next step worth asking for, or null when nothing is pending. */
export function siguientePendiente(
  pasos: readonly PasoLegible[],
): PasoLegible | null {
  const ordenados = ordenar(pasos);
  /* A step the system has restricted is skipped: asking for it opens
     a screen where the toggle is greyed out, which reads as the app
     being broken. The screen explains that one separately. */
  return (
    ordenados.find((p) => !p.concedido && !p.bloqueadoPorElSistema) ?? null
  );
}

/** Whether blocking can work at all. */
export function listoParaBloquear(pasos: readonly PasoLegible[]): boolean {
  return pasos.filter((p) => p.requerido).every((p) => p.concedido);
}

/** What the button should say, naming what it will ask for. */
export function textoDelBoton(siguiente: PasoLegible | null): string {
  if (!siguiente) return 'Todo listo';
  return `Permitir: ${siguiente.nombre}`;
}

/** The ones the system is refusing, which need different instructions. */
export function bloqueadosPorElSistema(
  pasos: readonly PasoLegible[],
): readonly PasoLegible[] {
  return pasos.filter((p) => p.bloqueadoPorElSistema);
}
