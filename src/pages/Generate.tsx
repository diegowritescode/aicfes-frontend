import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTest } from '@/context/TestContext';
import { generateMixedItems } from '@/services/api';
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
import { GraduationCap, Loader2, Zap, Gauge, Flame, Shuffle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GeneratorSkeleton } from '@/components/LoadingSkeleton';
import { Switch } from '@/components/ui/switch';

const AREAS: Area[] = ['MAT', 'LC', 'CN', 'SOC', 'ING'];
const DIFICULTADES: Dificultad[] = ['facil', 'media', 'alta'];
const MAX_ITEMS = 25;

type Section = {
  id: number;
  area: Area | '';
  dificultad: Dificultad | '';
  n: number;
  tema: string;
};

const createSection = (id: number): Section => ({
  id,
  area: '',
  dificultad: '',
  n: 5,
  tema: '',
});

export default function Generate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { startTest } = useTest();

  const sectionIdRef = useRef(1);
  const [sections, setSections] = useState<Section[]>([createSection(sectionIdRef.current)]);
  const [shuffle, setShuffle] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const elapsedIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
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

    if (areaParam || dificultadParam || temaParam || nParam) {
      sectionIdRef.current += 1;
      const next = createSection(sectionIdRef.current);
      if (areaParam && AREAS.includes(areaParam as Area)) {
        next.area = areaParam as Area;
      }
      if (dificultadParam && DIFICULTADES.includes(dificultadParam as Dificultad)) {
        next.dificultad = dificultadParam as Dificultad;
      }
      if (temaParam) {
        next.tema = temaParam;
      }
      if (nParam) {
        const parsed = parseInt(nParam, 10);
        if (!Number.isNaN(parsed)) {
          next.n = Math.min(MAX_ITEMS, Math.max(1, parsed));
        }
      }
      setSections([next]);
    }
  }, [searchParams]);

  const totalRequested = useMemo(
    () => sections.reduce((total, section) => total + (Number.isNaN(section.n) ? 0 : section.n), 0),
    [sections]
  );

  const validSections = useMemo(
    () =>
      sections.filter((section) =>
        Boolean(section.area && section.dificultad && section.n >= 1)
      ),
    [sections]
  );

  const updateSection = (id: number, patch: Partial<Section>) => {
    setSections((prev) => prev.map((section) => (section.id === id ? { ...section, ...patch } : section)));
  };

  const addSection = () => {
    sectionIdRef.current += 1;
    setSections((prev) => [...prev, createSection(sectionIdRef.current)]);
  };

  const removeSection = (id: number) => {
    setSections((prev) => (prev.length > 1 ? prev.filter((section) => section.id !== id) : prev));
  };

  const resetLoadingState = () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (validSections.length === 0) {
      setError({ code: 'INVALID_SECTIONS', message: 'Completa al menos una sección válida.' });
      return;
    }

    if (totalRequested > MAX_ITEMS) {
      setError({ code: 'MAX_ITEMS', message: `El máximo permitido es ${MAX_ITEMS} preguntas.` });
      return;
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);
    setElapsedSeconds(0);
    elapsedIntervalRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const payload = {
      sections: validSections.map((section) => ({
        area: section.area as Area,
        dificultad: section.dificultad as Dificultad,
        n: section.n,
        tema: section.tema.trim() || undefined,
      })),
      shuffle,
      session: {
        create: true,
        seedAreaSummary: true,
      },
    };

    try {
      const result = await generateMixedItems(payload, { signal });
      resetLoadingState();

      if (!result.success) {
        setError(result.error || { code: 'UNKNOWN', message: 'No se pudo generar la prueba.' });
        return;
      }

      if (result.items.length === 0) {
        setError({ code: 'EMPTY_RESPONSE', message: 'No se generaron preguntas. Intenta de nuevo.' });
        return;
      }

      startTest(result.items, null, {
        mode: 'generacion_libre',
        sessionId: result.sessionId || null,
      });
      navigate('/test');
    } catch (err) {
      resetLoadingState();
      setError({ code: 'NETWORK_ERROR', message: 'No se pudo conectar con el servidor. Intenta de nuevo.' });
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 lg:py-10">
        {/* Hero */}
        <div className="mb-8 flex flex-col gap-4">
          <Badge className="w-fit bg-primary/10 text-primary hover:bg-primary/20" variant="secondary">
            Generación mixta
          </Badge>
          <h1 className="text-3xl font-bold text-foreground lg:text-4xl">
            Arma tu prueba como un puzzle
          </h1>
          <p className="text-sm text-muted-foreground lg:text-base max-w-2xl">
            Combina areas y dificultades para crear una sesion unica. Tu decides el mix de preguntas.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-12">
          {isLoading ? (
            <div className="lg:col-span-2">
              <GeneratorSkeleton />
            </div>
          ) : (
            <Card className="shadow-lg lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Construir prueba
              </CardTitle>
              <CardDescription className="text-xs">
                Agrega secciones con area, dificultad y cantidad.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  {sections.map((section, index) => (
                    <div key={section.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-muted-foreground">
                          Seccion {index + 1}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeSection(section.id)}
                          disabled={sections.length === 1}
                        >
                          Quitar
                        </Button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-4">
                        <div>
                          <Label className="text-xs">Area</Label>
                          <Select
                            value={section.area}
                            onValueChange={(value) => updateSection(section.id, { area: value as Area })}
                            disabled={isLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona" />
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
                          <Label className="text-xs">Dificultad</Label>
                          <Select
                            value={section.dificultad}
                            onValueChange={(value) => updateSection(section.id, { dificultad: value as Dificultad })}
                            disabled={isLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona" />
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

                        <div>
                          <Label className="text-xs">Cantidad</Label>
                          <Input
                            className="text-sm"
                            type="number"
                            min={1}
                            max={MAX_ITEMS}
                            value={section.n}
                            onChange={(e) => updateSection(section.id, { n: Math.max(1, parseInt(e.target.value) || 1) })}
                            disabled={isLoading}
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Tema (opcional)</Label>
                          <Input
                            className="text-sm"
                            placeholder="Ej: Algebra"
                            value={section.tema}
                            onChange={(e) => updateSection(section.id, { tema: e.target.value })}
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button type="button" variant="outline" size="sm" onClick={addSection} disabled={isLoading}>
                    Agregar seccion
                  </Button>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    Total: {totalRequested} / {MAX_ITEMS}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Shuffle className="h-4 w-4 text-primary" />
                    Mezclar preguntas al final
                  </div>
                  <Switch checked={shuffle} onCheckedChange={setShuffle} />
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
                      <span className="font-medium">Generando preguntas...</span>
                    </div>
                    <p className="text-blue-700 text-xs">
                      Esto puede tardar un poco mientras la IA genera las preguntas. Por favor, espera.
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={handleCancel}
                    >
                      Cancelar generacion
                    </Button>
                  </div>
                )}

                <Button
                  type="submit"
                  size="sm"
                  className="w-full mt-2"
                  disabled={isLoading || validSections.length === 0 || totalRequested > MAX_ITEMS}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generando preguntas...
                    </>
                  ) : (
                    <>
                      <GraduationCap className="h-5 w-5 mr-2" />
                      Generar prueba
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          )}

          <div className="space-y-4">
            {isLoading ? (
              <Card className="border-blue-200 bg-blue-50/70">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generando tu prueba
                  </CardTitle>
                  <CardDescription className="text-xs text-blue-700">
                    Espera mientras se construye el mix de preguntas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-blue-700">
                    <span>Tiempo: {formatElapsed(elapsedSeconds)}</span>
                    <span>{Math.min(90, 5 + elapsedSeconds * 3)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-blue-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400 transition-all duration-500"
                      style={{ width: `${Math.min(90, 5 + elapsedSeconds * 3)}%` }}
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
                    <p>Arma combinaciones reales como en el examen.</p>
                    <p>Control total de dificultad y cantidad.</p>
                    <p>Resultados y explicaciones al instante.</p>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-primary" />
                      Reto sugerido
                    </CardTitle>
                    <CardDescription>Completa 3 secciones hoy.</CardDescription>
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
