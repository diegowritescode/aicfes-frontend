import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTest } from '@/context/TestContext';
import { cancelRequest, generateItems, getRequestItems, getRequestStatus } from '@/services/api';
import { Area, Dificultad, IcfesItem, AREA_LABELS, DIFICULTAD_LABELS } from '@/types/icfes';
import { Layout } from '@/components/Layout';
import { ErrorAlert } from '@/components/ErrorAlert';
import { QuestionCard } from '@/components/QuestionCard';
import { AnswerOption } from '@/components/AnswerOption';
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
import { Sparkles, BookOpen, GraduationCap, Brain, Loader2, ArrowRight, Zap, TrendingUp, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const AREAS: Area[] = ['MAT', 'LC', 'CN', 'SOC', 'ING'];
const DIFICULTADES: Dificultad[] = ['facil', 'media', 'alta'];

export default function Generate() {
  const navigate = useNavigate();
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
  const [previewItem, setPreviewItem] = useState<IcfesItem | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const progressIntervalRef = useRef<number | null>(null);
  const pollTimeoutRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasRealProgressRef = useRef(false);

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
    };
  }, []);

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
        if (cantidad === 1) {
          setPreviewItem(itemsResult.items[0]);
          setShowPreview(true);
        } else {
          startTest(itemsResult.items, area as Area);
          navigate('/test');
        }
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
    let progressVal = 5;
    progressIntervalRef.current = window.setInterval(() => {
      if (hasRealProgressRef.current) return;
      progressVal = Math.min(92, progressVal + Math.random() * 6);
      setProgress(Math.round(progressVal));
    }, 800);

    setError(null);
    setShowPreview(false);

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

        if (cantidad === 1) {
          // Preview single question
          setPreviewItem(result.items[0]);
          setShowPreview(true);
        } else {
          // Start test with multiple questions
          startTest(result.items, area);
          navigate('/test');
        }
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

  const handleStartTestWithPreview = () => {
    if (previewItem && area) {
      startTest([previewItem], area as Area);
      navigate('/test');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 lg:py-10">
        {/* Hero Section - Compact */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-3">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Generador de Preguntas ICFES
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Prepárate con preguntas tipo Saber 11 generadas por IA. Retroalimentación inmediata y explicaciones detalladas.
          </p>
        </div>

        {/* Main Content - Improved Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          {/* Generator Form - Compact */}
          <Card className="shadow-lg lg:col-span-1">
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

          {/* Areas Grid + Info */}
          <div className="lg:col-span-2 space-y-6">
            {showPreview && previewItem ? (
              <div className="space-y-3 animate-slide-up col-span-full lg:col-span-2">
                <QuestionCard item={previewItem} questionNumber={1} totalQuestions={1} />
                <div className="space-y-3">
                  {(['A', 'B', 'C', 'D'] as const).map((key) => (
                    <AnswerOption
                      key={key}
                      optionKey={key}
                      text={previewItem.opciones[key]}
                      isSelected={false}
                      isDisabled
                      onClick={() => {}}
                    />
                  ))}
                </div>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleStartTestWithPreview}
                >
                  Comenzar Prueba
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <>
                {/* Areas Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'MAT', label: 'Matemáticas', color: 'from-blue-500 to-blue-600', icon: '📐' },
                    { id: 'LC', label: 'Lectura', color: 'from-purple-500 to-purple-600', icon: '📖' },
                    { id: 'CN', label: 'Ciencias', color: 'from-green-500 to-green-600', icon: '🧪' },
                    { id: 'SOC', label: 'Sociales', color: 'from-amber-500 to-amber-600', icon: '🌍' },
                    { id: 'ING', label: 'Inglés', color: 'from-red-500 to-red-600', icon: '🗣️' },
                  ].map((a) => (
                    <div
                      key={a.id}
                      onClick={() => setArea(a.id as Area)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        area === a.id
                          ? `bg-gradient-to-br ${a.color} text-white shadow-lg scale-105`
                          : 'bg-card border border-border hover:border-primary/50 hover:shadow-md'
                      }`}
                    >
                      <div className="text-2xl mb-1">{a.icon}</div>
                      <p className="text-xs font-semibold">{a.label}</p>
                    </div>
                  ))}
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200/30">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <Brain className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-sm mb-1">IA Avanzada</h4>
                          <p className="text-xs text-muted-foreground">Preguntas con GPT-5 modelo ICFES</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200/30">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Análisis Real</h4>
                          <p className="text-xs text-muted-foreground">Explica cada error al instante</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-200/30">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Flexible</h4>
                          <p className="text-xs text-muted-foreground">Practica a tu propio ritmo</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <Card className="bg-muted/40">
                    <CardContent className="p-2 text-center">
                      <p className="text-2xl font-bold text-primary">5</p>
                      <p className="text-xs text-muted-foreground">Áreas</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/40">
                    <CardContent className="p-2 text-center">
                      <p className="text-2xl font-bold text-success">∞</p>
                      <p className="text-xs text-muted-foreground">Preguntas</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/40">
                    <CardContent className="p-2 text-center">
                      <p className="text-2xl font-bold text-blue-600">🎯</p>
                      <p className="text-xs text-muted-foreground">Precisión</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Tips Section */}
                <Card className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-200/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                      Maximiza tu Preparación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-2">
                    <div className="flex gap-2">
                      <span className="font-bold text-indigo-600">1.</span>
                      <p className="text-muted-foreground">Comienza con dificultad fácil para ganar confianza</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-indigo-600">2.</span>
                      <p className="text-muted-foreground">Estudia las explicaciones detalladas de cada error</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-indigo-600">3.</span>
                      <p className="text-muted-foreground">Practica 5-10 preguntas diarias para mejor retención</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-indigo-600">4.</span>
                      <p className="text-muted-foreground">Repite áreas débiles hasta dominarlas</p>
                    </div>
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
