import { z } from 'zod';
import { pedir } from '@/core/http/cliente';
import { contrarrelojIniciado, modoContrarreloj } from './esquemas';

export function leerModos() {
  return pedir({ ruta: '/api/time-trial/modes', esquema: z.array(modoContrarreloj) });
}

export function iniciarContrarreloj(modeId: string) {
  return pedir({
    ruta: '/api/time-trial/start',
    metodo: 'POST',
    cuerpo: { modeId },
    esquema: contrarrelojIniciado,
  });
}
