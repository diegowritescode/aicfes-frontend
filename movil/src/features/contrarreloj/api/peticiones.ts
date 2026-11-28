import { z } from 'zod';
import { pedir } from '@/core/http/cliente';
import { contrarrelojIniciado, modoContrarreloj } from './esquemas';

export function leerModos() {
  return pedir({ ruta: '/api/time-trial/modes', esquema: z.array(modoContrarreloj) });
}

/**
 * How a round is asked for.
 *
 * Either a stored mode or a one-off round aimed at a topic. The
 * second is what makes the weekly plan actionable: an action names
 * `{area, tema}`, and before this the drill could only be aimed at an
 * area — so «practicar ángulos» served mixed Matemáticas and the plan
 * was decoration.
 */
export type PedidoDeRonda =
  | { readonly modeId: string }
  | {
      readonly area: string;
      readonly tema: string;
      readonly preguntas: number;
      readonly segundos: number;
    };

export function iniciarContrarreloj(pedido: PedidoDeRonda) {
  const cuerpo =
    'modeId' in pedido
      ? { modeId: pedido.modeId }
      : {
          /* The server validates and caps all of this; sending it
             shaped as `custom` is what `TimeTrialStartSchema`
             expects. `dificultad` is required there, and «media» is
             the right default for practice aimed at a weakness: the
             point is to rebuild the topic, not to prove it is hard. */
          custom: {
            area: pedido.area,
            dificultad: 'media',
            tema: pedido.tema,
            questions: pedido.preguntas,
            timeLimitSeconds: pedido.segundos,
          },
        };

  return pedir({
    ruta: '/api/time-trial/start',
    metodo: 'POST',
    cuerpo,
    esquema: contrarrelojIniciado,
  });
}
