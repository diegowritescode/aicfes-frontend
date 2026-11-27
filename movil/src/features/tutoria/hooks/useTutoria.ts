import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Fallo } from '@/core/http/cliente';
import { abrirTutoria, enviarDefensa, enviarMensaje } from '../api/peticiones';
import type { EstadoTutoria } from '../api/esquemas';

/**
 * The conversation about one question, kept per learner and item.
 *
 * Failing the same question twice reopens the same thread rather than
 * starting over, so the tutor answers knowing what was already tried.
 * That is a server guarantee — `@@unique([userId, itemId])` — and the
 * client's job is only not to fight it: the query key is the item, so
 * reopening reads the same cache entry.
 */

const CLAVE = (itemId: string) => ['tutoria', itemId] as const;

export function useTutoria(itemId: string | null, opcionElegida: string | null) {
  const clienteConsultas = useQueryClient();
  const activa = Boolean(itemId && opcionElegida);

  const consulta = useQuery({
    queryKey: CLAVE(itemId ?? ''),
    enabled: activa,
    queryFn: async () => {
      const r = await abrirTutoria(itemId!, opcionElegida!);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    staleTime: Infinity,
  });

  /* Each send replaces the thread with the server's version rather
     than appending locally: the server decides how many turns are
     left, and a client that counted for itself would drift. */
  const guardar = (estado: EstadoTutoria) => {
    clienteConsultas.setQueryData(CLAVE(itemId ?? ''), estado);
  };

  /* The learner's own message appears the moment they send it.

     The tutor is a language model and takes seconds to answer, and
     until the reply landed the thread showed no trace of what had
     just been sent — the input emptied and nothing replaced it, which
     read as the panel being slow rather than busy.

     Only the message is added, never `turnosRestantes` or
     `esperaDefensa`: those are the server's count, and a client that
     decremented them itself would drift from it. The real reply
     replaces this whole object on success, so the echo never has to
     be reconciled — and on failure `onError` puts the thread back as
     it was, because a message that did not send must not stay on
     screen looking like it did. */
  const eco = (texto: string): EstadoTutoria | undefined => {
    const previo = clienteConsultas.getQueryData<EstadoTutoria>(CLAVE(itemId ?? ''));
    if (!previo) return undefined;
    clienteConsultas.setQueryData(CLAVE(itemId ?? ''), {
      ...previo,
      mensajes: [...previo.mensajes, { autor: 'estudiante' as const, contenido: texto }],
    });
    return previo;
  };

  const deshacerEco = (_fallo: Fallo, _texto: string, previo: EstadoTutoria | undefined) => {
    if (previo) clienteConsultas.setQueryData(CLAVE(itemId ?? ''), previo);
  };

  const defender = useMutation<EstadoTutoria, Fallo, string, EstadoTutoria | undefined>({
    mutationFn: async (texto) => {
      const r = await enviarDefensa(itemId!, texto);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    onMutate: eco,
    onError: deshacerEco,
    onSuccess: guardar,
  });

  const responder = useMutation<EstadoTutoria, Fallo, string, EstadoTutoria | undefined>({
    mutationFn: async (texto) => {
      const r = await enviarMensaje(itemId!, texto);
      if (!r.ok) throw r.fallo;
      return r.datos;
    },
    onMutate: eco,
    onError: deshacerEco,
    onSuccess: guardar,
  });

  // Leaving the panel cancels nothing: the thread is on the server,
  // and an in-flight message still lands.
  useEffect(() => () => undefined, []);

  const estado = consulta.data ?? null;

  return {
    estado,
    cargando: consulta.isPending && activa,
    fallo: (consulta.error as Fallo | null) ?? null,
    esperaDefensa: estado?.esperaDefensa ?? true,
    sinTurnos: (estado?.turnosRestantes ?? 1) <= 0,
    enviando: defender.isPending || responder.isPending,
    falloEnvio:
      (defender.error as Fallo | null) ?? (responder.error as Fallo | null) ?? null,
    /** One entry point: the panel does not need to know which it is. */
    enviar: (texto: string) =>
      estado?.esperaDefensa ? defender.mutate(texto) : responder.mutate(texto),
  };
}
