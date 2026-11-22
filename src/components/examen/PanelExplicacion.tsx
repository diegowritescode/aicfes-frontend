import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check, X } from 'lucide-react';
import { IcfesItem, AnswerKey } from '@/types/icfes';

/**
 * The explanation, shown in place rather than in a modal.
 *
 * The old flow put a dialog over the screen after every single
 * answer, with onOpenChange as a no-op — so Escape did nothing and
 * the only way forward was the one button inside. Across fifty
 * questions that is fifty forced interruptions, and the learner
 * could no longer see the options the explanation was talking
 * about.
 *
 * In place, the explanation sits under the options that are still
 * on screen, with the right answer already marked there. The panel
 * is announced with role="status" so a screen reader hears the
 * verdict without the focus being taken away.
 */

export function PanelExplicacion({
  item,
  elegida,
  acerto,
  esUltima,
  onSiguiente,
}: {
  item: IcfesItem;
  elegida: AnswerKey;
  acerto: boolean;
  esUltima: boolean;
  onSiguiente: () => void;
}) {
  const botonRef = useRef<HTMLButtonElement | null>(null);

  // Move focus to the one control that matters now, so Enter and
  // Tab both land somewhere useful. Focus goes to a button the
  // learner asked for, not into a trap they cannot leave.
  useEffect(() => {
    botonRef.current?.focus();
  }, []);

  const explicacion = item.explicaciones?.[elegida] ?? item.justificacion;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Resultado de tu respuesta"
      className={`rounded-3xl border-2 p-6 sm:p-7 ${
        acerto ? 'border-lime bg-lime/[0.07]' : 'border-rose-300 bg-rose-50/70'
      }`}
    >
      <div role="status" className="flex items-start gap-3">
        <span
          aria-hidden
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            acerto ? 'bg-lime text-slate-900' : 'bg-rose-500 text-white'
          }`}
        >
          {acerto ? <Check className="h-4 w-4" strokeWidth={3} /> : <X className="h-4 w-4" strokeWidth={3} />}
        </span>
        <div>
          <p className="text-[16px] font-bold text-slate-900">
            {acerto ? 'Correcto' : 'No era esa'}
          </p>
          {!acerto ? (
            <p className="mt-0.5 text-[13.5px] text-slate-600">
              La respuesta correcta es la <strong>{item.respuesta_correcta}</strong>, marcada
              arriba en verde.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-white/80 p-5">
        <h3 className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Por qué
        </h3>
        <p className="mt-2 whitespace-pre-wrap text-[14.5px] leading-[1.75] text-slate-700">
          {explicacion}
        </p>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          ref={botonRef}
          onClick={onSiguiente}
          className="inline-flex items-center gap-2 rounded-full bg-brand-bright px-7 py-3 text-[14.5px] font-semibold text-white
            shadow-[0_6px_20px_-6px_hsl(var(--brand-bright))] transition-transform hover:scale-[1.02]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright focus-visible:ring-offset-2"
        >
          {esUltima ? 'Ver mis resultados' : 'Siguiente pregunta'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.section>
  );
}
