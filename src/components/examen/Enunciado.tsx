import { useState } from 'react';
import { IcfesItem, AREA_LABELS } from '@/types/icfes';
import { QuestionFigure } from '@/components/QuestionFigure';

/**
 * The question stem: context, figure, question.
 *
 * Changes from the old QuestionCard:
 *
 *  - The context collapses to about eight lines with a real
 *    "Ver todo el texto" control instead of a scroll area. A nested
 *    scroll inside a page that also scrolls is the classic reading
 *    trap: the wheel moves whichever one the pointer happens to be
 *    over, and on a phone the inner box eats the swipe.
 *  - The difficulty badge is gone. Telling a learner the question
 *    is "difícil" before they read it primes them to fail, and it
 *    is information for us, not for them.
 *  - "Pregunta 3 de 20" lives in the top bar, once, instead of
 *    twice on the same screen.
 */

export function Enunciado({ item }: { item: IcfesItem }) {
  const [abierto, setAbierto] = useState(false);
  const textoLargo = (item.contexto?.length ?? 0) > 420;

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
      <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-brand-bright">
        {AREA_LABELS[item.area]}
      </p>

      {item.contexto ? (
        <div className="mt-4">
          <div className="rounded-2xl bg-wash/70 p-5">
            <p
              className={`whitespace-pre-wrap text-[14.5px] leading-[1.75] text-slate-700 ${
                textoLargo && !abierto ? 'line-clamp-[8]' : ''
              }`}
            >
              {item.contexto}
            </p>
          </div>
          {textoLargo ? (
            <button
              type="button"
              onClick={() => setAbierto((v) => !v)}
              aria-expanded={abierto}
              className="mt-2 rounded px-1 text-[13px] font-semibold text-brand-bright hover:underline
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
            >
              {abierto ? 'Mostrar menos' : 'Ver todo el texto'}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* The figure sits between context and question, as in the
          printed exam: it is part of the stimulus, not decoration. */}
      {item.figura && item.id ? (
        <div className="mt-5">
          <QuestionFigure itemId={item.id} alt={item.figura.alt} />
        </div>
      ) : null}

      <h2 className="mt-6 text-[17.5px] leading-[1.55] font-semibold text-slate-900 sm:text-[19px]">
        {item.pregunta}
      </h2>
    </article>
  );
}
