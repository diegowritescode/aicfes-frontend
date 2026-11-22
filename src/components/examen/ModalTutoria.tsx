import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, RotateCcw, Send, X } from 'lucide-react';
import {
  EstadoTutoria,
  abrirTutoria,
  enviarDefensa,
  enviarMensajeTutoria,
} from '@/services/api';

/**
 * The conversation about a question the learner just got wrong.
 *
 * It opens by asking them to defend their answer, before saying
 * anything itself. Writing down "porque multipliqué 4 por 3" is where
 * the mistake becomes visible — marking an option red only says that
 * they failed.
 *
 * The first reply arrives in about a second and costs nothing: the
 * server answers from the explanation the item already carries. Only
 * a follow-up message reaches a model.
 *
 * Leaving is always possible. A learner who cannot get out of a
 * tutoring panel will not open the next one.
 */

export function ModalTutoria({
  itemId,
  opcionElegida,
  onReintentar,
  onSaltar,
}: {
  itemId: string;
  opcionElegida: string;
  /** Back to the same question, to try again. */
  onReintentar: () => void;
  /** Skip the tutoring and move on. */
  onSaltar: () => void;
}) {
  const [estado, setEstado] = useState<EstadoTutoria | null>(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement | null>(null);
  const campoRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      const r = await abrirTutoria(itemId, opcionElegida);
      if (!vivo) return;
      if (!r.success) {
        setError(r.error?.message ?? 'No se pudo abrir la tutoría.');
        return;
      }
      setEstado(r.data ?? null);
    })();
    return () => {
      vivo = false;
    };
  }, [itemId, opcionElegida]);

  // Keep the newest message in view as the thread grows.
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [estado?.mensajes.length]);

  useEffect(() => {
    if (estado && !enviando) campoRef.current?.focus();
  }, [estado, enviando]);

  // Escape closes. A panel someone cannot leave is one they will not
  // open again.
  useEffect(() => {
    const salir = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSaltar();
    };
    window.addEventListener('keydown', salir);
    return () => window.removeEventListener('keydown', salir);
  }, [onSaltar]);

  const esperaDefensa = estado?.esperaDefensa ?? true;
  const sinTurnos = (estado?.turnosRestantes ?? 1) <= 0;

  const enviar = async () => {
    const limpio = texto.trim();
    if (!limpio || enviando) return;
    setEnviando(true);
    setError(null);

    const r = esperaDefensa
      ? await enviarDefensa(itemId, limpio)
      : await enviarMensajeTutoria(itemId, limpio);

    setEnviando(false);
    if (!r.success) {
      setError(r.error?.message ?? 'No se pudo enviar.');
      return;
    }
    setTexto('');
    setEstado(r.data ?? null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Repasemos esta pregunta"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="flex max-h-[92vh] w-full max-w-xl flex-col rounded-t-3xl bg-white sm:rounded-3xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-[17px] font-bold tracking-tight text-slate-900">
              Repasemos esta pregunta
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {esperaDefensa
                ? 'Primero cuénteme qué pensó usted'
                : `Le quedan ${estado?.turnosRestantes ?? 0} mensajes`}
            </p>
          </div>
          <button
            type="button"
            onClick={onSaltar}
            aria-label="Cerrar y seguir"
            className="shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-5">
          {!estado && !error ? (
            <p className="text-[14px] text-slate-500">Abriendo…</p>
          ) : null}

          {esperaDefensa && estado ? (
            <div className="rounded-2xl bg-wash/70 p-5">
              <p className="text-[14.5px] leading-relaxed text-slate-700">
                Antes de explicarle nada: <strong>¿por qué eligió la {opcionElegida}?</strong>{' '}
                Escríbalo como lo pensó, aunque haya sido una corazonada. Eso es lo que nos
                deja ver dónde se desvió.
              </p>
            </div>
          ) : null}

          {estado?.mensajes.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.autor === 'estudiante' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                  m.autor === 'estudiante'
                    ? 'bg-brand-bright text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                <span className="sr-only">
                  {m.autor === 'estudiante' ? 'Usted: ' : 'Tutor: '}
                </span>
                {m.contenido}
              </div>
            </div>
          ))}

          {enviando ? (
            <p aria-live="polite" className="text-[13px] text-slate-500">
              Pensando…
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-[13.5px] text-rose-700">
              {error}
            </p>
          ) : null}

          <div ref={finRef} />
        </div>

        <footer className="border-t border-slate-200 px-6 py-4">
          {sinTurnos ? (
            <p className="mb-3 rounded-xl bg-slate-100 px-4 py-3 text-[13.5px] text-slate-600">
              Hasta aquí llega esta conversación. Vuelva a intentar la pregunta con lo que
              acaban de hablar.
            </p>
          ) : (
            <div className="flex items-end gap-2">
              <textarea
                ref={campoRef}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  // Enter sends, Shift+Enter breaks the line: this is a
                  // conversation, not a form.
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void enviar();
                  }
                }}
                rows={2}
                disabled={enviando || !estado}
                placeholder={
                  esperaDefensa ? 'Porque pensé que…' : 'Escriba su duda'
                }
                aria-label={esperaDefensa ? 'Por qué eligió esa opción' : 'Su mensaje'}
                className="flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-[14px] text-slate-800
                  placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
              />
              <button
                type="button"
                onClick={() => void enviar()}
                disabled={enviando || !texto.trim() || !estado}
                aria-label="Enviar"
                className="shrink-0 rounded-full bg-brand-bright p-3 text-white transition-transform hover:scale-[1.04]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright focus-visible:ring-offset-2
                  disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:hover:scale-100"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={onSaltar}
              className="rounded-full px-3 py-2 text-[13.5px] font-semibold text-slate-500 transition-colors hover:text-slate-800
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
            >
              Seguir sin repasar
              <ArrowRight aria-hidden className="ml-1 inline h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onReintentar}
              className="inline-flex items-center gap-2 rounded-full border border-brand-bright px-5 py-2 text-[13.5px] font-semibold text-brand-bright
                transition-colors hover:bg-brand-soft/40
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
            >
              <RotateCcw aria-hidden className="h-3.5 w-3.5" />
              Volver a intentar
            </button>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
