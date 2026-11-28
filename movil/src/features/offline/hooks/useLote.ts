import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { pedirLote } from '../api/peticiones';
import {
  cuantasPedir,
  disponibles,
  fusionar,
  haceFaltaRellenar,
  marcarUsadas,
  puedeCobrarPeaje,
  siguienteBloque,
  TAMANO_DESEADO,
  type EstadoDelLote,
} from '../model/lote';

/**
 * The questions this device is holding for the toll.
 *
 * Stored under `lote-offline`, which the persistence policy keeps on
 * disk for ninety days — questions do not go off, and re-downloading
 * them is the cost this feature exists to avoid.
 *
 * The query never refetches on its own. A pool is topped up
 * deliberately, when the app has a connection and notices it is
 * running low, not on a schedule that might fire on mobile data.
 */

const CLAVE = ['lote-offline'] as const;
const VACIO: EstadoDelLote = { preguntas: [], usadas: [] };

export function useLote() {
  const cliente = useQueryClient();

  const consulta = useQuery({
    queryKey: CLAVE,
    /* Reads whatever is cached. The fetch is `rellenar` below, called
       on purpose: a queryFn here would re-download the pool whenever
       react-query felt the data was stale, which on a prepaid line is
       the one behaviour to avoid. */
    queryFn: () => cliente.getQueryData<EstadoDelLote>(CLAVE) ?? VACIO,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const estado = consulta.data ?? VACIO;

  /** Fetch what is missing and merge it in. Safe to call when online. */
  const rellenar = useCallback(
    async (forzar = false) => {
      const actual = cliente.getQueryData<EstadoDelLote>(CLAVE) ?? VACIO;
      if (!forzar && !haceFaltaRellenar(actual)) return { ok: true as const };

      const cuantas = forzar ? TAMANO_DESEADO : cuantasPedir(actual);
      if (cuantas <= 0) return { ok: true as const };

      const r = await pedirLote({
        total: cuantas,
        /* Tell the server what we hold so it sends only what we lack.
           Including the used ids too: a question answered yesterday is
           one we do not want back. */
        excluir: [...actual.preguntas.map((p) => p.id), ...actual.usadas],
      });

      if (!r.ok) return { ok: false as const, fallo: r.fallo };

      cliente.setQueryData<EstadoDelLote>(CLAVE, fusionar(actual, r.datos));
      return { ok: true as const };
    },
    [cliente],
  );

  /** Hand out a block, and record that it was used. */
  const tomarBloque = useCallback(
    (cuantas?: number) => {
      const actual = cliente.getQueryData<EstadoDelLote>(CLAVE) ?? VACIO;
      const bloque = siguienteBloque(actual, cuantas);
      if (bloque.length > 0) {
        cliente.setQueryData<EstadoDelLote>(
          CLAVE,
          marcarUsadas(actual, bloque.map((p) => p.id)),
        );
      }
      return bloque;
    },
    [cliente],
  );

  return {
    /** How many questions are ready to use right now. */
    disponibles: disponibles(estado).length,
    /** Whether the toll can ask for anything at all. */
    listo: puedeCobrarPeaje(estado),
    necesitaRelleno: haceFaltaRellenar(estado),
    rellenar,
    tomarBloque,
  };
}
