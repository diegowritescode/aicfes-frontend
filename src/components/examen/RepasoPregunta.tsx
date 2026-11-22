import { useState } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { IcfesItem, AnswerKey } from '@/types/icfes';

/**
 * One reviewable question, collapsed until asked for.
 *
 * The old review listed four questions per page behind a thirteen-page
 * paginator, every one of them fully expanded whether the learner got
 * it right or not. Reviewing fifty questions meant thirteen clicks
 * through content that was mostly already understood.
 *
 * Here every question is on one page and closed, the wrong ones open
 * first, and the summary line alone often settles it.
 */

export function RepasoPregunta({
  item,
  numero,
  elegida,
  acerto,
  abiertoPorDefecto = false,
}: {
  item: IcfesItem;
  numero: number;
  elegida: AnswerKey;
  acerto: boolean;
  abiertoPorDefecto?: boolean;
}) {
  const [abierto, setAbierto] = useState(abiertoPorDefecto);
  const idPanel = `repaso-${numero}`;

  const explicacion = item.explicaciones?.[elegida] ?? item.justificacion;

  return (
    <div
      className={`overflow-hidden rounded-2xl border ${
        acerto ? 'border-slate-200 bg-white' : 'border-rose-200 bg-rose-50/40'
      }`}
    >
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-controls={idPanel}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-slate-50/80
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-bright"
      >
        <span
          aria-hidden
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
            acerto ? 'bg-lime/25 text-slate-700' : 'bg-rose-500 text-white'
          }`}
        >
          {acerto ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <X className="h-3.5 w-3.5" strokeWidth={3} />}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[12px] font-bold text-slate-400">Pregunta {numero}</span>
            <span className={`text-[12px] font-semibold ${acerto ? 'text-slate-500' : 'text-rose-600'}`}>
              {acerto ? 'Correcta' : `Respondiste ${elegida}, era ${item.respuesta_correcta}`}
            </span>
          </span>
          <span className="mt-1 block line-clamp-2 text-[14px] leading-snug text-slate-800">
            {item.pregunta}
          </span>
        </span>

        <ChevronDown
          aria-hidden
          className={`mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform ${abierto ? 'rotate-180' : ''}`}
        />
      </button>

      {abierto ? (
        <div id={idPanel} className="border-t border-slate-200/70 px-4 pb-5 pt-4">
          <ul className="space-y-1.5">
            {(['A', 'B', 'C', 'D'] as const).map((letra) => {
              const esCorrecta = letra === item.respuesta_correcta;
              const esTuya = letra === elegida;
              return (
                <li
                  key={letra}
                  className={`flex gap-2.5 rounded-lg px-3 py-2 text-[13.5px] leading-snug ${
                    esCorrecta
                      ? 'bg-lime/15 text-slate-900'
                      : esTuya
                        ? 'bg-rose-100/70 text-slate-900'
                        : 'text-slate-500'
                  }`}
                >
                  <span className="font-bold">{letra}</span>
                  <span className="flex-1">{item.opciones[letra]}</span>
                  {esCorrecta ? (
                    <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                      Correcta
                    </span>
                  ) : esTuya ? (
                    <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-rose-600">
                      Tu respuesta
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <div className="mt-4 rounded-xl bg-white/90 p-4">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Por qué
            </h4>
            <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-[1.7] text-slate-700">
              {explicacion}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
