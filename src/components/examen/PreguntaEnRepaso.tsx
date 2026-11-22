import { AREA_LABELS, AnswerKey, Area } from '@/types/icfes';
import { QuestionFigure } from '@/components/QuestionFigure';

/**
 * The question, shown beside the tutoring conversation.
 *
 * It exists because the tutor keeps saying things like "read the
 * subject line again" or "look at option C once more", and the only
 * way to do that used to be closing the panel, reading, and reopening
 * it. The advice was good and following it was a chore.
 *
 * What it shows, and why:
 *
 *  - Context, figure, question and all four options. Not the stem
 *    alone: half the tutor's prompts are about an option, and a
 *    language item is read from its passage. Dropping either half
 *    breaks one subject to fix another.
 *  - The learner's own choice is marked. They already know it, and
 *    the tutor refers to it by letter.
 *  - The correct answer is NOT marked, and is not even sent to this
 *    component. The whole point of the panel is to think the question
 *    through again; printing the answer next to the conversation would
 *    make the conversation decorative.
 */

export function PreguntaEnRepaso({
  area,
  contexto,
  pregunta,
  opciones,
  opcionElegida,
  itemId,
  tieneFigura,
  figuraAlt,
}: {
  area: Area;
  contexto?: string;
  pregunta: string;
  opciones: Record<string, string>;
  /** The option they picked, so it can be marked as theirs. */
  opcionElegida: string;
  itemId: string;
  tieneFigura: boolean;
  figuraAlt?: string;
}) {
  return (
    <div className="space-y-4 text-[14px] leading-relaxed text-slate-700">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-bright">
        {AREA_LABELS[area]}
      </p>

      {contexto ? (
        <div className="whitespace-pre-wrap rounded-2xl bg-wash/70 p-4 text-[13.5px] leading-[1.75]">
          {contexto}
        </div>
      ) : null}

      {tieneFigura ? <QuestionFigure itemId={itemId} alt={figuraAlt} /> : null}

      <h3 className="text-[15px] font-semibold leading-snug text-slate-900">{pregunta}</h3>

      <ul className="space-y-2">
        {(['A', 'B', 'C', 'D'] as AnswerKey[])
          .filter((letra) => opciones[letra])
          .map((letra) => {
            const suya = letra === opcionElegida;
            return (
              <li
                key={letra}
                className={`flex gap-3 rounded-xl border p-3 text-[13.5px] ${
                  suya
                    ? 'border-brand-bright/60 bg-brand-soft/30'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                    suya ? 'bg-brand-bright text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {letra}
                </span>
                <span className="flex-1 text-slate-700">
                  {opciones[letra]}
                  {suya ? (
                    <span className="ml-2 text-[12px] font-semibold text-brand-bright">
                      · su respuesta
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
