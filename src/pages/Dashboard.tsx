import { useEffect, useMemo, useRef, useState } from 'react';
import { Layout } from '@/components/Layout';
import {
  EmptyState,
  ModeCard,
  PageHeader,
  ProgressRow,
  Section,
  StatCard,
} from '@/components/ui-kit';
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
import { API_BASE_URL, DashboardData, getDashboard } from '@/services/api';
import { AREA_LABELS, Area } from '@/types/icfes';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<'live' | 'reconnecting' | 'offline'>('offline');
  const sseRef = useRef<EventSource | null>(null);
  const pollRef = useRef<number | null>(null);

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
      const stream = new EventSource(`${API_BASE_URL}/api/dashboard/stream`, { withCredentials: true });
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
  }, []);

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

  // A learner with no sessions yet. The board used to meet them with
  // five zeroes and nothing to press; the first thing they need is a
  // first step, not a report on an empty history.
  const sinDatos =
    !data || (data.timeStudied.weekMinutes === 0 && data.streak.currentDays === 0);

  const porEmpezar = [...areaProgress].sort((a, b) => a.accuracy - b.accuracy)[0];

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-5 py-8">
        {error ? <ErrorAlert error={error} className="mb-6" /> : null}

        <PageHeader
          titulo={sinDatos ? 'Empecemos' : 'Tu progreso'}
          descripcion={
            sinDatos
              ? 'Veinte minutos hoy valen más que seis horas el domingo.'
              : porEmpezar
                ? `Lo que más te conviene practicar hoy: ${porEmpezar.label}.`
                : undefined
          }
          // One primary action. The old header offered six, and a
          // learner could not tell which one was the next step.
          accion={{
            texto: sinDatos ? 'Hacer mi primer diagnóstico' : 'Practicar ahora',
            to: '/generacion-especializada',
          }}
        >
          {realtimeStatus === 'live' ? (
            <span className="hidden items-center gap-1.5 text-[12.5px] text-slate-500 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" />
              En vivo
            </span>
          ) : null}
        </PageHeader>

        {sinDatos ? (
          <EmptyState
            titulo="Todavía no hay nada que medir"
            descripcion="Haz una sesión corta y aquí aparecerá tu racha, tu nivel y en qué área estás más flojo."
            accion={{ texto: 'Empezar una sesión', to: '/generacion-especializada' }}
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                etiqueta="Racha"
                valor={data.streak.currentDays}
                unidad={data.streak.currentDays === 1 ? 'día' : 'días'}
                nota={
                  data.streak.currentDays === 0
                    ? 'Entra hoy para empezarla.'
                    : `Tu mejor racha: ${data.streak.longestDays} días.`
                }
                acento="amber"
              />
              <StatCard
                etiqueta="Nivel"
                valor={data.level.level}
                nota={`${data.level.currentXp} de ${data.level.nextLevelXp} XP para el siguiente.`}
              />
              <StatCard
                etiqueta="Esta semana"
                valor={weekTimeLabel}
                nota={`Última sesión: ${lastSessionLabel}.`}
                acento="cyan"
              />
              <StatCard
                etiqueta="Misiones"
                valor={`${data.missions.completed}/${data.missions.total}`}
                nota="Metas cortas para los días sin ganas."
                acento="lime"
              />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <Section
                titulo="Cómo vas por área"
                descripcion="Ordenado de lo más flojo a lo más fuerte: por ahí conviene empezar."
              >
                <div className="space-y-5">
                  {[...areaProgress]
                    .sort((a, b) => a.accuracy - b.accuracy)
                    .map((area) => (
                      <ProgressRow
                        key={area.area}
                        etiqueta={area.label}
                        porcentaje={Math.round(area.accuracy)}
                        detalle={
                          area.answered > 0
                            ? `${area.correct} de ${area.answered} preguntas`
                            : 'Sin preguntas todavía'
                        }
                      />
                    ))}
                </div>
              </Section>

              <Section titulo="Misiones de hoy" descripcion="Cada una suma XP.">
                {data.missions.items.length === 0 ? (
                  <p className="text-[13.5px] text-slate-500">
                    No hay misiones pendientes. Vuelve mañana.
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {data.missions.items.slice(0, 5).map((m) => (
                      <li
                        key={m.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] font-medium text-slate-800">
                            {m.title}
                          </p>
                          <p className="text-[12px] text-slate-500">+{m.xp} XP</p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            m.status === 'completed'
                              ? 'bg-lime/15 text-lime'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {m.status === 'completed' ? 'Lista' : 'Pendiente'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>
          </>
        )}

        {/* The study modes live here only. They used to appear in the
            sidebar, in the header and again as cards: three doors to
            the same room. */}
        <h2 className="mt-10 mb-4 text-[16px] font-bold tracking-tight text-slate-900">
          Otras formas de practicar
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ModeCard
            titulo="Practicar un tema"
            descripcion="Preguntas de un solo tema, para afianzar lo que te cuesta."
            to="/generacion-especializada"
            duracion="10 a 15 minutos"
            destacado={sinDatos}
          />
          <ModeCard
            titulo="Simulacro"
            descripcion="Las cinco áreas con el peso que tienen en el examen real."
            to="/generacion-mixta"
            duracion="Lo que tengas disponible"
          />
          <ModeCard
            titulo="Contrarreloj"
            descripcion="Con el cronómetro corriendo, porque en el examen el tiempo cuenta."
            to="/contrarreloj"
            duracion="5 minutos"
          />
        </div>
      </div>
    </Layout>
  );
}
