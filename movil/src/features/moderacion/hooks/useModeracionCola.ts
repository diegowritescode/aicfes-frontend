import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Fallo } from '@/core/http/cliente';
import { almacenModeracion } from '@/core/almacenamiento/moderacion';
import {
  leerCola,
  leerPendientes,
  resolverDenuncia,
  retirarDeBusqueda,
} from '../api/peticiones';
import { mensajeDe, urgenciaDe, type Urgencia } from '../model/urgencia';

/**
 * Whether this device holds a moderation token.
 *
 * Read once on mount. Everything moderation-related stays hidden
 * without one, so a learner who installs the app never sees that any
 * of this exists.
 */
export function useTokenDeModeracion() {
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    void almacenModeracion.leer().then((t) => {
      if (vivo) {
        setToken(t);
        setCargando(false);
      }
    });
    return () => {
      vivo = false;
    };
  }, []);

  const guardar = useCallback(async (nuevo: string) => {
    const ok = await almacenModeracion.guardar(nuevo);
    if (ok) setToken(nuevo.trim());
    return ok;
  }, []);

  const borrar = useCallback(async () => {
    await almacenModeracion.borrar();
    setToken(null);
  }, []);

  return { token, tiene: token !== null, cargando, guardar, borrar };
}

/**
 * How many reports are waiting.
 *
 * This is the whole notice. The app cannot push a notification —
 * reminders here are local, scheduled on the device — so nothing can
 * reach a moderator while the app is closed. What it can do is answer
 * the question the moment the app opens, which is what this does.
 *
 * Refetched on mount rather than cached long: the number's only value
 * is being current, and a stale "0 denuncias" is worse than no notice
 * at all.
 */
export function usePendientesDeModeracion(habilitado: boolean) {
  const consulta = useQuery({
    queryKey: ['moderacion', 'pendientes'],
    queryFn: async () => {
      const r = await leerPendientes();
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    enabled: habilitado,
    staleTime: 30_000,
    refetchOnMount: 'always',
  });

  const datos = consulta.data ?? null;
  const urgencia: Urgencia = datos ? urgenciaDe(datos) : 'nada';

  return {
    pendientes: datos,
    urgencia,
    mensaje: datos ? mensajeDe(datos) : null,
    cargando: consulta.isLoading,
    /* A failure here is silent on purpose: a moderator whose token was
       rotated should not get an error banner over a learner's home
       screen. The moderation screen says so plainly instead. */
    fallo: (consulta.error as Fallo | null) ?? null,
  };
}

/** The queue itself, and the two actions on it. */
export function useColaDeModeracion(habilitado: boolean) {
  const cliente = useQueryClient();

  const consulta = useQuery({
    queryKey: ['moderacion', 'cola'],
    queryFn: async () => {
      const r = await leerCola(20);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    enabled: habilitado,
    staleTime: 15_000,
  });

  /* Both the queue and the count change together: resolving one
     report removes it from the list and lowers the number. Patching
     one and not the other is how a screen ends up saying "3
     denuncias" over an empty list. */
  const refrescar = useCallback(() => {
    void cliente.invalidateQueries({ queryKey: ['moderacion'] });
  }, [cliente]);

  const resolver = useMutation({
    mutationFn: async (params: { id: string; estado: 'revisada' | 'descartada' }) => {
      const r = await resolverDenuncia(params);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    onSuccess: refrescar,
  });

  const retirar = useMutation({
    mutationFn: async (userId: string) => {
      const r = await retirarDeBusqueda(userId);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    onSuccess: refrescar,
  });

  return {
    denuncias: consulta.data ?? [],
    cargando: consulta.isLoading,
    recargando: consulta.isFetching && !consulta.isLoading,
    fallo: (consulta.error as Fallo | null) ?? null,
    refrescar,
    resolver: resolver.mutateAsync,
    resolviendo: resolver.isPending,
    retirar: retirar.mutateAsync,
    retirando: retirar.isPending,
    falloAlActuar: (resolver.error as Fallo | null) ?? (retirar.error as Fallo | null) ?? null,
  };
}
