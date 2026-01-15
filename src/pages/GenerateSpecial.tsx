import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTest } from '@/context/TestContext';
import { cancelRequest, generateItems, getRequestItems, getRequestStatus } from '@/services/api';
import { Area, Dificultad, AREA_LABELS, DIFICULTAD_LABELS } from '@/types/icfes';
import { Layout } from '@/components/Layout';
import { ErrorAlert } from '@/components/ErrorAlert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GraduationCap, Brain, Loader2, Zap, Gauge, Flame } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { GeneratorSkeleton } from '@/components/LoadingSkeleton';

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
          mode: 'generacion_libre',
        });
        navigate('/test');
        return;
      }

      if (normalized.includes('cancel')) {
        clearPolling();
        resetLoadingState();
        setProgress(0);
        setStatusText('Cancelado');
        setError({ code: 'CANCELLED', message: 'La generación fue cancelada.' });
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
          mode: 'generacion_libre',
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
      const message = err instanceof Error && err.name === 'CanceledError'
        ? 'La solicitud fue cancelada.'
        : 'No se pudo conectar con el servidor. Intenta de nuevo.';
      setError({ code: 'NETWORK_ERROR', message });
    }
  };

  const handleCancel = async () => {
    if (!requestId) return;
    clearPolling();
    clearProgressInterval();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const result = await cancelRequest(requestId);
    resetLoadingState();
    setProgress(0);
    if (!result.success) {
      setError(result.error || { code: 'CANCEL_ERROR', message: 'No se pudo cancelar la generación.' });
      return;
    }
    setStatusText('Cancelado');
    setError({ code: 'CANCELLED', message: 'La generación fue cancelada.' });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 lg:py-10">
        {/* Hero */}
        <div className="mb-8 flex flex-col gap-4">
          <Badge className="w-fit bg-primary/10 text-primary hover:bg-primary/20" variant="secondary">
            Generación especializada
          </Badge>
          <h1 className="text-3xl font-bold text-foreground lg:text-4xl">
            Enfócate en un solo componente
          </h1>
          <p className="text-sm text-muted-foreground lg:text-base max-w-2xl">
            Ideal para reforzar una sola área con profundidad y dificultad controlada.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3 mb-12">
          {/* Generator Form */}
          {isLoading ? (
            <div className="lg:col-span-2">
              <GeneratorSkeleton />
            </div>
          ) : (
            <Card className="shadow-lg lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Generar
              </CardTitle>
              <CardDescription className="text-xs">
                Crear tu sesión
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="area" className="text-xs">Área</Label>
                    <Select
                      value={area}
                      onValueChange={(v) => setArea(v as Area)}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="area">
                        <SelectValue placeholder="Selecciona un área" />
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
                    <Label htmlFor="dificultad" className="text-xs">Dificultad</Label>
                    <Select
                      value={dificultad}
                      onValueChange={(v) => setDificultad(v as Dificultad)}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="dificultad">
                        <SelectValue placeholder="Selecciona dificultad" />
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
                </div>

                <div className="space-y-1">
                  <Label htmlFor="tema" className="text-xs">Tema (opcional)</Label>
                  <Input
                    className="text-sm"
                    id="tema"
                    placeholder="Ej: Álgebra, Revolución Francesa, Mitosis..."
                    value={tema}
                    onChange={(e) => setTema(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cantidad" className="text-xs">Preguntas (1-20)</Label>
                  <Input
                    className="text-sm"
                    id="cantidad"
                    type="number"
                    min={1}
                    max={20}
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <ErrorAlert
                    title="Error al generar"
                    message={error.message}
                    code={error.code}
                    onRetry={() => setError(null)}
                  />
                )}

                {isLoading && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="font-medium">
                        {statusText ? `Generando preguntas · ${statusText}` : 'Generando preguntas...'}
                      </span>
                    </div>
                    <p className="text-blue-700 text-xs">
                      Esto puede tardar un poco mientras la IA genera las preguntas. Por favor, espera.
                    </p>
                    {requestId && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={handleCancel}
                      >
                        Cancelar generación
                      </Button>
                    )}
                  </div>
                )}

                {progress > 0 && (
                  <div className="mt-3">
                    <Progress value={progress} className="h-2" />
                    {requestId && (
                      <p className="text-xs text-muted-foreground mt-2">RequestId: <strong>{requestId}</strong></p>
                    )}
                    {statusText && (
                      <p className="text-xs text-muted-foreground mt-1">Estado: {statusText}</p>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  size="sm"
                  className="w-full mt-2"
                  disabled={!area || !dificultad || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generando preguntas...
                    </>
                  ) : (
                    <>
                      <Brain className="h-5 w-5 mr-2" />
                      Generar Preguntas
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          )}

          {/* Side Info */}
          <div className="space-y-4">
            {isLoading ? (
              <Card className="border-blue-200 bg-blue-50/70">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generando preguntas
                  </CardTitle>
                  <CardDescription className="text-xs text-blue-700">
                    {statusText ? `Estado: ${statusText}` : 'La IA está trabajando en tu sesión.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-blue-700">
                    <span>Tiempo: {formatElapsed(elapsedSeconds)}</span>
                    <span>{Math.max(5, progress)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-blue-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400 transition-all duration-500"
                      style={{ width: `${Math.max(5, progress)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gauge className="h-5 w-5 text-primary" />
                      Beneficios
                    </CardTitle>
                    <CardDescription>Sesiones rápidas y enfocadas.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>Genera preguntas sin distracciones.</p>
                    <p>Enfoque por tema y dificultad.</p>
                    <p>Retroalimentación al instante.</p>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-primary" />
                      Reto sugerido
                    </CardTitle>
                    <CardDescription>Completa 3 sesiones hoy.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Gana +80 XP y sube tu racha semanal.
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
