import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ErrorAlert';
import { useTest } from '@/context/TestContext';
import { generateFeedback, getFeedback } from '@/services/api';
import { AREA_LABELS, Area } from '@/types/icfes';
import { Sparkles, TrendingUp, Target, BookOpen, Timer, CheckCircle2, XCircle } from 'lucide-react';

export default function Feedback() {
  const { sessionId: routeSessionId } = useParams();
  const { getResults, studySessionId, testMode } = useTest();
  const results = getResults();
  const resolvedSessionId = routeSessionId || studySessionId || null;
  const feedbackCacheKey = resolvedSessionId ? `aicfes_feedback_${resolvedSessionId}` : null;

  const feedbackRequestedRef = useRef(false);
  const [feedback, setFeedback] = useState<Awaited<ReturnType<typeof getFeedback>>['data'] | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<{ code?: string; message: string } | null>(null);

  const accuracyFromFeedback = useMemo(() => {
    if (typeof feedback?.insights?.accuracy === 'number') {
      return Math.round(feedback.insights.accuracy * 100);
    }
    return null;
  }, [feedback?.insights?.accuracy]);

  const accuracyDisplay = accuracyFromFeedback ?? results.accuracy;
  const groupedStrengths = useMemo(() => {
    const groups = new Map<string, string[]>();
    feedback?.strengths?.forEach((item) => {
      if (!item.area) return;
      const label = AREA_LABELS[item.area as Area] || item.area;
      const existing = groups.get(label) || [];
      existing.push(item.note);
      groups.set(label, existing);
    });
    return Array.from(groups.entries());
  }, [feedback?.strengths]);

  const groupedWeaknesses = useMemo(() => {
    const groups = new Map<string, string[]>();
    feedback?.weaknesses?.forEach((item) => {
      if (!item.area) return;
      const label = AREA_LABELS[item.area as Area] || item.area;
      const existing = groups.get(label) || [];
      existing.push(item.note);
      groups.set(label, existing);
    });
    return Array.from(groups.entries());
  }, [feedback?.weaknesses]);

  useEffect(() => {
    const load = async () => {
      if (!resolvedSessionId || feedbackRequestedRef.current) return;
      if (feedbackCacheKey) {
        try {
          const cached = sessionStorage.getItem(feedbackCacheKey);
          if (cached) {
            setFeedback(JSON.parse(cached));
            feedbackRequestedRef.current = true;
            return;
          }
        } catch {
          // ignore cache errors
        }
      }
      feedbackRequestedRef.current = true;
      const result = await getFeedback(resolvedSessionId);
      if (!result.success) {
        if (result.error?.code === 'NOT_FOUND') {
          await handleGenerateFeedback();
          return;
        }
        setFeedbackError(result.error || { message: 'No se pudo cargar el feedback.' });
        return;
      }
      setFeedback(result.data || null);
      if (result.data && feedbackCacheKey) {
        try {
          sessionStorage.setItem(feedbackCacheKey, JSON.stringify(result.data));
        } catch {
          // ignore cache errors
        }
      }
    };
    load();
  }, [resolvedSessionId, feedbackCacheKey]);

  const handleGenerateFeedback = async () => {
    if (!resolvedSessionId) return;
    setFeedbackError(null);
    setFeedbackLoading(true);
    const feedbackMode = testMode === 'test' ? 'generacion_libre' : (testMode || 'generacion_libre');
    const result = await generateFeedback({
      sessionId: resolvedSessionId,
      mode: feedbackMode,
      focus: 'summary',
      language: 'es',
    });
    setFeedbackLoading(false);
    if (!result.success) {
      setFeedbackError(result.error || { message: 'No se pudo generar el feedback.' });
      return;
    }
    setFeedback(result.data || null);
    if (result.data && feedbackCacheKey) {
      try {
        sessionStorage.setItem(feedbackCacheKey, JSON.stringify(result.data));
      } catch {
        // ignore cache errors
      }
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 lg:py-12 max-w-6xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4" />
              Retroalimentación IA Personalizada
            </div>
            <h1 className="text-3xl lg:text-4xl font-semibold text-foreground">
              Tu informe completo de desempeño
            </h1>
            <p className="text-base lg:text-lg text-muted-foreground max-w-2xl">
              Visualiza fortalezas, áreas críticas y un plan claro de mejora con datos reales de tu sesión.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/results">
              <Button variant="outline">Volver a resultados</Button>
            </Link>
            <Link to="/dashboard">
              <Button>Ir al dashboard</Button>
            </Link>
          </div>
        </div>

        {feedbackError && (
          <div className="mb-6">
            <ErrorAlert
              title="No pudimos cargar el feedback"
              message={feedbackError.message}
              code={feedbackError.code}
              onRetry={() => handleGenerateFeedback()}
            />
          </div>
        )}

        {!resolvedSessionId && (
          <div className="mb-6">
            <ErrorAlert
              title="Sesión no encontrada"
              message="No encontramos una sesión para generar el feedback. Regresa a resultados y vuelve a intentarlo."
            />
          </div>
        )}

        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-xl lg:text-2xl">Resumen ejecutivo</CardTitle>
            <CardDescription className="text-base">
              Lectura rápida de tus resultados y señales clave para tomar acción.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-base lg:text-lg text-foreground">
            {feedback?.summary ? (
              <p className="leading-relaxed">{feedback.summary}</p>
            ) : (
              <p className="text-muted-foreground">Generando feedback basado en tu sesión...</p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Precisión
              </div>
              <div className="text-3xl font-semibold text-foreground">{accuracyDisplay}%</div>
              <p className="text-sm text-muted-foreground">
                {results.correct} correctas de {results.total}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Timer className="h-4 w-4 text-primary" />
                Tiempo promedio
              </div>
              <div className="text-3xl font-semibold text-foreground">
                {typeof feedback?.insights?.avgTimePerQuestionSeconds === 'number'
                  ? `${Math.round(feedback.insights.avgTimePerQuestionSeconds)}s`
                  : '—'}
              </div>
              <p className="text-sm text-muted-foreground">Por pregunta respondida</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Correctas
              </div>
              <div className="text-3xl font-semibold text-foreground">{results.correct}</div>
              <p className="text-sm text-muted-foreground">Preguntas acertadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <XCircle className="h-4 w-4 text-destructive" />
                Incorrectas
              </div>
              <div className="text-3xl font-semibold text-foreground">{results.incorrect}</div>
              <p className="text-sm text-muted-foreground">Preguntas a reforzar</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-success" />
                Fortalezas detectadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-base text-muted-foreground">
              {groupedStrengths.length ? (
                groupedStrengths.map(([areaLabel, notes]) => (
                  <div key={areaLabel}>
                    <p className="font-semibold text-foreground">{areaLabel}</p>
                    <ul className="mt-2 space-y-2 list-disc pl-4">
                      {notes.map((note, idx) => (
                        <li key={`${areaLabel}-${idx}`} className="leading-relaxed">
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p>Aún no se identifican fortalezas claras en la sesión.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-amber-600" />
                Áreas a mejorar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-base text-muted-foreground">
              {groupedWeaknesses.length ? (
                groupedWeaknesses.map(([areaLabel, notes]) => (
                  <div key={areaLabel}>
                    <p className="font-semibold text-foreground">{areaLabel}</p>
                    <ul className="mt-2 space-y-2 list-disc pl-4">
                      {notes.map((note, idx) => (
                        <li key={`${areaLabel}-${idx}`} className="leading-relaxed">
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p>No hay debilidades críticas detectadas por ahora.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-primary" />
                Plan de estudio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-base text-muted-foreground">
              {feedback?.plan?.length ? (
                feedback.plan.map((item, idx) => (
                  <div key={`${item.title}-${idx}`}>
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="leading-relaxed">{item.detail}</p>
                  </div>
                ))
              ) : (
                <p>Sin plan sugerido por ahora.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl lg:text-2xl">Insights de desempeño</CardTitle>
            <CardDescription className="text-base">
              Lecturas rápidas sobre ritmo, precisión y control del tiempo.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-base text-muted-foreground space-y-4">
            {feedback?.insights?.speedNote && (
              <p className="leading-relaxed">{feedback.insights.speedNote}</p>
            )}
            {!feedback?.insights?.speedNote && (
              <p>Comparte más sesiones para generar insights avanzados de velocidad.</p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            {feedback
              ? `Generado con ${feedback.model} · ${new Date(feedback.generatedAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}`
              : 'Generando feedback basado en tu sesión...'}
          </span>
          <Button
            variant="outline"
            onClick={() => handleGenerateFeedback()}
            disabled={feedbackLoading}
          >
            {feedbackLoading ? 'Generando...' : 'Regenerar feedback'}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
