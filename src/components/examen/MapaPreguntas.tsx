import { AREA_LABELS, Area } from '@/types/icfes';

/**
 * The question map: one dot per question, click to jump.
 *
 * The real sitting hands out a scratch sheet for exactly this, because
 * there is no fixed order to a 254-question exam. You may skip a whole
 * subject, start from the back, leave three for later and come back.
 * Without a map, a long sitting is a corridor with no doors.
 *
 * Three states, and they are independent:
 *
 *  - answered: a choice is recorded. It can still be changed.
 *  - flagged: the learner wants to come back. An answered question can
 *    be flagged too — "I put C but I am not sure" is the single most
 *    common thing that scratch sheet is used for.
 *  - untouched.
 *
 * What the map never shows is whether an answer was right. In a
 * sitting the verdict does not exist yet, and a map that leaked it
 * would turn the exam into a quiz.
 */

export interface PuntoMapa {
  orden: number;
  area: Area;
  respondida: boolean;
  marcada: boolean;
}

export function MapaPreguntas({
  puntos,
  actual,
  onIr,
  agruparPorArea = true,
}: {
  puntos: PuntoMapa[];
  actual: number;
  onIr: (orden: number) => void;
  agruparPorArea?: boolean;
}) {
  const respondidas = puntos.filter((p) => p.respondida).length;
  const marcadas = puntos.filter((p) => p.marcada).length;

  const grupos = agruparPorArea
    ? [...new Map(puntos.map((p) => [p.area, true])).keys()].map((area) => ({
        area,
        suyos: puntos.filter((p) => p.area === area),
      }))
    : [{ area: null, suyos: puntos }];

  return (
    <nav aria-label="Mapa de preguntas" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[13px] font-semibold text-slate-700">
          {respondidas} de {puntos.length} respondidas
        </p>
        {marcadas > 0 ? (
          <p className="text-[12.5px] text-amber-600">{marcadas} para revisar</p>
        ) : null}
      </div>

      {grupos.map(({ area, suyos }) => (
        <div key={area ?? 'todas'}>
          {area ? (
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              {AREA_LABELS[area]}
            </p>
          ) : null}
          <ul className="flex flex-wrap gap-1.5">
            {suyos.map((p) => {
              const esActual = p.orden === actual;
              const base =
                'relative flex h-9 w-9 items-center justify-center rounded-lg text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright focus-visible:ring-offset-1';
              const estilo = p.respondida
                ? 'bg-brand-bright text-white hover:bg-brand-bright/90'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200';
              const anillo = esActual ? 'ring-2 ring-slate-900 ring-offset-1' : '';

              /* The state has to survive someone who cannot see colour
                 and someone using a screen reader, so it is also in the
                 accessible name — not only in the fill. */
              const etiqueta = [
                `Pregunta ${p.orden + 1}`,
                p.respondida ? 'respondida' : 'sin responder',
                p.marcada ? 'marcada para revisar' : '',
                esActual ? 'actual' : '',
              ]
                .filter(Boolean)
                .join(', ');

              return (
                <li key={p.orden}>
                  <button
                    type="button"
                    onClick={() => onIr(p.orden)}
                    aria-label={etiqueta}
                    aria-current={esActual ? 'true' : undefined}
                    className={`${base} ${estilo} ${anillo}`}
                  >
                    {p.orden + 1}
                    {p.marcada ? (
                      <span
                        aria-hidden
                        className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-white bg-amber-400"
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-500">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-3 w-3 rounded bg-brand-bright" />
          Respondida
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-3 w-3 rounded bg-slate-200" />
          Sin responder
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          Para revisar
        </li>
      </ul>
    </nav>
  );
}
