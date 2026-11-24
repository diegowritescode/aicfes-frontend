/**
 * How urgent the moderation queue is right now.
 *
 * The queue became readable before anything said when to read it, and
 * a queue that is readable and unread is only one step better than
 * unreadable. This turns the two numbers the server returns into one
 * answer: can this wait, or not.
 *
 * Pure because the thresholds are a product decision about how long a
 * learner who reported harassment should wait, not a detail.
 */

export type Urgencia = 'nada' | 'por_revisar' | 'atrasada' | 'muy_atrasada';

/**
 * A report waiting more than this many days has failed whoever sent
 * it.
 *
 * One day, not three. Someone reported being harassed and was told a
 * person would look at it; a day is already a long time to be told
 * that and see nothing happen. Note the block is immediate and does
 * not wait for this — reporting blocks on the server — so this is
 * about the promise of review, not about the harassment continuing.
 */
export const DIAS_PARA_ATRASADA = 1;

/** Past this, the queue is not being attended at all. */
export const DIAS_PARA_MUY_ATRASADA = 3;

export function urgenciaDe(pendientes: {
  readonly abiertas: number;
  readonly diasDeLaMasAntigua: number | null;
}): Urgencia {
  if (pendientes.abiertas === 0) return 'nada';

  const dias = pendientes.diasDeLaMasAntigua ?? 0;
  if (dias >= DIAS_PARA_MUY_ATRASADA) return 'muy_atrasada';
  if (dias >= DIAS_PARA_ATRASADA) return 'atrasada';
  return 'por_revisar';
}

/**
 * What to say about it, in the words of someone who has to act.
 *
 * Numbers rather than adjectives: "3 denuncias, la más vieja de hace
 * 2 días" tells the moderator what to do. "Atención requerida" does
 * not.
 */
export function mensajeDe(pendientes: {
  readonly abiertas: number;
  readonly diasDeLaMasAntigua: number | null;
}): string | null {
  if (pendientes.abiertas === 0) return null;

  const cuantas =
    pendientes.abiertas === 1 ? '1 denuncia sin revisar' : `${pendientes.abiertas} denuncias sin revisar`;

  const dias = pendientes.diasDeLaMasAntigua;
  if (dias === null || dias === 0) return `${cuantas}, de hoy`;
  if (dias === 1) return `${cuantas}, la más vieja de ayer`;
  return `${cuantas}, la más vieja de hace ${dias} días`;
}

/** Whether this deserves interrupting whatever the person opened the app for. */
export function mereceAviso(urgencia: Urgencia): boolean {
  return urgencia !== 'nada';
}
