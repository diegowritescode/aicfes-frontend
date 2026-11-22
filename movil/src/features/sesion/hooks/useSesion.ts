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

      /* Write it into the cache directly rather than only invalidating.
         An invalidation schedules a refetch; the navigation that
         follows does not wait for it, so the next screen could read
         the session before the refetch landed and bounce the learner
         back to the form. Setting it first means the value is there
         the moment anyone looks. */
      clienteConsultas.setQueryData(CLAVE, sesion);
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
      const sesion = { token: r.datos.token, userId: r.datos.userId, email: r.datos.email };

      /* Saving happens here, not in `onSuccess`, because a sign-in
         whose session was not stored has not succeeded. In
         `onSuccess` a failed write left the mutation reporting
         success: the screen navigated, the next screen read an empty
         store and redirected straight back, and the learner saw
         their typing vanish with no error anywhere. */
      await guardar(sesion);
      return sesion;
    },
  });

  const mutacionRegistrar = useMutation<
    Sesion,
    Fallo,
    { email: string; password: string; nombre?: string }
  >({
    mutationFn: async (params) => {
      const r = await registrar(params);
      if (!r.ok) throw r.fallo;
      const sesion = {
        token: r.datos.token,
        userId: r.datos.userId,
        email: r.datos.email,
        nombre: params.nombre,
      };
      await guardar(sesion);
      return sesion;
    },
  });

  const salir = useCallback(async () => {
    await almacenSesion.borrar();

    /* Order matters here, and getting it wrong is what made the
       sign-out button look dead.
     *
     * `clear()` discards the cache AND the observers watching it, so
     * an `invalidateQueries` afterwards has nobody left to notify:
     * the screen that read the session never re-rendered, its
     * `<Redirect>` never re-evaluated, and the learner stayed on a
     * dashboard they had just signed out of — until they touched
     * another route, which mounted fresh and bounced them to sign-in.
     *
     * So: set the session to null first, which every observer sees
     * immediately, and only then drop the data that belonged to the
     * person leaving. */
    clienteConsultas.setQueryData(CLAVE, null);

    /* Remove the rest by predicate instead of `clear()`. It keeps the
       session entry — and its observers — while discarding every
       other cached response, which is what stops the next person on a
       shared phone from seeing the previous one's dashboard. */
    clienteConsultas.removeQueries({
      predicate: (consulta) => consulta.queryKey[0] !== CLAVE[0],
    });
  }, [clienteConsultas]);

  return { entrar: mutacionEntrar, registrar: mutacionRegistrar, salir };
}
