import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, Target } from 'lucide-react';
import { AREA_LABELS } from '@/types/icfes';
import { ErrorDelDia, getErrorDelDia } from '@/services/api';

/**
 * One question a day, from what this learner already got wrong.
 *
 * The card shows the question itself rather than an invitation to go
 * and find it. A learner with thirty seconds spare will answer what is
 * in front of them; they will not navigate two screens to look for it.
 *
 * It renders nothing at all when there is no honest question to show.
 * A new learner has no mistakes yet, and a random question labelled
 * "su error de hoy" is a lie they notice immediately.
 */

export function TarjetaErrorDelDia() {
  const [pregunta, setPregunta] = useState<ErrorDelDia | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      const r = await getErrorDelDia();
      if (!vivo) return;
      setPregunta(r.data ?? null);
      setCargando(false);
    })();
    return () => {
      vivo = false;
    };
  }, []);

  // Nothing to say is said by saying nothing: an empty card would
  // take up the same space as a useful one.
  if (cargando || !pregunta) return null;

  if (pregunta.resueltoHoy) {
    return (
      <section className="rounded-2xl border border-lime/40 bg-lime/10 p-5">
        <p className="flex items-center gap-2 text-[14px] font-semibold text-slate-800">
          <Check aria-hidden className="h-4 w-4 text-slate-700" strokeWidth={3} />
          Ya hizo su pregunta de hoy
        </p>
        <p className="mt-1 text-[13px] text-slate-600">
          Mañana le traemos otra de las que le han costado.
        </p>
      </section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-amber/40 bg-gradient-to-br from-amber/[0.08] to-white p-6"
    >
      <div className="flex items-center gap-2">
        <Target aria-hidden className="h-4 w-4 text-amber" />
        <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-slate-700">
          Su pregunta de hoy
        </h2>
      </div>

      <p className="mt-1.5 text-[13px] text-slate-600">{pregunta.motivo}</p>

      {pregunta.contexto ? (
        <p className="mt-4 line-clamp-3 rounded-xl bg-white/70 p-3 text-[13px] leading-relaxed text-slate-600">
          {pregunta.contexto}
        </p>
      ) : null}

      <p className="mt-3 text-[15px] leading-snug font-semibold text-slate-900">
        {pregunta.pregunta}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[12.5px] font-semibold text-slate-500">
          {AREA_LABELS[pregunta.area]} · 30 segundos
        </span>
        <Link
          to={`/generacion-especializada?area=${pregunta.area}&n=1`}
          className="rounded-full bg-brand-bright px-6 py-2.5 text-[14px] font-semibold text-white
            shadow-[0_6px_20px_-6px_hsl(var(--brand-bright))] transition-transform hover:scale-[1.02]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright focus-visible:ring-offset-2"
        >
          Responderla
        </Link>
      </div>
    </motion.section>
  );
}
