import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, Flag, Map as MapIcon } from 'lucide-react';
import { AREA_LABELS, AnswerKey, Area } from '@/types/icfes';
import { QuestionFigure } from '@/components/QuestionFigure';
import { MapaPreguntas } from '@/components/examen/MapaPreguntas';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/button';
import {
  EstadoSimulacro,
  getSimulacro,
  marcarPreguntaSimulacro,
  responderSimulacro,
  terminarSimulacro,
} from '@/services/api';

/**
 * A sitting, run the way the real exam runs.
 *
 * Three things make it different from training, and all three are
 * deliberate:
 *
 *  - No verdict until the end. In the real exam the result arrives
 *    three months later; knowing immediately changes how you answer
 *    the next question, so practising with instant feedback does not
 *    practise the thing being tested.
 *  - Free navigation. There is no fixed order: skip a subject, start
 *    from the back, come back to question 4 at the end. The map is how
 *    that stops being a corridor with no doors.
 *  - Answers can change. Only the last choice counts.
 *
 * The clock and the answers live on the server. This page asks for the
 * state and draws it, which is why closing the tab loses nothing but
 * the time that passed.
 */

export default function Simulacro() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [estado, setEstado] = useState<EstadoSimulacro | null>(null);
  const [actual, setActual] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restantes, setRestantes] = useState(0);
  const [mapaAbierto, setMapaAbierto] = useState(false);
  const [confirmarEntrega, setConfirmarEntrega] = useState(false);
  const [entregando, setEntregando] = useState(false);
  const entregadoRef = useRef(false);

  const cargar = useCallback(async () => {
    if (!id) return;
    const r = await getSimulacro(id);
    setCargando(false);
    if (!r.success) {
      setError(r.error?.message ?? 'No se pudo cargar el simulacro.');
      return;
    }
    const datos = r.data ?? null;
    setEstado(datos);
    setRestantes(datos?.segundosRestantes ?? 0);
    if (datos && (datos.status !== 'en_curso' || datos.expirado)) {
      navigate(`/simulacro/${id}/resultados`, { replace: true });
    }
  }, [id, navigate]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  /* The countdown is drawn here but owned by the server: every answer
     comes back with the real figure, and this only fills the seconds in
     between. A tab in the background has its timers throttled, so when
     the page becomes visible again it re-reads the state instead of
     trusting what it counted while it was hidden. */
  useEffect(() => {
    if (!estado || estado.status !== 'en_curso') return;
    const t = window.setInterval(() => setRestantes((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [estado]);

  useEffect(() => {
    const alVolver = () => {
      if (document.visibilityState === 'visible') void cargar();
    };
    document.addEventListener('visibilitychange', alVolver);
    window.addEventListener('online', alVolver);
    return () => {
      document.removeEventListener('visibilitychange', alVolver);
      window.removeEventListener('online', alVolver);
    };
  }, [cargar]);

  const entregar = useCallback(async () => {
    if (!id || entregadoRef.current) return;
    entregadoRef.current = true;
    setEntregando(true);
    await terminarSimulacro(id);
    navigate(`/simulacro/${id}/resultados`, { replace: true });
  }, [id, navigate]);

  // Running out of time hands the sitting in, rather than leaving the
  // learner on a dead screen wondering what happened.
  useEffect(() => {
    if (estado?.status === 'en_curso' && restantes <= 0 && !entregadoRef.current) {
      void entregar();
    }
  }, [restantes, estado, entregar]);

  /* A fresh [] each render would defeat the useMemo below, which is
     what rebuilds the map on every keystroke. */
  const preguntas = useMemo(() => estado?.preguntas ?? [], [estado]);
  const pregunta = preguntas[actual];

  const puntos = useMemo(
    () =>
      preguntas.map((p) => ({
        orden: p.orden,
        area: p.area as Area,
        respondida: p.respuesta !== null,
        marcada: p.marcada,
      })),
    [preguntas],
  );

  const responder = async (letra: AnswerKey) => {
    if (!id || !pregunta) return;
    // Drawn immediately, confirmed by the server. A sitting where the
    // option lights up half a second late feels broken.
    setEstado((prev) =>
      prev
        ? {
            ...prev,
            preguntas: prev.preguntas.map((p) =>
              p.orden === pregunta.orden ? { ...p, respuesta: letra } : p,
            ),
          }
        : prev,
    );
    const r = await responderSimulacro(id, pregunta.orden, letra);
    if (!r.success) {
      setError(r.error?.message ?? 'No se pudo guardar la respuesta.');
      void cargar();
      return;
    }
    if (typeof r.data?.segundosRestantes === 'number') {
      setRestantes(r.data.segundosRestantes);
    }
  };

  const alternarMarca = async () => {
    if (!id || !pregunta) return;
    const nueva = !pregunta.marcada;
    setEstado((prev) =>
      prev
        ? {
            ...prev,
            preguntas: prev.preguntas.map((p) =>
              p.orden === pregunta.orden ? { ...p, marcada: nueva } : p,
            ),
          }
        : prev,
    );
    await marcarPreguntaSimulacro(id, pregunta.orden, nueva);
  };

  const irA = (orden: number) => {
    setActual(orden);
    setMapaAbierto(false);
  };

  if (cargando) {
    return <p className="p-8 text-[14px] text-slate-500">Cargando el simulacro…</p>;
  }

  if (error && !estado) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-[14px] text-rose-700">
          {error}
        </p>
        <Button className="mt-4" onClick={() => navigate('/dashboard')}>
          Volver al inicio
        </Button>
      </div>
    );
  }

  if (!pregunta) {
    return <p className="p-8 text-[14px] text-slate-500">Este simulacro no tiene preguntas.</p>;
  }

  const minutos = Math.floor(restantes / 60);
  const segundos = restantes % 60;
  const apurado = restantes <= 300;
  const sinResponder = puntos.filter((p) => !p.respondida).length;

  return (
    <div className="min-h-screen bg-wash">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-[13.5px] font-semibold text-slate-700">
            Pregunta {actual + 1} de {preguntas.length}
          </p>

          <p
            aria-live={apurado ? 'polite' : 'off'}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[14px] font-bold tabular-nums ${
              apurado ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Clock aria-hidden className="h-4 w-4" />
            <span className="sr-only">Tiempo restante </span>
            {minutos}:{String(segundos).padStart(2, '0')}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMapaAbierto(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[13px] font-semibold text-slate-600
                hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright lg:hidden"
            >
              <MapIcon aria-hidden className="h-3.5 w-3.5" />
              Mapa
            </button>
            <Button size="sm" onClick={() => setConfirmarEntrega(true)}>
              Entregar
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <main className="min-w-0 flex-1">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-brand-bright">
                {AREA_LABELS[pregunta.area as Area]}
              </p>
              <button
                type="button"
                onClick={() => void alternarMarca()}
                aria-pressed={pregunta.marcada}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright ${
                    pregunta.marcada
                      ? 'border-amber-300 bg-amber-50 text-amber-700'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
              >
                <Flag aria-hidden className="h-3.5 w-3.5" />
                {pregunta.marcada ? 'Marcada' : 'Marcar'}
              </button>
            </div>

            {pregunta.contexto ? (
              <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-wash/70 p-5 text-[14.5px] leading-[1.75] text-slate-700">
                {pregunta.contexto}
              </div>
            ) : null}

            {pregunta.tieneFigura ? (
              <div className="mt-5">
                <QuestionFigure itemId={pregunta.itemId} />
              </div>
            ) : null}

            <h2 className="mt-6 text-[17.5px] font-semibold leading-[1.55] text-slate-900">
              {pregunta.pregunta}
            </h2>

            {/* No verdict, no colour: which option is right does not
                exist on this screen, and will not until the sitting is
                graded. */}
            <ul className="mt-6 space-y-2.5">
              {(['A', 'B', 'C', 'D'] as AnswerKey[])
                .filter((letra) => pregunta.opciones[letra])
                .map((letra) => {
                  const elegida = pregunta.respuesta === letra;
                  return (
                    <li key={letra}>
                      <button
                        type="button"
                        onClick={() => void responder(letra)}
                        aria-pressed={elegida}
                        className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left text-[14.5px] transition-colors
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright ${
                            elegida
                              ? 'border-brand-bright bg-brand-soft/40 ring-2 ring-brand-bright/25'
                              : 'border-slate-200 bg-white hover:border-brand-bright/45 hover:bg-brand-soft/15'
                          }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                            elegida ? 'bg-brand-bright text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {letra}
                        </span>
                        <span className="flex-1 text-slate-800">{pregunta.opciones[letra]}</span>
                      </button>
                    </li>
                  );
                })}
            </ul>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setActual((i) => Math.max(0, i - 1))}
                disabled={actual === 0}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-[13.5px] font-semibold text-slate-600
                  hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
              >
                <ChevronLeft aria-hidden className="h-4 w-4" />
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setActual((i) => Math.min(preguntas.length - 1, i + 1))}
                disabled={actual === preguntas.length - 1}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-bright px-5 py-2 text-[13.5px] font-semibold text-white
                  transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:hover:scale-100
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright focus-visible:ring-offset-2"
              >
                Siguiente
                <ChevronRight aria-hidden className="h-4 w-4" />
              </button>
            </div>
          </article>

          {error ? (
            <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-[13.5px] text-rose-700">
              {error}
            </p>
          ) : null}
        </main>

        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5">
            <MapaPreguntas puntos={puntos} actual={actual} onIr={irA} />
          </div>
        </aside>
      </div>

      <Modal
        open={mapaAbierto}
        onOpenChange={setMapaAbierto}
        title="Mapa de preguntas"
        description="Toque cualquier número para ir a esa pregunta."
      >
        <MapaPreguntas puntos={puntos} actual={actual} onIr={irA} />
      </Modal>

      <Modal
        open={confirmarEntrega}
        onOpenChange={setConfirmarEntrega}
        title="¿Entregar el simulacro?"
        description={
          sinResponder > 0
            ? `Le quedan ${sinResponder} preguntas sin responder. Las no respondidas cuentan como malas, igual que en el examen real.`
            : 'Respondió todas. Al entregar verá su calificación y el informe por área.'
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmarEntrega(false)}>
              Seguir respondiendo
            </Button>
            <Button onClick={() => void entregar()} disabled={entregando}>
              {entregando ? 'Entregando…' : 'Entregar y ver resultados'}
            </Button>
          </>
        }
      />
    </div>
  );
}
