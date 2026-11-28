import { z } from 'zod';
import { pedir } from '@/core/http/cliente';
import {
  inventarioBanco,
  marcaRegistrada,
  respuestaRegistrada,
  resumenSimulacro,
  simulacroCalificado,
  simulacroEnCurso,
  simulacroIniciado,
} from './esquemas';

/**
 * Every call the sitting makes. Thin by design: each one names a route
 * and the shape it promises, and nothing else. Loading, retries and
 * caching belong to the hooks; error handling belongs to the client.
 */

export function iniciarSimulacro(totalPreguntas: number) {
  return pedir({
    ruta: '/api/simulacro/start',
    metodo: 'POST',
    cuerpo: { totalPreguntas },
    esquema: simulacroIniciado,
  });
}

export function leerSimulacro(id: string) {
  return pedir({ ruta: `/api/simulacro/${id}`, esquema: simulacroEnCurso });
}

export function responderSimulacro(id: string, orden: number, respuesta: string) {
  return pedir({
    ruta: `/api/simulacro/${id}/answer`,
    metodo: 'POST',
    cuerpo: { orden, respuesta },
    esquema: respuestaRegistrada,
  });
}

export function marcarPregunta(id: string, orden: number, marcada: boolean) {
  return pedir({
    ruta: `/api/simulacro/${id}/marcar`,
    metodo: 'POST',
    cuerpo: { orden, marcada },
    esquema: marcaRegistrada,
  });
}

export function calificarSimulacro(id: string) {
  return pedir({
    ruta: `/api/simulacro/${id}/finish`,
    metodo: 'POST',
    cuerpo: {},
    esquema: simulacroCalificado,
  });
}

export function listarSimulacros() {
  return pedir({ ruta: '/api/simulacro', esquema: z.array(resumenSimulacro) });
}

export function leerInventarioBanco() {
  return pedir({ ruta: '/api/items/bank/stats', esquema: inventarioBanco });
}
