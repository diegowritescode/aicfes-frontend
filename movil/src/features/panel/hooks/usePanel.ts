import { useQuery } from '@tanstack/react-query';
import type { Fallo } from '@/core/http/cliente';
import { leerErrorDelDia, leerPanel } from '../api/peticiones';

/**
 * The dashboard.
 *
 * Two queries rather than one, because the error of the day is the
 * least important thing on the screen and must not be able to take
 * the rest of it down. Its failure renders nothing at all; the panel's
 * failure is worth saying out loud.
 */

export function usePanel() {
  const consulta = useQuery({
    queryKey: ['panel'],
    queryFn: async () => {
      const r = await leerPanel();
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    /* A minute is long enough that opening and closing the app does
       not refetch, and short enough that finishing a session and
       coming back shows the new XP. */
    staleTime: 60_000,
  });

  return {
    panel: consulta.data ?? null,
    cargando: consulta.isPending,
    fallo: (consulta.error as Fallo | null) ?? null,
    recargar: consulta.refetch,
  };
}

export function useErrorDelDia() {
  const consulta = useQuery({
    queryKey: ['error-del-dia'],
    queryFn: async () => {
      const r = await leerErrorDelDia();
      // Null is a real answer here: no honest question to show.
      return r.ok ? r.datos : null;
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

  return { pregunta: consulta.data ?? null, cargando: consulta.isPending };
}
