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

/** One topic as it went inside these seven days. */
const temaDeLaSemana = z.object({
  area,
  tema: z.string(),
  aciertoPorcentaje: z.number(),
  respondidas: z.number(),
  /** Median seconds per answer here, from `Answer.tiempoMs`. */
  segundosMediana: z.number().nullable(),
});

/**
 * What happened in the week, as opposed to what the learner carries.
 *
 * The distinction is the whole reason the report can use a past
 * tense. `temasDebiles` is accumulated history with no date filter,
 * so it could only ever support «te viene costando»; this is a
 * window, so it supports «esta semana te fue bien en fracciones».
 *
 * Null when there was no measurable practice, which is different from
 * zero: an accuracy of 0% over no answers reads as «falló todo».
 */
const semanaDelInforme = z.object({
  respondidas: z.number(),
  aciertoPorcentaje: z.number(),
  segundosMediana: z.number().nullable(),
  /** Topics that went well. Per topic, not per area. */
  fuertes: z.array(temaDeLaSemana),
  flojos: z.array(temaDeLaSemana),
  /** Answered much slower than this learner's own median. */
  lentos: z.array(temaDeLaSemana),
});

/**
 * Last week's plan and what became of it.
 *
 * Empty on a first report. `sinTocar` is said plainly rather than
 * hidden: a report that drops an untouched action pretends the plan
 * never existed, and a plan nobody is held to is a plan nobody
 * follows.
 */
const seguimientoDelPlan = z.object({
  area,
  tema: z.string(),
  titulo: z.string(),
  respondidas: z.number(),
  /** Null when too few answers for a percentage to mean anything. */
  aciertoPorcentaje: z.number().nullable(),
  sinTocar: z.boolean(),
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
  semana7dias: semanaDelInforme.nullable(),
  planAnterior: z.array(seguimientoDelPlan),
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
export type TemaDeLaSemana = z.infer<typeof temaDeLaSemana>;
export type SeguimientoDelPlan = z.infer<typeof seguimientoDelPlan>;
