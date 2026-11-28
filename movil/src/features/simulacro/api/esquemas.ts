import { z } from 'zod';
import { area, letra } from '@/shared/model/icfes';

/**
 * The shapes the sitting endpoints send, read from the running server.
 *
 * One absence matters more than anything present: **no field here
 * carries the correct answer**. The server deliberately selects around
 * `respuesta_correcta`, `justificacion` and `explicaciones` while a
 * sitting is open, because the payload reaches a device where anything
 * sent can be read. Adding them to this schema would not reveal them —
 * but it would advertise that someone expected them, and the next
 * person would wire a server field to match.
 */

export const estadoSimulacro = z.enum(['en_curso', 'terminado', 'abandonado']);

/** A question as the learner may see it. Their own answer, never the right one. */
export const preguntaSimulacro = z.object({
  orden: z.number().int().min(0),
  area,
  itemId: z.string(),
  contexto: z.string(),
  pregunta: z.string(),
  opciones: z.record(z.string(), z.string()),
  tieneFigura: z.boolean(),
  /** What they picked, or null. It can change until the sitting ends. */
  respuesta: letra.nullable(),
  marcada: z.boolean(),
});

export const puntajeArea = z.object({
  area: z.string(),
  correctas: z.number(),
  total: z.number(),
  porcentaje: z.number(),
});

export const resultadosSimulacro = z.object({
  correctas: z.number(),
  total: z.number(),
  porcentaje: z.number(),
  areas: z.array(puntajeArea),
  /** Areas under 70%, weakest first. That ordering is the study plan. */
  recomendacion: z.array(z.string()),
});

export const simulacroEnCurso = z.object({
  id: z.string(),
  status: estadoSimulacro,
  totalPreguntas: z.number(),
  minutos: z.number(),
  startedAt: z.string(),
  /** From the server's clock. The device never counts this itself. */
  segundosRestantes: z.number(),
  resultados: resultadosSimulacro.nullable(),
  preguntas: z.array(preguntaSimulacro),
  /** True when the clock ran out, whoever's request noticed first. */
  expirado: z.boolean(),
});

/** `start` answers with the sitting only; the questions come from a read. */
export const simulacroIniciado = z.object({
  id: z.string(),
  totalPreguntas: z.number(),
  minutos: z.number(),
  startedAt: z.string(),
  status: estadoSimulacro,
});

/* Answering says it was recorded and nothing else. Whether it was
   right does not come back until the sitting is graded — three months,
   in the real exam. */
export const respuestaRegistrada = z.object({
  orden: z.number(),
  registrada: z.boolean(),
});

export const marcaRegistrada = z.object({
  orden: z.number(),
  marcada: z.boolean(),
});

export const simulacroCalificado = z.object({
  id: z.string(),
  status: estadoSimulacro,
  startedAt: z.string(),
  finishedAt: z.string().nullable().optional(),
  totalPreguntas: z.number(),
  resultados: resultadosSimulacro.nullable(),
});

export const resumenSimulacro = z.object({
  id: z.string(),
  status: estadoSimulacro,
  startedAt: z.string(),
  totalPreguntas: z.number(),
  resultados: resultadosSimulacro.nullable().optional(),
});

export const inventarioBanco = z.object({
  porArea: z.array(
    z.object({ area: z.string(), verificados: z.number(), paraExamenCompleto: z.number() }),
  ),
  total: z.number(),
  /** The largest sitting the bank can fill right now. */
  simulacroMaximo: z.number(),
});

export type PreguntaSimulacro = z.infer<typeof preguntaSimulacro>;
export type SimulacroEnCurso = z.infer<typeof simulacroEnCurso>;
export type ResultadosSimulacro = z.infer<typeof resultadosSimulacro>;
export type ResumenSimulacro = z.infer<typeof resumenSimulacro>;
export type InventarioBanco = z.infer<typeof inventarioBanco>;
