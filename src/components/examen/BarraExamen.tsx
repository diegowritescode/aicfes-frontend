import { X } from 'lucide-react';

/**
 * The exam's top bar.
 *
 * The old header carried three progress indicators at once — a time
 * bar, a question bar and a clock — plus a logo link that threw the
 * attempt away on a single click with no warning. On a screen whose
 * only job is to hold the learner's attention on one question, that
 * is three things competing with the question.
 *
 * What is left: how far along you are, how much time you have, and
 * one way out that asks first.
 */

export function BarraExamen({
  numero,
  total,
  tiempo,
  limite,
  restante,
  onSalir,
}: {
  numero: number;
  total: number;
  /** Seconds elapsed, shown when there is no time limit. */
  tiempo: string;
  /** Total seconds allowed, or null in untimed practice. */
  limite: number | null;
  /** Seconds left, or null in untimed practice. */
  restante: { texto: string; segundos: number } | null;
  onSalir: () => void;
}) {
  const avance = Math.round((numero / total) * 100);
  const ratio = limite && restante ? Math.max(0, restante.segundos / limite) : null;

  // Amber at 40%, rose at 20%: a learner should feel time running
  // out before it has.
  const colorTiempo =
    ratio === null
      ? 'bg-brand-bright'
      : ratio <= 0.2
        ? 'bg-rose-500'
        : ratio <= 0.4
          ? 'bg-amber'
          : 'bg-lime';

  const urgente = restante !== null && restante.segundos <= 60;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3">
        <p className="shrink-0 text-[13.5px] font-semibold text-slate-700 tabular-nums">
          <span className="text-slate-900">{numero}</span>
          <span className="text-slate-400"> / {total}</span>
        </p>

        {/* One bar. It shows time when time is limited, because then
            time is the scarce thing; otherwise it shows progress. */}
        <div className="flex-1">
          <div
            role="progressbar"
            aria-valuenow={restante ? restante.segundos : avance}
            aria-valuemin={0}
            aria-valuemax={restante && limite ? limite : 100}
            aria-label={restante ? 'Tiempo restante' : 'Avance del examen'}
            className="h-1.5 overflow-hidden rounded-full bg-slate-100"
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${colorTiempo}`}
              style={{ width: `${ratio !== null ? ratio * 100 : avance}%` }}
            />
          </div>
        </div>

        <p
          className={`shrink-0 font-mono text-[14px] tabular-nums ${
            urgente ? 'font-bold text-rose-600' : 'text-slate-600'
          }`}
        >
          {restante ? restante.texto : tiempo}
        </p>

        <button
          type="button"
          onClick={onSalir}
          aria-label="Salir del examen"
          className="shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
