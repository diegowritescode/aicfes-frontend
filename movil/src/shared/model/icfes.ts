import { z } from 'zod';

/**
 * The vocabulary of the exam itself, shared by every feature.
 *
 * It lives in `shared/` rather than in one feature because the five
 * areas are not owned by any of them: the exam, the dashboard, the
 * weakness profile and the time trial all speak in these terms.
 */

export const area = z.enum(['MAT', 'LC', 'CN', 'SOC', 'ING']);
export type Area = z.infer<typeof area>;

export const dificultad = z.enum(['facil', 'media', 'alta']);
export type Dificultad = z.infer<typeof dificultad>;

export const letra = z.enum(['A', 'B', 'C', 'D']);
export type Letra = z.infer<typeof letra>;

export const NOMBRE_AREA: Record<Area, string> = {
  MAT: 'Matemáticas',
  LC: 'Lectura Crítica',
  CN: 'Ciencias Naturales',
  SOC: 'Sociales y Ciudadanas',
  ING: 'Inglés',
};

/**
 * The options of a question.
 *
 * Partial on purpose: the server sends an object keyed by letter, and
 * an item is not guaranteed to carry all four. A screen that assumes
 * four and gets three renders `undefined` as a choice, which is worse
 * than rendering three.
 */
export const opciones = z.record(letra, z.string()).or(
  z.object({
    A: z.string().optional(),
    B: z.string().optional(),
    C: z.string().optional(),
    D: z.string().optional(),
  }),
);
export type Opciones = Partial<Record<Letra, string>>;

/**
 * A date the server sent.
 *
 * Kept as the string it arrived as, parsed where it is used. The
 * dashboard sends "" for "never", which `new Date("")` turns into an
 * Invalid Date that then spreads silently — so emptiness is a value
 * here, not an error.
 */
export const fechaServidor = z.string();

/** "" means it never happened, which is not the same as unknown. */
export function comoFecha(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}
