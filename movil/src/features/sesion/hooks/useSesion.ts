import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { almacenSesion, type Sesion } from '@/core/almacenamiento/sesion';
import type { Fallo } from '@/core/http/cliente';
import { entrar, registrar } from '../api/peticiones';

/**
 * Who is signed in, and how that changes.
 *
 * The session is a query rather than a context value holding state.
 * That sounds like a technicality and is not: reading it from the
 * keystore is asynchronous, so a context would have to model "still
 * looking" by hand on every screen that asks. As a query, that state
 * already exists and every consumer gets the same answer from one
 * cache.
 *
 * Signing in and out invalidate the same key, so nothing has to be
 * pushed anywhere: every screen that reads the session re-reads it.
 */

const CLAVE: readonly string[] = ['sesion'];

export function useSesion() {
  const consulta = useQuery({
    queryKey: CLAVE,
    queryFn: () => almacenSesion.leer(),
    /* The keystore is local, so this never goes stale on its own:
       only our own writes change it, and those invalidate explicitly. */
    staleTime: Infinity,
  });

  return {
    sesion: consulta.data ?? null,
    cargando: consulta.isPending,
    autenticado: Boolean(consulta.data?.token),
  };
}

/** The sign-in and sign-up mutations, and signing out. */
export function useAccionesSesion() {
  const clienteConsultas = useQueryClient();

  const guardar = useCallback(
    async (sesion: Sesion) => {
      await almacenSesion.guardar(sesion);
      await clienteConsultas.invalidateQueries({ queryKey: CLAVE });
    },
    [clienteConsultas],
  );

  const mutacionEntrar = useMutation<Sesion, Fallo, { email: string; password: string }>({
    mutationFn: async ({ email, password }) => {
      const r = await entrar(email, password);
      /* The client returns failures as values; react-query needs a
         throw to mark the mutation failed, so this is the one place
         that converts between the two. */
      if (!r.ok) throw r.fallo;
      return { token: r.datos.token, userId: r.datos.userId, email: r.datos.email };
    },
    onSuccess: guardar,
  });

  const mutacionRegistrar = useMutation<
    Sesion,
    Fallo,
    { email: string; password: string; nombre?: string }
  >({
    mutationFn: async (params) => {
      const r = await registrar(params);
      if (!r.ok) throw r.fallo;
      return {
        token: r.datos.token,
        userId: r.datos.userId,
        email: r.datos.email,
        nombre: params.nombre,
      };
    },
    onSuccess: guardar,
  });

  const salir = useCallback(async () => {
    await almacenSesion.borrar();
    /* Everything cached belonged to the person leaving. Clearing it
       is what stops the next person on a shared phone seeing their
       dashboard. */
    clienteConsultas.clear();
    await clienteConsultas.invalidateQueries({ queryKey: CLAVE });
  }, [clienteConsultas]);

  return { entrar: mutacionEntrar, registrar: mutacionRegistrar, salir };
}
