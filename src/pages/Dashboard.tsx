import { useEffect, useMemo, useRef, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Award,
  Clock,
  Flame,
  Sparkles,
  Target,
  Timer,
  Zap,
  BookOpen,
  Trophy,
  Shuffle,
} from 'lucide-react';
import { ErrorAlert } from '@/components/ErrorAlert';
import { DashboardSkeleton } from '@/components/LoadingSkeleton';
import { DashboardData, getDashboard } from '@/services/api';
import { AREA_LABELS, Area } from '@/types/icfes';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<'live' | 'reconnecting' | 'offline'>('offline');
  const sseRef = useRef<EventSource | null>(null);
  const pollRef = useRef<number | null>(null);
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    let isMounted = true;

    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const startPolling = () => {
      if (pollRef.current) return;
      setRealtimeStatus('offline');
      pollRef.current = window.setInterval(async () => {
        const result = await getDashboard();
        if (!isMounted) return;
        if (result.success && result.data) {
          setError(null);
          setData(result.data);
          setIsLoading(false);
        }
      }, 20000);
    };

    const loadOnce = async () => {
      setIsLoading(true);
      const result = await getDashboard();
      if (!isMounted) return;
      if (!result.success || !result.data) {
        setError(result.error || { message: 'No se pudo cargar el dashboard.' });
        setIsLoading(false);
        return;
      }
      setError(null);
      setData(result.data);
      setIsLoading(false);
    };

    const startStream = () => {
      setRealtimeStatus('reconnecting');
      const stream = new EventSource(`${apiBaseUrl}/api/dashboard/stream`, { withCredentials: true });
      sseRef.current = stream;

      stream.addEventListener('open', () => {
        setRealtimeStatus('live');
      });

      stream.addEventListener('dashboard:init', (event) => {
        const payload = JSON.parse(event.data) as DashboardData;
        setData(payload);
        setError(null);
        setIsLoading(false);
        setRealtimeStatus('live');
      });

      stream.addEventListener('dashboard:update', (event) => {
        const payload = JSON.parse(event.data) as { data?: DashboardData };
        if (payload.data) {
          setData(payload.data);
          setError(null);
          setIsLoading(false);
          setRealtimeStatus('live');
        }
      });

      stream.addEventListener('error', () => {
        if (!isMounted) return;
        setRealtimeStatus('reconnecting');
        stream.close();
        sseRef.current = null;
        startPolling();
      });
    };

    loadOnce();
    startStream();

    return () => {
      isMounted = false;
      stopPolling();
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [apiBaseUrl]);

  const areaProgress = useMemo(() => {
    if (!data) return [];
    const colorMap: Record<string, string> = {
      MAT: 'bg-blue-500',
      LC: 'bg-purple-500',
      CN: 'bg-green-500',
      SOC: 'bg-amber-500',
      ING: 'bg-red-500',
    };
    return data.areaProgress.map((item) => ({
      ...item,
      label: AREA_LABELS[item.area as Area] || item.area,
      color: colorMap[item.area] || 'bg-primary',
    }));
  }, [data]);

  const weekTimeLabel = useMemo(() => {
    if (!data) return '';
    const hours = Math.floor(data.timeStudied.weekMinutes / 60);
    const minutes = data.timeStudied.weekMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, [data]);

  const lastSessionLabel = useMemo(() => {
    if (!data?.timeStudied.lastSessionAt) return 'Sin sesiones recientes';
    const date = new Date(data.timeStudied.lastSessionAt);
    if (Number.isNaN(date.getTime())) return 'Sin sesiones recientes';
    return date.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  }, [data]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10">
          <DashboardSkeleton />
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10">
          <ErrorAlert
            title="No pudimos cargar tu dashboard"
            message={error?.message || 'Intenta de nuevo en unos segundos.'}
            code={error?.code}
            onRetry={() => window.location.reload()}
          />
        </div>
      </Layout>
    );
  }

  const xpProgress = Math.min(
    100,
    Math.round((data.level.currentXp / Math.max(1, data.level.nextLevelXp)) * 100)
  );

  const statusLabel = (status: 'active' | 'recommended') =>
    status === 'active' ? 'Activo' : 'Recomendado';

  const getMissionAction = (mission: DashboardData['missions']['items'][number]) => {
    const title = mission.title.toLowerCase();
    if (mission.id.includes('time_trial') || title.includes('contrarreloj')) {
      return { label: 'Ir a contrarreloj', to: '/contrarreloj' };
    }
    if (mission.id.includes('questions_mat') || title.includes('matemat')) {
      return { label: 'Practicar Matemáticas', to: '/generacion-especializada?area=MAT&n=5' };
    }
    if (mission.id.includes('review') || title.includes('explicac') || title.includes('analizar')) {
      return { label: 'Ver resultados', to: '/results' };
    }
    if (mission.id.includes('sessions') || title.includes('sesion')) {
      return { label: 'Crear sesión', to: '/generacion-especializada' };
    }
    return { label: 'Practicar ahora', to: '/generacion-especializada' };
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 lg:py-10">
        {/* Hero */}
        <div className="mb-8 rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-blue-500/10 p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Tablero de progreso
              </div>
              <h1 className="mt-3 text-3xl font-bold text-foreground lg:text-4xl">
                Tu ruta ICFES en modo juego
              </h1>
              <p className="mt-2 text-sm text-muted-foreground lg:text-base">
                Sube de nivel con práctica diaria, desafíos contrarreloj y generación libre de preguntas.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Badge
                  variant={realtimeStatus === 'live' ? 'default' : 'secondary'}
                  className={realtimeStatus === 'live' ? 'bg-success/20 text-success' : ''}
                >
                  {realtimeStatus === 'live'
                    ? 'En vivo'
                    : realtimeStatus === 'reconnecting'
                      ? 'Reconectando'
                      : 'Sin conexión'}
                </Badge>
                <span>Actualización en tiempo real</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/generacion-especializada">
                <Button size="lg" className="gap-2">
                  <Zap className="h-4 w-4" />
                  Generación especializada
                </Button>
              </Link>
              <Link to="/generacion-mixta">
                <Button size="lg" variant="outline" className="gap-2">
                  <Shuffle className="h-4 w-4" />
                  Generación mixta
                </Button>
              </Link>
              <Link to="/contrarreloj">
                <Button size="lg" variant="outline" className="gap-2">
                  <Timer className="h-4 w-4" />
                  Contrarreloj
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Racha activa</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                {data.streak.currentDays} días
                <Flame className="h-5 w-5 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Mantén {data.streak.nextMilestoneDays} días para el próximo hito.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Nivel actual</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                Nivel {data.level.level}
                <Award className="h-5 w-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                {data.level.currentXp} / {data.level.nextLevelXp} XP para subir.
              </p>
              <Progress value={xpProgress} className="h-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tiempo estudiado</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                {weekTimeLabel}
                <Clock className="h-5 w-5 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Última sesión: {lastSessionLabel}.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Misiones completas</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                {data.missions.completed} / {data.missions.total}
                <Target className="h-5 w-5 text-success" />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Completa las misiones diarias para ganar XP.
            </CardContent>
          </Card>
        </div>

        {/* Progress + Missions */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Progreso por área
              </CardTitle>
              <CardDescription>Tu avance semanal en cada componente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {areaProgress.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="text-muted-foreground">{item.accuracy}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.accuracy}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Misiones de hoy
              </CardTitle>
              <CardDescription>Completa todas para subir XP.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.missions.items.map((mission) => {
                const action = getMissionAction(mission);
                return (
                <div
                  key={mission.id}
                  className={`flex flex-col gap-2 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between ${
                    mission.status === 'done'
                      ? 'border-success/30 bg-success/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <div>
                    <span className={mission.status === 'done' ? 'text-foreground' : 'text-muted-foreground'}>
                      {mission.title}
                    </span>
                    <p className="text-xs text-muted-foreground">+{mission.xpReward} XP</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Badge
                      variant={mission.status === 'done' ? 'default' : 'secondary'}
                      className={mission.status === 'done' ? 'bg-success/20 text-success' : ''}
                    >
                      {mission.status === 'done' ? 'Hecha' : 'Pendiente'}
                    </Badge>
                    {mission.status !== 'done' && (
                      <Link to={action.to} className="w-full sm:w-auto">
                        <Button size="sm" variant="outline" className="w-full sm:w-auto">
                          {action.label}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )})}
              <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">{data.suggestedChallenge.title}</p>
                <p className="mt-1">{data.suggestedChallenge.description}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Callouts */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Generación especializada
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={data.modeCards.generacion_libre.status === 'active' ? 'default' : 'secondary'}>
                  {statusLabel(data.modeCards.generacion_libre.status)}
                </Badge>
                <CardDescription>{data.modeCards.generacion_libre.recommendation}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Sesiones esta semana: {data.modeCards.generacion_libre.sessionsThisWeek}
              </p>
              <Link to="/generacion-especializada">
                <Button size="sm" className="gap-2">
                  Ir a especializada
                  <Zap className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="h-5 w-5 text-blue-600" />
                Generación mixta
              </CardTitle>
              <CardDescription>Combina áreas y dificultades en una sola prueba.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Arma un mix realista como en el examen.
              </p>
              <Link to="/generacion-mixta">
                <Button size="sm" variant="outline" className="gap-2">
                  Ir a mixta
                  <Shuffle className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-amber-600" />
                Contrarreloj
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={data.modeCards.contrarreloj.status === 'active' ? 'default' : 'secondary'}>
                  {statusLabel(data.modeCards.contrarreloj.status)}
                </Badge>
                <CardDescription>{data.modeCards.contrarreloj.recommendation}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Sesiones esta semana: {data.modeCards.contrarreloj.sessionsThisWeek}
              </p>
              <Link to="/contrarreloj">
                <Button size="sm" variant="outline" className="gap-2">
                  Iniciar contrarreloj
                  <Timer className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
