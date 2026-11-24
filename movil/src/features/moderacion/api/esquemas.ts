import { z } from 'zod';

/** How many reports wait, and how long the oldest has waited. */
export const pendientesDeModeracion = z.object({
  abiertas: z.number(),
  /* Null when nothing is open. The number that says whether this
     queue is being attended at all, which is the whole point of the
     route. */
  diasDeLaMasAntigua: z.number().nullable(),
});

export const cuentaDenunciada = z.object({
  id: z.string(),
  alias: z.string().nullable(),
  aliasBuscable: z.boolean(),
  createdAt: z.string(),
});

export const denuncia = z.object({
  id: z.string(),
  motivo: z.enum(['alias_ofensivo', 'acoso', 'suplantacion', 'otro']),
  detalle: z.string().nullable(),
  creadoEn: z.string(),
  denunciado: cuentaDenunciada,
  denunciante: z.object({ id: z.string(), alias: z.string().nullable() }),
  /** Reports about this account in total. */
  denunciasTotales: z.number(),
  /* How many **different** learners reported it. Three complaints
     from one person and one each from three people look identical in
     a total and are not the same thing. */
  personasQueLoDenunciaron: z.number(),
});

export const colaDeModeracion = z.array(denuncia);

export const resolucion = z.object({ estado: z.string() });

export const retiro = z.object({
  aliasBuscable: z.boolean(),
  duelosCancelados: z.number(),
});

export type PendientesDeModeracion = z.infer<typeof pendientesDeModeracion>;
export type Denuncia = z.infer<typeof denuncia>;
