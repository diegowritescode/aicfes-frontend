import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Fallo } from '@/core/http/cliente';
import {
  aceptarDuelo,
  bloquearJugador,
  buscarJugadores,
  cambiarBuscable,
  declararAutorizacionDeTutor,
  denunciarJugador,
  desbloquearJugador,
  leerAmigos,
  leerPerfilDeAmigo,
  ponerDescripcion,
  leerBloqueados,
  leerMisDuelos,
  leerPerfilDeDuelos,
  pedirAmistad,
  ponerAlias,
  quitarAmigo,
  rechazarDuelo,
  responderAmistad,
  retar,
} from '../api/peticiones';
import type { MotivoDenuncia } from '../api/esquemas';

/** This learner's alias and whether they can be found. */
export function usePerfilDeDuelos() {
  const cliente = useQueryClient();

  const consulta = useQuery({
    queryKey: ['duelos', 'perfil'],
    queryFn: async () => {
      const r = await leerPerfilDeDuelos();
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    staleTime: 60_000,
  });

  /* Written straight into the cache rather than invalidated. Every one
     of these calls returns the whole profile, so a refetch would ask
     the server for what it just sent — and the alias screen would
     flicker back to the old value while it waited. */
  const guardarPerfil = useCallback(
    (perfil: unknown) => cliente.setQueryData(['duelos', 'perfil'], perfil),
    [cliente],
  );

  const alias = useMutation({
    mutationFn: async (nuevo: string) => {
      const r = await ponerAlias(nuevo);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    onSuccess: guardarPerfil,
  });

  const buscable = useMutation({
    mutationFn: async (valor: boolean) => {
      const r = await cambiarBuscable(valor);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    onSuccess: guardarPerfil,
  });

  const autorizacion = useMutation({
    mutationFn: async () => {
      const r = await declararAutorizacionDeTutor();
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    onSuccess: guardarPerfil,
  });

  return {
    perfil: consulta.data ?? null,
    cargando: consulta.isLoading,
    fallo: (consulta.error as Fallo | null) ?? null,
    ponerAlias: alias.mutateAsync,
    guardandoAlias: alias.isPending,
    falloDeAlias: (alias.error as Fallo | null) ?? null,
    cambiarBuscable: buscable.mutateAsync,
    declararAutorizacion: autorizacion.mutateAsync,
    guardandoAutorizacion: autorizacion.isPending,
  };
}

/**
 * Searching for someone by alias.
 *
 * Not debounced here: the screen decides when to search, and a query
 * per keystroke over a list of minors is exactly the traffic this
 * feature should not generate. Two characters is the server's own
 * minimum, below which it returns an empty list rather than an error.
 */
export function useBuscarJugadores() {
  const [termino, setTermino] = useState('');

  const consulta = useQuery({
    queryKey: ['duelos', 'buscar', termino],
    queryFn: async () => {
      const r = await buscarJugadores(termino);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    enabled: termino.trim().length >= 2,
    staleTime: 30_000,
  });

  return {
    termino,
    setTermino,
    resultados: consulta.data ?? [],
    buscando: consulta.isFetching,
    fallo: (consulta.error as Fallo | null) ?? null,
  };
}

/** This learner's duels, and the actions on them. */
export function useMisDuelos() {
  const cliente = useQueryClient();

  const consulta = useQuery({
    queryKey: ['duelos', 'mios'],
    queryFn: async () => {
      const r = await leerMisDuelos();
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    staleTime: 30_000,
  });

  /* Invalidated rather than patched: accepting changes `estado`, and
     challenging adds a row the client cannot construct — the server
     picks the questions and the expiry. */
  const recargar = useCallback(() => {
    void cliente.invalidateQueries({ queryKey: ['duelos', 'mios'] });
  }, [cliente]);

  const nuevoReto = useMutation({
    mutationFn: async (rivalId: string) => {
      const r = await retar(rivalId);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    onSuccess: recargar,
  });

  const aceptar = useMutation({
    mutationFn: async (id: string) => {
      const r = await aceptarDuelo(id);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    onSuccess: recargar,
  });

  const rechazar = useMutation({
    mutationFn: async (id: string) => {
      const r = await rechazarDuelo(id);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    onSuccess: recargar,
  });

  const duelos = consulta.data ?? [];

  return {
    duelos,
    /* Split here rather than in the screen: "someone is waiting for
       you" and "you are waiting for someone" are different things to
       a learner, and only the first is something to act on. */
    porAceptar: duelos.filter((d) => d.estado === 'pendiente' && !d.yoRete),
    enviados: duelos.filter((d) => d.estado === 'pendiente' && d.yoRete),
    enCurso: duelos.filter((d) => d.estado === 'en_curso'),
    terminados: duelos.filter((d) => d.estado === 'terminado'),
    cargando: consulta.isLoading,
    recargando: consulta.isFetching && !consulta.isLoading,
    fallo: (consulta.error as Fallo | null) ?? null,
    recargar,
    retar: nuevoReto.mutateAsync,
    retando: nuevoReto.isPending,
    falloAlRetar: (nuevoReto.error as Fallo | null) ?? null,
    aceptar: aceptar.mutateAsync,
    rechazar: rechazar.mutateAsync,
    respondiendo: aceptar.isPending || rechazar.isPending,
  };
}

/**
 * Blocking and reporting.
 *
 * In the same hook because they are the same decision from a learner's
 * side: both mean "I do not want contact with this person". Reporting
 * also blocks on the server, so the screens must refresh the same
 * things.
 */
export function useModeracion() {
  const cliente = useQueryClient();

  const consulta = useQuery({
    queryKey: ['duelos', 'bloqueados'],
    queryFn: async () => {
      const r = await leerBloqueados();
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    staleTime: 60_000,
  });

  /* Blocking changes three things at once: who appears in a search,
     who is on the blocked list, and which duels are still open —
     blocking cancels them. Invalidating the whole `duelos` tree is the
     honest answer; patching three caches by hand is how one of them
     ends up stale and showing a blocked learner's name. */
  const refrescarTodo = useCallback(() => {
    void cliente.invalidateQueries({ queryKey: ['duelos'] });
  }, [cliente]);

  const bloquear = useMutation({
    mutationFn: async (id: string) => {
      const r = await bloquearJugador(id);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    onSuccess: refrescarTodo,
  });

  const desbloquear = useMutation({
    mutationFn: async (id: string) => {
      const r = await desbloquearJugador(id);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    onSuccess: refrescarTodo,
  });

  const denunciar = useMutation({
    mutationFn: async (params: {
      denunciadoId: string;
      motivo: MotivoDenuncia;
      detalle?: string;
    }) => {
      const r = await denunciarJugador(params);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    onSuccess: refrescarTodo,
  });

  return {
    bloqueados: consulta.data ?? [],
    cargando: consulta.isLoading,
    fallo: (consulta.error as Fallo | null) ?? null,
    bloquear: bloquear.mutateAsync,
    desbloquear: desbloquear.mutateAsync,
    bloqueando: bloquear.isPending || desbloquear.isPending,
    denunciar: denunciar.mutateAsync,
    denunciando: denunciar.isPending,
  };
}

/**
 * The people this learner duels often.
 *
 * Exists because the search box is the wrong tool for the common
 * case: you compete with the same three classmates, and typing their
 * alias every time is friction with no purpose.
 */
export function useAmigos() {
  const cliente = useQueryClient();

  const consulta = useQuery({
    queryKey: ['duelos', 'amigos'],
    queryFn: async () => {
      const r = await leerAmigos();
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    staleTime: 60_000,
  });

  /* The whole `duelos` tree, not just the friends list: accepting a
     request changes who shows in a search, and blocking from
     elsewhere changes who shows here. */
  const refrescar = useCallback(() => {
    void cliente.invalidateQueries({ queryKey: ['duelos'] });
  }, [cliente]);

  const pedir = useMutation({
    mutationFn: async (usuarioId: string) => {
      const r = await pedirAmistad(usuarioId);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    onSuccess: refrescar,
  });

  const responder = useMutation({
    mutationFn: async (params: { id: string; acepta: boolean }) => {
      const r = await responderAmistad(params);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    onSuccess: refrescar,
  });

  const quitar = useMutation({
    mutationFn: async (usuarioId: string) => {
      const r = await quitarAmigo(usuarioId);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    onSuccess: refrescar,
  });

  const datos = consulta.data ?? null;

  return {
    amigos: datos?.amigos ?? [],
    porResponder: datos?.porResponder ?? [],
    enviadas: datos?.enviadas ?? [],
    cargando: consulta.isLoading,
    fallo: (consulta.error as Fallo | null) ?? null,
    pedir: pedir.mutateAsync,
    pidiendo: pedir.isPending,
    falloAlPedir: (pedir.error as Fallo | null) ?? null,
    responder: responder.mutateAsync,
    respondiendo: responder.isPending,
    quitar: quitar.mutateAsync,
    quitando: quitar.isPending,
  };
}

/**
 * Another learner's profile, opened from the friend list.
 *
 * Enabled only with an id, so the hook can sit in a screen that
 * renders before one is chosen without firing a request for
 * `undefined`.
 */
export function usePerfilDeAmigo(usuarioId: string | null) {
  const consulta = useQuery({
    queryKey: ['duelos', 'perfil-amigo', usuarioId],
    queryFn: async () => {
      const r = await leerPerfilDeAmigo(usuarioId!);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    enabled: Boolean(usuarioId),
    /* Short: the streak changes when they duel, and seeing a stale
       «3 semanas» right after finishing the fourth is the one moment
       this screen is being looked at. */
    staleTime: 30_000,
  });

  return {
    perfil: consulta.data ?? null,
    cargando: consulta.isLoading,
    fallo: (consulta.error as Fallo | null) ?? null,
  };
}

/** Writing the learner's own one-line description. */
export function useDescripcion() {
  const cliente = useQueryClient();

  const guardar = useMutation({
    mutationFn: async (texto: string) => {
      const r = await ponerDescripcion(texto);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    /* The profile query holds the description, and the friend list
       shows it to the other side. */
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ['duelos'] });
    },
  });

  return { guardar };
}
