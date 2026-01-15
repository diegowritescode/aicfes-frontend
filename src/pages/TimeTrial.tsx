import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ErrorAlert } from '@/components/ErrorAlert';
import { useNavigate } from 'react-router-dom';
import { useTest } from '@/context/TestContext';
import { Area, Dificultad, AREA_LABELS, DIFICULTAD_LABELS } from '@/types/icfes';
import { getTimeTrialModes, startTimeTrial, TimeTrialMode } from '@/services/api';
import { Flame, Gauge, Timer, Zap, Loader2 } from 'lucide-react';
import { TimeTrialModesSkeleton } from '@/components/LoadingSkeleton';

const AREAS: Area[] = ['MAT', 'LC', 'CN', 'SOC', 'ING'];
const DIFICULTADES: Dificultad[] = ['facil', 'media', 'alta'];

export default function TimeTrial() {
  const navigate = useNavigate();
  const { startTest, setStudySessionId } = useTest();

  const [modes, setModes] = useState<TimeTrialMode[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isLoadingModes, setIsLoadingModes] = useState(true);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);

  const [customArea, setCustomArea] = useState<Area | ''>('');
  const [customDifficulty, setCustomDifficulty] = useState<Dificultad | ''>('');
  const [customTime, setCustomTime] = useState(10);
  const [customQuestions, setCustomQuestions] = useState(10);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const result = await getTimeTrialModes();
      if (!isMounted) return;
      setIsLoadingModes(false);
      if (!result.success || !result.data) {
        setError(result.error || { message: 'No se pudieron cargar los retos.' });
        return;
      }
      setModes(result.data);
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStartMode = async (mode: TimeTrialMode) => {
    setError(null);
    setIsStarting(true);
    const result = await startTimeTrial({ modeId: mode.id });
    setIsStarting(false);
    if (!result.success || !result.data) {
      setError(result.error || { message: 'No se pudo iniciar contrarreloj.' });
      return;
    }
    setStudySessionId(result.data.sessionId);
    startTest(result.data.items, mode.area || null, {
      mode: 'contrarreloj',
      sessionId: result.data.sessionId,
      dificultad: mode.dificultad || null,
      timeLimitSeconds: result.data.timeLimitSeconds,
    });
    navigate('/test');
  };

  const handleStartCustom = async () => {
    if (!customArea || !customDifficulty) {
      setError({ message: 'Selecciona área y dificultad para tu contrarreloj.' });
      return;
    }
    setError(null);
    setIsStarting(true);
    const result = await startTimeTrial({
      custom: {
        area: customArea,
        dificultad: customDifficulty,
        timeLimitSeconds: Math.max(1, customTime) * 60,
        questions: Math.max(1, customQuestions),
      },
    });
    setIsStarting(false);
    if (!result.success || !result.data) {
      setError(result.error || { message: 'No se pudo iniciar contrarreloj.' });
      return;
    }
    setStudySessionId(result.data.sessionId);
    startTest(result.data.items, customArea, {
      mode: 'contrarreloj',
      sessionId: result.data.sessionId,
      dificultad: customDifficulty,
      timeLimitSeconds: result.data.timeLimitSeconds,
    });
    navigate('/test');
  };

  const customTimeLabel = useMemo(() => {
    return `${customTime} min`;
  }, [customTime]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 lg:py-10">
        <div className="mb-8 flex flex-col gap-4">
          <Badge className="w-fit bg-amber-500/10 text-amber-700 hover:bg-amber-500/20" variant="secondary">
            Modo Contrarreloj
          </Badge>
          <h1 className="text-3xl font-bold text-foreground lg:text-4xl">
            Entrena con presión real
          </h1>
          <p className="text-sm text-muted-foreground lg:text-base max-w-2xl">
            Elige un reto rápido o crea tu propio desafío con tiempo fijo.
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorAlert title="No pudimos iniciar" message={error.message} code={error.code} onRetry={() => setError(null)} />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-amber-600" />
                Retos predefinidos
              </CardTitle>
              <CardDescription>Modos listos para jugar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingModes ? (
                <TimeTrialModesSkeleton />
              ) : (
                modes.map((mode) => (
                  <div
                    key={mode.id}
                    className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{mode.title}</h3>
                      <p className="text-xs text-muted-foreground">{mode.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round(mode.timeLimitSeconds / 60)} min · {mode.questions} preguntas
                      </p>
                    </div>
                    <Button size="sm" onClick={() => handleStartMode(mode)} disabled={isStarting}>
                      {isStarting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Iniciando
                        </>
                      ) : (
                        'Iniciar'
                      )}
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-primary" />
                  Contrarreloj personalizado
                </CardTitle>
                <CardDescription>Configura tu propio reto.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Área</Label>
                  <Select value={customArea} onValueChange={(value) => setCustomArea(value as Area)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un área" />
                    </SelectTrigger>
                    <SelectContent>
                      {AREAS.map((area) => (
                        <SelectItem key={area} value={area}>
                          {AREA_LABELS[area]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dificultad</Label>
                  <Select value={customDifficulty} onValueChange={(value) => setCustomDifficulty(value as Dificultad)}>
                    <SelectTrigger>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                  <Label>Tiempo (min)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={customTime}
                    onChange={(event) => setCustomTime(parseInt(event.target.value) || 1)}
                  />
                    <p className="text-xs text-muted-foreground mt-1">{customTimeLabel}</p>
                  </div>
                  <div>
                    <Label>Preguntas</Label>
                    <Input
                      type="number"
                      min={1}
                      value={customQuestions}
                      onChange={(event) => setCustomQuestions(parseInt(event.target.value) || 1)}
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={handleStartCustom} disabled={isStarting}>
                  {isStarting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Iniciando
                    </>
                  ) : (
                    'Iniciar personalizado'
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-amber-600" />
                  Bonus de velocidad
                </CardTitle>
                <CardDescription>Responde rápido y preciso.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Ganas XP extra si terminas antes del límite con buena precisión.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
