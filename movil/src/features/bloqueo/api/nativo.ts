import { Platform } from 'react-native';

/**
 * The native blocking module, behind one door.
 *
 * Imported lazily and never at module scope. Two reasons, both of
 * which have already cost a debugging session: the module does not
 * exist in Expo Go or in a web build, and a top-level import there
 * takes the whole screen down rather than the one feature.
 *
 * Every call returns a result instead of throwing. A learner whose
 * phone refuses a native call should see the app work with blocking
 * off, not a crash.
 */

export type ResultadoNativo<T> =
  | { readonly ok: true; readonly valor: T }
  | { readonly ok: false; readonly motivo: string };

let cache: Promise<unknown> | null = null;

/** The module, or null where it cannot exist. */
async function modulo(): Promise<Record<string, Function> | null> {
  if (Platform.OS === 'web') return null;
  if (!cache) cache = import('expo-screen-time').then((m) => m.default ?? m);
  try {
    return (await cache) as Record<string, Function>;
  } catch {
    /* A build without the native side compiled in — Expo Go, or a
       preview APK built before the plugin was declared. Reported as
       absent rather than as an error, because that is what it is. */
    cache = null;
    return null;
  }
}

export async function disponible(): Promise<boolean> {
  return (await modulo()) !== null;
}

async function llamar<T>(
  nombre: string,
  ...args: unknown[]
): Promise<ResultadoNativo<T>> {
  const m = await modulo();
  if (!m) return { ok: false, motivo: 'El bloqueo no está disponible en este dispositivo.' };

  const fn = m[nombre];
  if (typeof fn !== 'function') {
    /* A module that exists but lacks the call means a version
       mismatch. Named, because "no funcionó" would send someone
       looking at permissions for an hour. */
    return { ok: false, motivo: `Esta versión del módulo no tiene ${nombre}.` };
  }

  try {
    return { ok: true, valor: (await fn.apply(m, args)) as T };
  } catch (error) {
    return { ok: false, motivo: String(error) };
  }
}

export const nativo = {
  disponible,

  capacidades: () => llamar<Record<string, unknown>>('getCapabilities'),

  /* `getScreenTimePermissionsAsync`, not `...PermissionStatus`. The
     wrong name shipped once: the wrapper correctly reported "this
     version of the module has no such call" and the screen showed an
     empty Permisos section, so it read as a missing feature rather
     than a typo. */
  permisos: () => llamar<Record<string, unknown>>('getScreenTimePermissionsAsync'),

  pedirPermiso: (step?: string) =>
    llamar<Record<string, unknown>>(
      'requestScreenTimePermissionsAsync',
      step ? { step } : undefined,
    ),

  /** Whether anything is shielded right now. */
  estaBloqueado: () => llamar<boolean>('isBlocked'),

  bloquear: (seleccionId: string) => llamar<void>('blockSelection', seleccionId),

  desbloquearTodo: () => llamar<void>('unblockAll'),

  /** Lifts the shield for `segundos` of *use*, not of clock. */
  desbloqueoTemporal: (segundos: number) =>
    llamar<Record<string, unknown>>('temporaryUnlock', segundos),

  segundosRestantes: () => llamar<number>('getRemainingUnlockSeconds'),

  cuantasApps: (seleccionId: string) =>
    llamar<{ applicationCount?: number } | null>('getSelectionMetadata', seleccionId),

  configurarEscudo: (config: unknown) => llamar<void>('setShieldConfig', config),

  accionesDelEscudo: (config: unknown) => llamar<void>('setShieldActions', config),
};
