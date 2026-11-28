import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Fallo } from '@/core/http/cliente';
import { generarRetroalimentacion, leerRetroalimentacion } from '../api/peticiones';
import type { Retroalimentacion } from '../api/esquemas';

/**
 * The plan for one session: read it if it exists, generate it if not.
 *
 * Reading first is what stops a second visit paying for the same text
 * twice — the server stores it, and a learner who closes the screen
 * and comes back should not be billed for rereading their own plan.
 */
export function useRetroalimentacion(sessionId: string | null) {
  const clienteConsultas = useQueryClient();
  const clave = ['feedback', sessionId ?? ''] as const;

  const consulta = useQuery({
    queryKey: clave,
    enabled: Boolean(sessionId),
    queryFn: async () => {
      const r = await leerRetroalimentacion(sessionId!);
      return r.ok ? r.datos : null;
    },
    staleTime: Infinity,
  });

  const generar = useMutation<Retroalimentacion, Fallo, void>({
    mutationFn: async () => {
      const r = await generarRetroalimentacion(sessionId!);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    onSuccess: (datos) => clienteConsultas.setQueryData(clave, datos),
  });

  return {
    plan: consulta.data ?? null,
    cargando: consulta.isPending && Boolean(sessionId),
    generar,
  };
}
