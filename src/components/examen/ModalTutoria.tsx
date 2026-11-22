import { ReactNode, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, RotateCcw, Send, X } from 'lucide-react';
import { Area } from '@/types/icfes';
import {
  EstadoTutoria,
  abrirTutoria,
  enviarDefensa,
  enviarMensajeTutoria,
} from '@/services/api';
import { PreguntaEnRepaso } from './PreguntaEnRepaso';

/**
 * The conversation about a question the learner just got wrong, with
 * the question itself beside it.
 *
 * It opens by explaining what went wrong and asking them to defend
 * their answer. Writing down "porque multipliqué 4 por 3" is where the
 * mistake becomes visible — marking an option red only says that they
 * failed.
 *
 * The question sits next to the thread because the tutor's advice is
 * almost always "read it again": the subject line, option C, the second
 * paragraph. Following that advice used to mean closing the panel.
 *
 * The correct answer is never in this component. It is not passed in.
 *
 * Leaving is always possible. A learner who cannot get out of a
 * tutoring panel will not open the next one — so the exit asks for
 * confirmation only when there is a conversation to lose, and says
 * that it is kept rather than warning that it is not.
 */

export interface PreguntaRepaso {
  area: Area;
  contexto?: string;
  pregunta: string;
  opciones: Record<string, string>;
  tieneFigura: boolean;
  figuraAlt?: string;
}

type Pestana = 'pregunta' | 'repaso';

export function ModalTutoria({
  itemId,
  opcionElegida,
  pregunta,
  onReintentar,
  onSaltar,
}: {
  itemId: string;
  opcionElegida: string;
  /** Everything needed to re-read the question. Never the answer. */
  pregunta: PreguntaRepaso;
  /** Back to the same question, to try again. */
  onReintentar: () => void;
  /** Skip the tutoring and move on. */
  onSaltar: () => void;
}) {
  const [estado, setEstado] = useState<EstadoTutoria | null>(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmandoSalida, setConfirmandoSalida] = useState(false);
  const [pestana, setPestana] = useState<Pestana>('repaso');
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
    if (estado && !enviando && pestana === 'repaso') campoRef.current?.focus();
  }, [estado, enviando, pestana]);

  /* Whether anything would be lost by leaving. The learner's own
     messages are the thing worth protecting; the opening explanation
     was written before they arrived and costs nothing to see again. */
  const escribioAlgo = (estado?.mensajes ?? []).some((m) => m.autor === 'estudiante');

  const intentarSalir = () => {
    if (escribioAlgo) {
      setConfirmandoSalida(true);
      return;
    }
    onSaltar();
  };

  // Escape asks, or leaves when there is nothing to ask about. A panel
  // someone cannot leave is one they will not open again.
  useEffect(() => {
    const salir = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmandoSalida) {
        setConfirmandoSalida(false);
        return;
      }
      intentarSalir();
    };
    window.addEventListener('keydown', salir);
    return () => window.removeEventListener('keydown', salir);
  });

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

  const panelPregunta = (
    <PreguntaEnRepaso
      area={pregunta.area}
      contexto={pregunta.contexto}
      pregunta={pregunta.pregunta}
      opciones={pregunta.opciones}
      opcionElegida={opcionElegida}
      itemId={itemId}
      tieneFigura={pregunta.tieneFigura}
      figuraAlt={pregunta.figuraAlt}
    />
  );

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
        className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-t-3xl bg-white sm:rounded-3xl"
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
            onClick={intentarSalir}
            aria-label="Cerrar y seguir"
            className="shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Two columns will not fit on a phone, and a squeezed pair is
            worse than either alone: tabs there, both panels above it. */}
        <div className="flex shrink-0 gap-1 border-b border-slate-200 px-4 py-2 lg:hidden">
          {([
            ['pregunta', 'La pregunta'],
            ['repaso', 'Repaso'],
          ] as Array<[Pestana, string]>).map(([clave, etiqueta]) => (
            <button
              key={clave}
              type="button"
              onClick={() => setPestana(clave)}
              aria-current={pestana === clave}
              className={`flex-1 rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright ${
                  pestana === clave
                    ? 'bg-brand-soft/50 text-brand'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <section
            aria-label="La pregunta"
            className={`min-h-0 overflow-y-auto border-slate-200 px-6 py-5 lg:block lg:w-[46%] lg:border-r ${
              pestana === 'pregunta' ? 'block' : 'hidden'
            }`}
          >
            {panelPregunta}
          </section>

          <section
            aria-label="Conversación con el tutor"
            className={`min-h-0 flex-1 flex-col lg:flex ${
              pestana === 'repaso' ? 'flex' : 'hidden'
            }`}
          >
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-5">
              {!estado && !error ? (
                <p className="text-[14px] text-slate-500">Abriendo…</p>
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
                      esperaDefensa
                        ? `Porque pensé que la ${opcionElegida}…`
                        : 'Escriba su duda'
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
                  onClick={intentarSalir}
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
          </section>
        </div>
      </motion.div>

      {confirmandoSalida ? (
        <ConfirmarSalida
          onVolver={() => setConfirmandoSalida(false)}
          onSalir={onSaltar}
        />
      ) : null}
    </div>
  );
}

/**
 * Asked only when the learner has written something.
 *
 * It says the thread is kept, because it is: the conversation is stored
 * per learner and item, so failing the same question again reopens it.
 * That is reassurance, not a warning — the point is to make leaving
 * safe, not to make it frightening.
 */
function ConfirmarSalida({
  onVolver,
  onSalir,
}: {
  onVolver: () => void;
  onSalir: () => void;
}): ReactNode {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="salir-titulo"
      className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 id="salir-titulo" className="text-[16px] font-bold text-slate-900">
          ¿Salir del repaso?
        </h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">
          Su conversación se guarda. Si vuelve a fallar esta pregunta, la retoma donde la dejó.
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onSalir}
            className="rounded-full px-4 py-2 text-[13.5px] font-semibold text-slate-500 transition-colors hover:text-slate-800
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
          >
            Salir
          </button>
          <button
            type="button"
            autoFocus
            onClick={onVolver}
            className="rounded-full bg-brand-bright px-5 py-2 text-[13.5px] font-semibold text-white transition-transform hover:scale-[1.02]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright focus-visible:ring-offset-2"
          >
            Seguir repasando
          </button>
        </div>
      </div>
    </div>
  );
}
