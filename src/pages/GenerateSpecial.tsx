import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTest } from '@/context/TestContext';
import { cancelRequest, generateItems, getRequestItems, getRequestStatus } from '@/services/api';
import { Area, Dificultad, AREA_LABELS, DIFICULTAD_LABELS } from '@/types/icfes';
import { Layout } from '@/components/Layout';
import { ErrorAlert } from '@/components/ErrorAlert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const AREAS: Area[] = ['MAT', 'LC', 'CN', 'SOC', 'ING'];
const DIFICULTADES: Dificultad[] = ['facil', 'media', 'alta'];

export default function GenerateSpecial() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { startTest } = useTest();

  const [area, setArea] = useState<Area | ''>('');
  const [dificultad, setDificultad] = useState<Dificultad | ''>('');
  const [tema, setTema] = useState('');
  const [cantidad, setCantidad] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [requestId, setRequestId] = useState<string | undefined>(undefined);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [cancelado, setCancelado] = useState(false);
  const [progresoReal, setProgresoReal] = useState(false);

  const progressIntervalRef = useRef<number | null>(null);
  const pollTimeoutRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasRealProgressRef = useRef(false);
  const elapsedIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const areaParam = searchParams.get('area');
    const dificultadParam = searchParams.get('dificultad');
    const temaParam = searchParams.get('tema');
    const nParam = searchParams.get('n');

    if (areaParam && AREAS.includes(areaParam as Area)) {
      setArea(areaParam as Area);
    }
    if (dificultadParam && DIFICULTADES.includes(dificultadParam as Dificultad)) {
      setDificultad(dificultadParam as Dificultad);
    }
    if (temaParam) {
      setTema(temaParam);
    }
    if (nParam) {
      const parsed = parseInt(nParam, 10);
      if (!Number.isNaN(parsed)) {
        setCantidad(Math.min(20, Math.max(1, parsed)));
      }
    }
  }, [searchParams]);

  const clearProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const clearPolling = () => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  };

  const resetLoadingState = () => {
    clearProgressInterval();
    clearPolling();
    hasRealProgressRef.current = false;
    setProgresoReal(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setElapsedSeconds(0);
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
  };

  const formatElapsed = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const normalizeStatusLabel = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized.includes('queue') || normalized.includes('pending')) return 'En cola';
    if (normalized.includes('process') || normalized.includes('running')) return 'Procesando';
    if (normalized.includes('complete') || normalized.includes('done')) return 'Completado';
    if (normalized.includes('cancel')) return 'Cancelado';
    if (normalized.includes('fail') || normalized.includes('error')) return 'Fallido';
    return 'Generando';
  };

  const startPolling = async (id: string, signal: AbortSignal) => {
    const poll = async () => {
      const statusResult = await getRequestStatus(id, { signal });
      if (!statusResult.success) {
        clearPolling();
        resetLoadingState();
        setProgress(0);
        setError(statusResult.error || { code: 'STATUS_ERROR', message: 'Error al consultar estado' });
        return;
      }

      setStatusText(normalizeStatusLabel(statusResult.status));
      if (typeof statusResult.progress === 'number') {
        hasRealProgressRef.current = true;
        setProgresoReal(true);
        clearProgressInterval();
        const bounded = Math.min(99, Math.max(5, Math.round(statusResult.progress)));
        setProgress(bounded);
      }

      const normalized = statusResult.status.toLowerCase();
      if (normalized.includes('complete')) {
        clearPolling();
        const itemsResult = await getRequestItems(id, { signal });
        if (!itemsResult.success) {
          resetLoadingState();
          setProgress(0);
          setError(itemsResult.error || { code: 'REQUEST_ERROR', message: 'No se pudo obtener las preguntas' });
          return;
        }
        setProgress(100);
        setTimeout(() => setProgress(0), 600);
        resetLoadingState();
        if (itemsResult.items.length === 0) {
          setError({ code: 'EMPTY_RESPONSE', message: 'No se generaron preguntas. Intenta de nuevo.' });
          return;
        }
        startTest(itemsResult.items, area as Area, {
          dificultad: (dificultad || null) as Dificultad | null,
          tema: tema.trim() || null,
          mode: 'test',
        });
        navigate('/test');
        return;
      }

      if (normalized.includes('cancel')) {
        clearPolling();
        resetLoadingState();
        setProgress(0);
        setStatusText(null);
        setCancelado(true);
        return;
      }

      if (normalized.includes('fail') || normalized.includes('error')) {
        clearPolling();
        resetLoadingState();
        setProgress(0);
        setError(statusResult.error || { code: 'FAILED', message: 'La generación falló.' });
        return;
      }

      pollTimeoutRef.current = window.setTimeout(poll, 1500);
    };

    pollTimeoutRef.current = window.setTimeout(poll, 1200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!area || !dificultad) return;

    resetLoadingState();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);
    setRequestId(undefined);
    setStatusText(null);
    setCancelado(false);
    setProgress(5);
    setElapsedSeconds(0);
    elapsedIntervalRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    let progressVal = 5;
    progressIntervalRef.current = window.setInterval(() => {
      if (hasRealProgressRef.current) return;
      progressVal = Math.min(92, progressVal + Math.random() * 6);
      setProgress(Math.round(progressVal));
    }, 800);

    setError(null);

    try {
      const result = await generateItems({
        area,
        dificultad,
        tema: tema.trim() || undefined,
        n: cantidad,
      }, { signal });

      setRequestId(result.requestId);

      if (!result.success && !result.requestId) {
        resetLoadingState();
        setProgress(0);
        setError(result.error || { code: 'UNKNOWN', message: 'Error desconocido' });
        return;
      }

      if (result.items.length > 0) {
        clearProgressInterval();
        setProgress(100);
        setTimeout(() => setProgress(0), 600);
        resetLoadingState();

        // Start test immediately (even for 1 question)
      startTest(result.items, area, {
        dificultad: (dificultad || null) as Dificultad | null,
        tema: tema.trim() || null,
        mode: 'test',
      });
        navigate('/test');
        return;
      }

      if (result.requestId) {
        setStatusText('En cola');
        await startPolling(result.requestId, signal);
      } else {
        resetLoadingState();
        setProgress(0);
        setError({ code: 'EMPTY_RESPONSE', message: 'No se generaron preguntas. Intenta de nuevo.' });
      }
    } catch (err) {
      clearProgressInterval();
      clearPolling();
      setProgress(0);
      setIsLoading(false);
      if (err instanceof Error && err.name === 'CanceledError') {
        setCancelado(true);
        return;
      }
      setError({
        code: 'NETWORK_ERROR',
        message: 'No pudimos conectar con el servidor. Revise su conexión e intente otra vez.',
      });
    }
  };

  const handleCancel = async () => {
    clearPolling();
    clearProgressInterval();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    /* Only the server side needs a request id. Aborting locally works
       from the first second, which is when someone who changed their
       mind actually presses this. */
    const pendiente = requestId;
    resetLoadingState();
    setProgress(0);
    setStatusText(null);
    setCancelado(true);

    if (!pendiente) return;
    const result = await cancelRequest(pendiente);
    if (!result.success) {
      setError(result.error || { code: 'CANCEL_ERROR', message: 'No se pudo cancelar la generación.' });
    }
  };


  const listo = Boolean(area && dificultad);

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-8 lg:py-10">
        <header className="mb-7">
          <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-slate-900">
            Practicar un tema a fondo
          </h1>
          <p className="mt-1.5 text-[14.5px] leading-relaxed text-slate-600">
            Una sola área y un solo tema, con preguntas escritas para usted. Si quiere
            mezclar varias áreas, use la práctica mixta.
          </p>
        </header>

        {isLoading ? (
          <section
            aria-live="polite"
            className="rounded-3xl border border-brand-soft bg-gradient-to-br from-wash/80 to-white p-8 text-center"
          >
            <Loader2 aria-hidden className="mx-auto h-7 w-7 animate-spin text-brand-bright" />
            <h2 className="mt-4 text-[17px] font-bold text-slate-900">
              Estamos escribiendo sus preguntas
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-slate-600">
              Cada pregunta se escribe y se revisa una por una. No cierre esta pestaña.
            </p>

            <div className="mx-auto mt-6 max-w-sm">
              <div className="mb-2 flex items-baseline justify-between text-[12.5px] font-semibold text-slate-500">
                <span>
                  {statusText ?? 'Preparando'}
                  {/* The bar runs on a guess until the server reports
                      real progress, and saying which is which keeps the
                      number honest. */}
                  {!progresoReal ? ' (estimado)' : ''}
                </span>
                <span className="font-mono tabular-nums">{formatElapsed(elapsedSeconds)}</span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Avance de la generación"
                className="h-2 overflow-hidden rounded-full bg-slate-100"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-bright to-cyan transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancel}
              className="mt-7 rounded-full border border-slate-300 px-6 py-2.5 text-[14px] font-semibold text-slate-700
                transition-colors hover:bg-slate-50
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
            >
              Cancelar
            </button>
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <fieldset className="rounded-2xl border border-slate-200 bg-white p-6">
              <legend className="text-[13px] font-bold text-slate-900">
                Qué quiere practicar
              </legend>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="gs-area" className="text-[13px] font-medium text-slate-700">
                    Área
                  </Label>
                  <Select value={area} onValueChange={(value) => setArea(value as Area)}>
                    <SelectTrigger id="gs-area" className="mt-1.5">
                      <SelectValue placeholder="Elija un área" />
                    </SelectTrigger>
                    <SelectContent>
                      {AREAS.map((a) => (
                        <SelectItem key={a} value={a}>
                          {AREA_LABELS[a]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="gs-dif" className="text-[13px] font-medium text-slate-700">
                    Qué tan difícil
                  </Label>
                  <Select
                    value={dificultad}
                    onValueChange={(value) => setDificultad(value as Dificultad)}
                  >
                    <SelectTrigger id="gs-dif" className="mt-1.5">
                      <SelectValue placeholder="Elija el nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFICULTADES.map((d) => (
                        <SelectItem key={d} value={d}>
                          {DIFICULTAD_LABELS[d]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="gs-tema" className="text-[13px] font-medium text-slate-700">
                    Tema <span className="font-normal text-slate-400">(opcional)</span>
                  </Label>
                  <Input
                    id="gs-tema"
                    className="mt-1.5"
                    placeholder="Por ejemplo: funciones cuadráticas"
                    value={tema}
                    onChange={(e) => setTema(e.target.value)}
                  />
                  <p className="mt-1.5 text-[12px] text-slate-500">
                    Mientras más concreto el tema, más parecidas entre sí serán las preguntas
                  </p>
                </div>

                <div>
                  <Label htmlFor="gs-n" className="text-[13px] font-medium text-slate-700">
                    Cuántas preguntas
                  </Label>
                  <Input
                    id="gs-n"
                    className="mt-1.5"
                    type="number"
                    min={1}
                    max={20}
                    value={cantidad}
                    onChange={(e) =>
                      setCantidad(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))
                    }
                  />
                  <p className="mt-1.5 text-[12px] text-slate-500">Hasta 20</p>
                </div>
              </div>
            </fieldset>

            {/* Cancelling is something the learner chose. It used to
                come back as a red error alert telling them off for it. */}
            {cancelado ? (
              <p
                role="status"
                className="rounded-2xl bg-slate-100 px-5 py-3.5 text-[13.5px] text-slate-600"
              >
                Cancelamos la generación. Puede cambiar lo que quiera y empezar otra vez.
              </p>
            ) : null}

            {error ? (
              <ErrorAlert
                title="No pudimos armar la práctica"
                message={error.message}
                code={error.code}
                onRetry={() => setError(null)}
              />
            ) : null}

            <button
              type="submit"
              disabled={!listo}
              className="w-full rounded-full bg-brand-bright px-7 py-3.5 text-[15px] font-semibold text-white
                shadow-[0_6px_20px_-6px_hsl(var(--brand-bright))] transition-transform hover:scale-[1.01]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright focus-visible:ring-offset-2
                disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:hover:scale-100"
            >
              {!listo
                ? 'Elija un área y un nivel para empezar'
                : `Empezar con ${cantidad} ${cantidad === 1 ? 'pregunta' : 'preguntas'}`}
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
}
