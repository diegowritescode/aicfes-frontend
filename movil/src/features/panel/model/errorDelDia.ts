import type { EstadoOpcion } from '@/shared/pregunta/components/OpcionRespuesta';
import type { Letra } from '@/shared/model/icfes';

/**
 * What the card shows after an attempt.
 *
 * Pure, and in `model/` rather than inside the component, because
 * "which option turns red" is a rule and rules get tested. A function
 * hidden in a component can only be checked by rendering one.
 */

/** How each option should look, given what was picked. */
export function estadoDeOpcion({
  letra,
  elegida,
  correcta,
}: {
  letra: string;
  /** Null until they commit to one. */
  elegida: string | null;
  correcta: string;
}): EstadoOpcion {
  if (elegida === null) return 'pendiente';
  if (letra === correcta) return 'correcta';
  if (letra === elegida) return 'fallada';
  return 'descartada';
}

/**
 * Which explanation to show.
 *
 * The one they picked, because after a wrong answer the useful
 * sentence is why THAT option was tempting — not a lecture on all
 * four. Falls back to the correct one when the picked option has no
 * explanation stored, and to nothing when neither does.
 */
export function explicacionAMostrar({
  elegida,
  correcta,
  explicaciones,
}: {
  elegida: string | null;
  correcta: string;
  explicaciones?: Record<string, string> | null;
}): string | null {
  if (elegida === null || !explicaciones) return null;
  return explicaciones[elegida] ?? explicaciones[correcta] ?? null;
}

/** Only the letters this item actually offers, in order. */
export function letrasDisponibles(opciones: Record<string, string>): Letra[] {
  const todas: Letra[] = ['A', 'B', 'C', 'D'];
  return todas.filter((l) => {
    const texto = opciones[l];
    return typeof texto === 'string' && texto.length > 0;
  });
}

/**
 * Whether this card can actually be answered on the dashboard.
 *
 * A server that predates the options and the right answer still
 * sends a question. Rendering it with four blank buttons would be
 * worse than waiting, so the card asks this first — and the type
 * guard is what lets the component demand the fields instead of
 * checking them again.
 */
export function esRespondible(
  pregunta: {
    opciones?: Record<string, string>;
    respuesta_correcta?: string;
  } | null,
): pregunta is { opciones: Record<string, string>; respuesta_correcta: string } {
  if (!pregunta?.opciones || !pregunta.respuesta_correcta) return false;
  /* And the right answer has to be among the options offered, or the
     card would mark every attempt wrong. */
  return Boolean(pregunta.opciones[pregunta.respuesta_correcta]);
}
