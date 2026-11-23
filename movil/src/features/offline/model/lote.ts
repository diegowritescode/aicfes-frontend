import type { PreguntaDelLote } from '../api/esquemas';

/**
 * When the pool needs topping up, and which questions a block uses.
 *
 * Pure, because the decisions are the part worth testing. The one that
 * matters most is the refill threshold: topping up too late means the
 * toll runs out of questions on a phone with no data, which is the
 * exact moment the feature exists for.
 */

/** Questions used by one block of the toll. */
export const POR_BLOQUE = 5;

/* Refill while there is still more than a block left. Waiting until
   the pool is empty guarantees the learner meets an empty pool, since
   the refill needs the network the toll does not have. */
const UMBRAL_RELLENO = POR_BLOQUE * 2;

/** The size to keep on the device. Several blocks, not a download. */
export const TAMANO_DESEADO = 20;

export interface EstadoDelLote {
  readonly preguntas: readonly PreguntaDelLote[];
  /** Ids already used, so a block does not repeat a question. */
  readonly usadas: readonly string[];
}

/** Questions still available to serve. */
export function disponibles(estado: EstadoDelLote): PreguntaDelLote[] {
  const usadas = new Set(estado.usadas);
  return estado.preguntas.filter((p) => !usadas.has(p.id));
}

export function haceFaltaRellenar(estado: EstadoDelLote): boolean {
  return disponibles(estado).length <= UMBRAL_RELLENO;
}

/** How many to ask for, so the pool reaches its target size. */
export function cuantasPedir(estado: EstadoDelLote): number {
  return Math.max(0, TAMANO_DESEADO - disponibles(estado).length);
}

/**
 * The questions for one block.
 *
 * Returns fewer than a block rather than nothing when the pool is
 * short: four questions still clear a block, where refusing would
 * leave the learner behind a wall they cannot pass without data.
 */
export function siguienteBloque(
  estado: EstadoDelLote,
  cuantas = POR_BLOQUE,
): PreguntaDelLote[] {
  return disponibles(estado).slice(0, cuantas);
}

/** Whether the toll can run at all right now. */
export function puedeCobrarPeaje(estado: EstadoDelLote): boolean {
  return disponibles(estado).length > 0;
}

/**
 * Merge a freshly fetched batch into the pool.
 *
 * Used questions are dropped as they leave: keeping them would grow
 * the stored pool without bound on a device we are trying not to fill.
 * Incoming duplicates are ignored — the server excludes what we told
 * it we had, but a request that crossed with another could still
 * overlap.
 */
export function fusionar(
  estado: EstadoDelLote,
  llegadas: readonly PreguntaDelLote[],
): EstadoDelLote {
  const usadas = new Set(estado.usadas);
  const vigentes = estado.preguntas.filter((p) => !usadas.has(p.id));
  const conocidas = new Set(vigentes.map((p) => p.id));

  const nuevas = llegadas.filter((p) => !conocidas.has(p.id) && !usadas.has(p.id));

  return {
    preguntas: [...vigentes, ...nuevas],
    /* The used list is reset, because the questions it referred to are
       gone from the pool. Carrying it forever would mean the device
       stores a growing list of ids for questions it no longer has. */
    usadas: [],
  };
}

/** Record that a block's questions were used. */
export function marcarUsadas(
  estado: EstadoDelLote,
  ids: readonly string[],
): EstadoDelLote {
  return { ...estado, usadas: [...new Set([...estado.usadas, ...ids])] };
}
