import { z } from 'zod';
import { area } from '@/shared/model/icfes';

/**
 * The weekly report.
 *
 * Every number the screen shows comes from `datos`, never from the
 * model's prose: the server computes them from `PerfilDebilidad` and
 * hands them over already done, and the shape the model answers with
 * has no numeric field at all. Reading a percentage out of `resumen`
 * would undo that on the client side.
 */

const nota = z.object({
  area: area.nullable(),
  nota: z.string(),
});

/**
 * One thing to do this week.
 *
 * `area` and `tema` are keys, not labels: they go to the exercise
 * endpoints when the learner taps «practicar esto». The server has
 * already dropped any action whose topic it did not supply, so what
 * arrives here is always something the bank can answer.
 */
export const accionDelPlan = z.object({
  area,
  tema: z.string(),
  titulo: z.string(),
  detalle: z.string(),
});

const temaDebil = z.object({
  area,
  tema: z.string(),
  aciertoPorcentaje: z.number(),
  respondidas: z.number(),
  errorTipico: z.string().nullable(),
});

const areaDelInforme = z.object({
  area,
  aciertoPorcentaje: z.number(),
  /** Change against last week, in points. Negative is worse. */
  delta: z.number(),
});

/** What was handed to the model, kept so the screen shows the same figures. */
export const datosDelInforme = z.object({
  semana: z.string(),
  sesionesEstaSemana: z.number(),
  minutosEstaSemana: z.number(),
  porArea: z.array(areaDelInforme),
  segundosPorPregunta: z.number(),
  segundosDelExamenReal: z.number(),
  temasDebiles: z.array(temaDebil),
  semanaVacia: z.boolean(),
});

export const informeSemanal = z.object({
  semanaInicio: z.string(),
  semana: z.string(),
  resumen: z.string(),
  fortalezas: z.array(nota),
  debilidades: z.array(nota),
  plan: z.array(accionDelPlan),
  datos: datosDelInforme,
  generadoEn: z.string(),
});

export type InformeSemanal = z.infer<typeof informeSemanal>;
export type AccionDelPlan = z.infer<typeof accionDelPlan>;
export type TemaDebil = z.infer<typeof temaDebil>;
