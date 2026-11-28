import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Fallo } from '@/core/http/cliente';
import type { Area } from '@/shared/model/icfes';
import { leerRepaso } from '../api/peticiones';

/**
 * The learner's outstanding mistakes.
 *
 * The area filter is part of the query key, so switching areas is a
 * separate cached result rather than a refetch that discards the one
 * they just looked at.
 */
export function useRepaso() {
  const cliente = useQueryClient();
  const [area, setArea] = useState<Area | null>(null);

  const consulta = useQuery({
    queryKey: ['repaso', area],
    queryFn: async () => {
      const r = await leerRepaso({ area: area ?? undefined });
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    staleTime: 60_000,
  });

  /* After answering one, the list is wrong until the server recounts.
     Invalidating every area, not just the one on screen: a question
     cleared in Matemáticas changes the total too. */
  const recargar = useCallback(() => {
    void cliente.invalidateQueries({ queryKey: ['repaso'] });
  }, [cliente]);

  return {
    datos: consulta.data ?? null,
    cargando: consulta.isPending,
    fallo: (consulta.error as Fallo | null) ?? null,
    area,
    setArea,
    recargar,
  };
}
