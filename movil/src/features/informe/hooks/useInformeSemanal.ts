import { useQuery } from '@tanstack/react-query';
import type { Fallo } from '@/core/http/cliente';
import { leerInformeSemanal } from '../api/peticiones';
import type { InformeSemanal } from '../api/esquemas';

/**
 * The weekly report, read once a week.
 *
 * `staleTime` is an hour rather than the usual minutes: the server
 * writes one report per learner per week and reads it back after, so
 * refetching cannot produce a different answer. What it can do is
 * make the first request of the week — the one that calls the model
 * and takes seconds — happen twice.
 *
 * No `retry`. A failed report is not worth a second attempt on the
 * same screen: the server already answers null rather than erroring
 * when there is nothing to write, so a real failure here means the
 * model call failed, and repeating it costs money for the same
 * outcome.
 */
export function useInformeSemanal() {
  const consulta = useQuery({
    queryKey: ['informe-semanal'],
    queryFn: async () => {
      const r = await leerInformeSemanal();
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    staleTime: 60 * 60 * 1000,
    retry: false,
  });

  return {
    informe: (consulta.data ?? null) as InformeSemanal | null,
    cargando: consulta.isPending,
    fallo: (consulta.error as Fallo | null) ?? null,
  };
}
