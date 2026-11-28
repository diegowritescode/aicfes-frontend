import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { areaDeSesion } from '@/shared/pregunta/model/areaDeSesion';
import {
  completarSesionEstudio,
  guardarRespuestas,
  iniciarSesionEstudio,
} from '@/shared/pregunta/api/peticiones';
import {
  abandonados,
  COLA_VACIA,
  encolar,
  marcarFallo,
  pendientes,
  quitar,
  resumirBloque,
  siguiente,
  type BloquePendiente,
  type Cola,
} from '../model/cola';

/**
 * Sends work that was done without a connection.
 *
 * A toll block answered offline becomes three requests — start the
 * session, save the answers, complete it — which have to happen in
 * order and cannot happen at the time. So the block waits here.
 *
 * Replay is one block at a time, oldest first. Draining in parallel
 * would be faster and would also mean a half-failed batch leaves the
 * queue in a state nobody can reason about.
 */

const CLAVE = ['cola-offline'] as const;

export function useCola() {
  const cliente = useQueryClient();

  const consulta = useQuery({
    queryKey: CLAVE,
    queryFn: () => cliente.getQueryData<Cola>(CLAVE) ?? COLA_VACIA,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const cola = consulta.data ?? COLA_VACIA;

  const añadir = useCallback(
    (bloque: BloquePendiente) => {
      const actual = cliente.getQueryData<Cola>(CLAVE) ?? COLA_VACIA;
      cliente.setQueryData<Cola>(CLAVE, encolar(actual, bloque));
    },
    [cliente],
  );

  /**
   * Send one block, start to finish.
   *
   * Returns whether to keep going: a network failure stops the drain,
   * because the next block would fail the same way and each attempt
   * counts against a limit.
   */
  const enviarUno = useCallback(
    async (bloque: BloquePendiente): Promise<'enviado' | 'reintentar' | 'sin_red'> => {
      /* `MIXTO` is rejected by the server's schema, so the area is the
         one this block drew most from. A toll block spans areas and a
         session is one row; this is the closest true statement. */
      const inicio = await iniciarSesionEstudio({
        mode: 'peaje',
        area: areaDeSesion('MIXTO', bloque.respuestas),
      });
      if (!inicio.ok) {
        return inicio.fallo.codigo === 'sin_red' ? 'sin_red' : 'reintentar';
      }

      const sessionId = inicio.datos.sessionId;

      const guardado = await guardarRespuestas(
        bloque.respuestas.map((r) => ({
          sessionId,
          questionIndex: r.questionIndex,
          area: r.area,
          dificultad: r.dificultad,
          selectedAnswer: r.elegida,
          isCorrect: r.correcta,
          itemId: r.itemId,
          tiempoMs: r.tiempoMs,
        })),
      );
      if (!guardado.ok) {
        /* The session exists now with no answers in it. That is a
           small, visible inconsistency — a session of zero questions —
           and it is better than the alternative: retrying from the
           start would create a second session and count the block
           twice. The learner's XP being right matters more than the
           dashboard having no empty rows. */
        return guardado.fallo.codigo === 'sin_red' ? 'sin_red' : 'reintentar';
      }

      /* Completing is what awards the XP for time and closes the
         session. A block whose answers landed but whose completion
         failed still counted the answers, so this failure costs the
         time bonus, not the work. */
      await completarSesionEstudio(sessionId, resumirBloque(bloque));

      return 'enviado';
    },
    [],
  );

  /** Drain the queue. Safe to call whenever a connection appears. */
  const sincronizar = useCallback(async () => {
    let actual = cliente.getQueryData<Cola>(CLAVE) ?? COLA_VACIA;
    let enviados = 0;

    /* Bounded by the queue's own size rather than `while (true)`: a
       bug that failed to remove a block would otherwise spin. */
    for (let i = 0; i < actual.bloques.length + 1; i += 1) {
      const bloque = siguiente(actual);
      if (!bloque) break;

      const resultado = await enviarUno(bloque);

      if (resultado === 'enviado') {
        actual = quitar(actual, bloque.id);
        enviados += 1;
      } else if (resultado === 'reintentar') {
        actual = marcarFallo(actual, bloque.id);
      } else {
        /* No network. Stop without counting a failure: the block is
           fine, the radio is not, and spending an attempt on that
           would eventually discard work for being offline — which is
           the condition this queue exists for. */
        break;
      }

      cliente.setQueryData<Cola>(CLAVE, actual);
    }

    cliente.setQueryData<Cola>(CLAVE, actual);

    if (enviados > 0) {
      /* The dashboard changed: new XP, maybe a streak. Invalidate
         rather than refetch, so a screen nobody is looking at does not
         cost a request. */
      await cliente.invalidateQueries({ queryKey: ['panel'] });
      await cliente.invalidateQueries({ queryKey: ['logros'] });
    }

    return { enviados };
  }, [cliente, enviarUno]);

  return {
    pendientes: pendientes(cola),
    perdidos: abandonados(cola).length,
    añadir,
    sincronizar,
  };
}
