import { Check, X } from 'lucide-react';
import { AnswerKey } from '@/types/icfes';

/**
 * One answer option, as a real radio in a real radiogroup.
 *
 * The previous version was a plain <button>, which meant a screen
 * reader announced four unrelated buttons instead of "option B,
 * 2 of 4", and arrow keys did nothing. Answering a multiple-choice
 * question is choosing one of a set, so the markup says that.
 *
 * Only the checked option is in the tab order (roving tabindex),
 * which is how a radiogroup is meant to behave: Tab moves past the
 * whole group, arrows move inside it.
 */

export type EstadoOpcion = 'pendiente' | 'correcta' | 'elegida-mal' | 'descartada';

export function OpcionRespuesta({
  letra,
  texto,
  elegida,
  estado,
  bloqueada,
  esFoco,
  onElegir,
  refBoton,
}: {
  letra: AnswerKey;
  texto: string;
  elegida: boolean;
  estado: EstadoOpcion;
  bloqueada: boolean;
  /** True for the option that currently holds the group's tab stop. */
  esFoco: boolean;
  onElegir: () => void;
  refBoton?: (nodo: HTMLButtonElement | null) => void;
}) {
  const marco = {
    pendiente: elegida
      ? 'border-brand-bright bg-brand-soft/40 ring-2 ring-brand-bright/25'
      : 'border-slate-200 bg-white hover:border-brand-bright/45 hover:bg-brand-soft/15',
    correcta: 'border-lime bg-lime/10',
    'elegida-mal': 'border-rose-400 bg-rose-50',
    descartada: 'border-slate-200 bg-slate-50 opacity-55',
  }[estado];

  const insignia = {
    pendiente: elegida
      ? 'bg-brand-bright text-white'
      : 'bg-slate-100 text-slate-500 group-hover:bg-brand-soft group-hover:text-brand',
    correcta: 'bg-lime text-slate-900',
    'elegida-mal': 'bg-rose-500 text-white',
    descartada: 'bg-slate-100 text-slate-400',
  }[estado];

  return (
    <button
      type="button"
      role="radio"
      aria-checked={elegida}
      aria-disabled={bloqueada}
      tabIndex={esFoco ? 0 : -1}
      ref={refBoton}
      onClick={bloqueada ? undefined : onElegir}
      className={`group flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright focus-visible:ring-offset-2
        ${marco} ${bloqueada ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <span
        aria-hidden
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-bold transition-colors ${insignia}`}
      >
        {estado === 'correcta' ? (
          <Check className="h-4 w-4" strokeWidth={3} />
        ) : estado === 'elegida-mal' ? (
          <X className="h-4 w-4" strokeWidth={3} />
        ) : (
          letra
        )}
      </span>
      <span className="flex-1 pt-1">
        {/* The letter is hidden from the badge above and restored
            here, so a screen reader reads "B. <text>" once rather
            than reading a lone letter and then the text. */}
        <span className="sr-only">{letra}. </span>
        <span
          className={`text-[15px] leading-relaxed ${
            estado === 'descartada' ? 'text-slate-500' : 'text-slate-800'
          }`}
        >
          {texto}
        </span>
        {estado === 'correcta' ? (
          <span className="sr-only"> (respuesta correcta)</span>
        ) : estado === 'elegida-mal' ? (
          <span className="sr-only"> (tu respuesta, incorrecta)</span>
        ) : null}
      </span>
    </button>
  );
}
