import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTest } from '@/context/TestContext';
import { AREA_LABELS, Area } from '@/types/icfes';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ErrorAlert } from '@/components/ErrorAlert';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination';
import {
  AnswerPayload,
  completeStudySession,
  createStudySession,
  generateFeedback,
  getFeedback,
  postAnswers,
  startStudySession,
} from '@/services/api';
import {
  Trophy,
  Target,
  XCircle,
  CheckCircle2,
  RotateCcw,
  BookOpen,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getServerNow } from '@/lib/serverTime';

export default function Results() {
  const navigate = useNavigate();
  const {
    getResults,
    resetTest,
    questions,
    testStartTime,
    testArea,
    testDifficulty,
    testTopic,
    testMode,
    studySessionId,
    setStudySessionId,
  } = useTest();

  const results = getResults();
  const sessionPostedRef = useRef(false);
  const feedbackRequestedRef = useRef(false);
  const reviewPageSize = 4;
  const [reviewPage, setReviewPage] = useState(1);
  const [feedback, setFeedback] = useState<Awaited<ReturnType<typeof getFeedback>>['data'] | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<{ code?: string; message: string } | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const feedbackCacheKey = studySessionId ? `aicfes_feedback_${studySessionId}` : null;
  const sessionCompletedKey = studySessionId ? `aicfes_session_completed_${studySessionId}` : null;
  const answersPostedKey = studySessionId ? `aicfes_answers_posted_${studySessionId}` : null;
  const answersPostInFlightRef = useRef(false);

  // Redirect if no results
  useEffect(() => {
    if (results.total === 0) {
      navigate('/generacion-especializada');
    }
  }, [results.total, navigate]);

  useEffect(() => {
    if (!studySessionId || !sessionCompletedKey) return;
    try {
      const cached = sessionStorage.getItem(sessionCompletedKey);
      if (cached === 'true') {
        sessionPostedRef.current = true;
        setSessionCompleted(true);
      }
    } catch {
      // ignore cache errors
    }
  }, [studySessionId, sessionCompletedKey]);

  useEffect(() => {
    if (!answersPostedKey) return;
    try {
      if (sessionStorage.getItem(answersPostedKey) === 'true') {
        answersPostInFlightRef.current = false;
      }
    } catch {
      // ignore cache errors
    }
  }, [answersPostedKey]);

  useEffect(() => {
    const load = async () => {
      if (!studySessionId || feedbackRequestedRef.current) return;
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
      if (!sessionCompleted) return;
      feedbackRequestedRef.current = true;
      const result = await getFeedback(studySessionId);
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
  }, [studySessionId, sessionCompleted, feedbackCacheKey]);

  const handleGenerateFeedback = async () => {
    if (!studySessionId) return;
    setFeedbackError(null);
    setFeedbackLoading(true);
    const feedbackMode = testMode === 'test' ? 'generacion_libre' : (testMode || 'generacion_libre');
    const result = await generateFeedback({
      sessionId: studySessionId,
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

  useEffect(() => {
    if (sessionPostedRef.current) return;
    if (results.total === 0 || !testStartTime) return;

    const endedAt = getServerNow();
    const durationSeconds = Math.max(0, Math.floor((endedAt.getTime() - testStartTime.getTime()) / 1000));
    sessionPostedRef.current = true;

    const finalize = async () => {
      let sessionId = studySessionId || null;
      const areaSummaryMap = new Map<Area, { area: Area; totalQuestions: number; correctQuestions: number }>();
      questions.forEach((question) => {
        const areaKey = question.area || testArea;
        if (!areaKey) return;
        const existing = areaSummaryMap.get(areaKey) || {
          area: areaKey,
          totalQuestions: 0,
          correctQuestions: 0,
        };
        existing.totalQuestions += 1;
        areaSummaryMap.set(areaKey, existing);
      });

      results.answersHistory.forEach((answer) => {
        const question = questions[answer.questionIndex];
        const areaKey = question?.area || testArea;
        if (!areaKey) return;
        const existing = areaSummaryMap.get(areaKey) || {
          area: areaKey,
          totalQuestions: 0,
          correctQuestions: 0,
        };
        if (answer.isCorrect) {
          existing.correctQuestions += 1;
        }
        areaSummaryMap.set(areaKey, existing);
      });
      const areaSummary = Array.from(areaSummaryMap.values());
      if (!sessionId) {
        const started = await startStudySession({
          mode: testMode === 'contrarreloj' ? 'contrarreloj' : 'test',
          area: testArea || undefined,
          dificultad: testDifficulty || undefined,
          tema: testTopic || undefined,
          startedAt: testStartTime.toISOString(),
        });
        if (started.success && started.data?.sessionId) {
          sessionId = started.data.sessionId;
          setStudySessionId(sessionId);
        }
      }

      if (sessionId) {
        const completed = await completeStudySession(sessionId, {
          endedAt: endedAt.toISOString(),
          durationSeconds,
          totalQuestions: questions.length || results.total,
          correctQuestions: results.correct,
          areaSummary: areaSummary.length > 0 ? areaSummary : undefined,
        });
        if (!completed.success) {
          sessionPostedRef.current = false;
          return;
        }
        if (sessionCompletedKey) {
          try {
            sessionStorage.setItem(sessionCompletedKey, 'true');
          } catch {
            // ignore cache errors
          }
        }
      } else {
        const created = await createStudySession({
          mode: testMode === 'contrarreloj' ? 'contrarreloj' : 'test',
          area: testArea || undefined,
          dificultad: testDifficulty || undefined,
          tema: testTopic || undefined,
          startedAt: testStartTime.toISOString(),
          endedAt: endedAt.toISOString(),
          durationSeconds,
          totalQuestions: questions.length || results.total,
          correctQuestions: results.correct,
        });
        if (!created.success || !created.data?.sessionId) {
          sessionPostedRef.current = false;
          return;
        }
        sessionId = created.data.sessionId;
        setStudySessionId(sessionId);
      }

      const answersPayload: AnswerPayload[] = results.answersHistory
        .map((answer) => {
          if (!sessionId) return null;
          const question = questions[answer.questionIndex];
          const area = question?.area || testArea;
          const dificultad = question?.dificultad || testDifficulty;
          if (!area || !dificultad) return null;
          return {
            sessionId,
            questionIndex: answer.questionIndex,
            selectedAnswer: answer.selectedAnswer,
            isCorrect: answer.isCorrect,
            area,
            dificultad,
          };
        })
        .filter(Boolean) as AnswerPayload[];

      if (answersPayload.length > 0) {
        try {
          await postAnswers(answersPayload);
          if (answersPostedKey) {
            try {
              sessionStorage.setItem(answersPostedKey, 'true');
            } catch {
              // ignore cache errors
            }
          }
        } finally {
          setSessionCompleted(true);
          if (sessionCompletedKey) {
            try {
              sessionStorage.setItem(sessionCompletedKey, 'true');
            } catch {
              // ignore cache errors
            }
          }
        }
      } else {
        setSessionCompleted(true);
        if (sessionCompletedKey) {
          try {
            sessionStorage.setItem(sessionCompletedKey, 'true');
          } catch {
            // ignore cache errors
          }
        }
      }
    };

    finalize()
      .catch(() => {
        sessionPostedRef.current = false;
      });
  }, [
    results.total,
    results.correct,
    testStartTime,
    testArea,
    testDifficulty,
    testTopic,
    testMode,
    studySessionId,
    setStudySessionId,
    results.answersHistory.length,
    questions.length,
  ]);

  useEffect(() => {
    if (!studySessionId || !sessionCompleted) return;
    if (!answersPostedKey || answersPostInFlightRef.current) return;
    try {
      if (sessionStorage.getItem(answersPostedKey) === 'true') return;
    } catch {
      // ignore cache errors
    }
    if (results.answersHistory.length === 0) return;
    const answersPayload: AnswerPayload[] = results.answersHistory
      .map((answer) => {
        const question = questions[answer.questionIndex];
        const area = question?.area || testArea;
        const dificultad = question?.dificultad || testDifficulty;
        if (!area || !dificultad) return null;
        return {
          sessionId: studySessionId,
          questionIndex: answer.questionIndex,
          selectedAnswer: answer.selectedAnswer,
          isCorrect: answer.isCorrect,
          area,
          dificultad,
        };
      })
      .filter(Boolean) as AnswerPayload[];

    if (answersPayload.length === 0) return;
    answersPostInFlightRef.current = true;
    postAnswers(answersPayload)
      .then(() => {
        if (answersPostedKey) {
          try {
            sessionStorage.setItem(answersPostedKey, 'true');
          } catch {
            // ignore cache errors
          }
        }
      })
      .finally(() => {
        answersPostInFlightRef.current = false;
      });
  }, [
    studySessionId,
    sessionCompleted,
    answersPostedKey,
    results.answersHistory,
    questions,
    testArea,
    testDifficulty,
  ]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(results.answersHistory.length / reviewPageSize));
    if (reviewPage > totalPages) {
      setReviewPage(totalPages);
    }
  }, [results.answersHistory.length, reviewPage, reviewPageSize]);

  const handleNewTest = () => {
    resetTest();
    navigate('/generacion-especializada');
  };

  const getPerformanceLevel = (accuracy: number) => {
    if (accuracy >= 80) return { label: '¡Excelente!', color: 'text-success', icon: Trophy };
    if (accuracy >= 60) return { label: 'Buen trabajo', color: 'text-primary', icon: TrendingUp };
    if (accuracy >= 40) return { label: 'Puedes mejorar', color: 'text-warning', icon: Target };
    return { label: 'Sigue practicando', color: 'text-destructive', icon: BookOpen };
  };

  const performance = getPerformanceLevel(results.accuracy);
  const PerformanceIcon = performance.icon;
  const totalReviewPages = Math.max(1, Math.ceil(results.answersHistory.length / reviewPageSize));
  const reviewStart = (reviewPage - 1) * reviewPageSize;
  const reviewAnswers = results.answersHistory.slice(reviewStart, reviewStart + reviewPageSize);

  if (results.total === 0) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 lg:py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div
            className={cn(
              'inline-flex items-center justify-center p-4 rounded-full mb-4',
              results.accuracy >= 60 ? 'bg-success/10' : 'bg-primary/10'
            )}
          >
            <PerformanceIcon
              className={cn('h-10 w-10', performance.color)}
            />
          </div>
          <h1 className={cn('text-3xl lg:text-4xl font-bold mb-2', performance.color)}>
            {performance.label}
          </h1>
          <p className="text-lg text-muted-foreground">
            Has completado la prueba de {results.area ? AREA_LABELS[results.area] : 'práctica'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardContent className="pt-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-3">
                <Target className="h-7 w-7 text-primary" />
              </div>
              <p className="text-4xl font-bold text-foreground">{results.total}</p>
              <p className="text-sm text-muted-foreground">Total Preguntas</p>
            </CardContent>
          </Card>

          <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardContent className="pt-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success/10 mb-3">
                <CheckCircle2 className="h-7 w-7 text-success" />
              </div>
              <p className="text-4xl font-bold text-success">{results.correct}</p>
              <p className="text-sm text-muted-foreground">Correctas</p>
            </CardContent>
          </Card>

          <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <CardContent className="pt-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10 mb-3">
                <XCircle className="h-7 w-7 text-destructive" />
              </div>
              <p className="text-4xl font-bold text-destructive">{results.incorrect}</p>
              <p className="text-sm text-muted-foreground">Incorrectas</p>
            </CardContent>
          </Card>
        </div>

        {/* Accuracy Card */}
        <Card className="mb-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Precisión General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <span className="text-5xl font-bold text-foreground">{results.accuracy}%</span>
                <span className="text-sm text-muted-foreground">
                  {results.correct} de {results.total} correctas
                </span>
              </div>
              <Progress
                value={results.accuracy}
                className="h-3"
              />
            </div>
          </CardContent>
        </Card>

        {/* Answer Review */}
        <Card className="mb-8 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Resumen de Respuestas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {results.answersHistory.map((answer, index) => (
                <div
                  key={index}
                  className={cn(
                    'aspect-square rounded-lg flex items-center justify-center font-bold text-sm transition-colors',
                    answer.isCorrect
                      ? 'bg-success/10 text-success border border-success/30'
                      : 'bg-destructive/10 text-destructive border border-destructive/30'
                  )}
                  title={`Pregunta ${index + 1}: ${answer.isCorrect ? 'Correcta' : 'Incorrecta'}`}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Question-by-question Review with Explanations */}
        <Card className="mb-8 animate-slide-up" style={{ animationDelay: '0.55s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Revisión detallada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviewAnswers.map((answer) => {
                const question = questions[answer.questionIndex];
                if (!question) return null;
                const selectedKey = answer.selectedAnswer;
                const selectedText = question.opciones[selectedKey];
                const correctKey = question.respuesta_correcta;
                const explanation = question.explicaciones?.[selectedKey] || question.justificacion;

                return (
                  <div key={answer.questionIndex} className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-start gap-3">
                      <div className={cn('font-bold text-sm w-8 h-8 flex items-center justify-center rounded-full', answer.isCorrect ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
                        {answer.questionIndex + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{question.pregunta}</p>
                        <p className="text-xs text-muted-foreground mt-2">Tu respuesta: <strong>{selectedKey} — {selectedText}</strong></p>
                        {!answer.isCorrect && (
                          <p className="text-xs text-muted-foreground">Correcta: <strong>{correctKey}</strong></p>
                        )}
                        <div className="mt-3 bg-muted/50 rounded-md p-3 text-sm text-muted-foreground whitespace-pre-wrap">
                          {explanation}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {totalReviewPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    {Array.from({ length: totalReviewPages }).map((_, index) => {
                      const page = index + 1;
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            isActive={reviewPage === page}
                            onClick={(event) => {
                              event.preventDefault();
                              setReviewPage(page);
                            }}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Feedback */}
        <Card className="mb-8 bg-muted/30 border-dashed animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Retroalimentación IA Personalizada
                </h3>
                <p className="text-base text-muted-foreground">
                  Tu valor diferencial: no solo resultados, sino un plan claro de mejora según tus patrones reales.
                </p>
                {feedback?.summary && (
                  <p className="text-base text-foreground mt-3 leading-relaxed">
                    {feedback.summary}
                  </p>
                )}
              </div>
            </div>
            {feedbackError && (
              <ErrorAlert
                title="No pudimos cargar el feedback"
                message={feedbackError.message}
                code={feedbackError.code}
                onRetry={() => handleGenerateFeedback()}
              />
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                {feedback
                  ? `Generado con ${feedback.model} · ${new Date(feedback.generatedAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}`
                  : 'Generando feedback basado en tu sesión...'}
              </span>
            </div>
            {studySessionId && feedback && !feedbackLoading ? (
              <Link to={`/feedback/${studySessionId}`} className="block">
                <Button size="lg" className="w-full sm:w-auto">
                  Ver feedback completo
                </Button>
              </Link>
            ) : (
              <Button size="lg" className="w-full sm:w-auto" disabled>
                {feedbackLoading ? 'Generando feedback...' : 'Ver feedback completo'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.7s' }}>
          <Button
            variant="outline"
            size="lg"
            onClick={handleNewTest}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Nueva Prueba
          </Button>
          <Link to="/dashboard">
            <Button size="lg" className="w-full sm:w-auto">
              Volver al Inicio
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
