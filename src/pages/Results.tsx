import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTest } from '@/context/TestContext';
import { AREA_LABELS, Area } from '@/types/icfes';
import { Layout } from '@/components/Layout';
import { ErrorAlert } from '@/components/ErrorAlert';
import { RepasoPregunta } from '@/components/examen/RepasoPregunta';
import {
  AnswerPayload,
  completeStudySession,
  createStudySession,
  generateFeedback,
  getFeedback,
  postAnswers,
  startStudySession,
} from '@/services/api';
import { RotateCcw, Sparkles } from 'lucide-react';
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
            // Without these the server cannot tell which item was
            // answered, so the mistake has no topic to attach to.
            itemId: answer.itemId ?? question?.id,
            tiempoMs: answer.tiempoMs,
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
          // Without these the server cannot tell which item was
          // answered, so the mistake has no topic to attach to.
          itemId: answer.itemId ?? question?.id,
          tiempoMs: answer.tiempoMs,
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

  const handleNewTest = () => {
    resetTest();
    navigate('/generacion-especializada');
  };

  const getPerformanceLevel = (accuracy: number) => {
    if (accuracy >= 80) return { label: 'Excelente' };
    if (accuracy >= 60) return { label: 'Buen trabajo' };
    if (accuracy >= 40) return { label: 'Puede mejorar' };
    return { label: 'Siga practicando' };
  };

  const performance = getPerformanceLevel(results.accuracy);

  if (results.total === 0) {
    return null;
  }
  /* The questions that were missed come first, because those are the
     ones worth reading. A learner reviewing fifty answers does not
     need the ones they already got right at the top of the list. */
  const repasoOrdenado = [...results.answersHistory].sort((a, b) => {
    if (a.isCorrect !== b.isCorrect) return a.isCorrect ? 1 : -1;
    return a.questionIndex - b.questionIndex;
  });
  const falladas = results.incorrect;

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-8 lg:py-12">
        {/* The score, first and alone. The old page opened with three
            cards for total, correct and incorrect — two numbers
            stretched into three tiles, with the one figure that
            answers "how did I do" pushed below them. */}
        <section className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-9">
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-brand-bright">
            {results.area ? AREA_LABELS[results.area] : 'Práctica'}
          </p>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="flex items-baseline gap-2">
                <span className="text-[4rem] leading-none font-extrabold tracking-tight text-slate-900">
                  {results.accuracy}
                </span>
                <span className="text-[1.75rem] font-bold text-slate-400">%</span>
              </p>
              <p className="mt-2 text-[14.5px] text-slate-600">
                {results.correct} de {results.total} correctas
              </p>
            </div>
            <p className="text-[15px] font-semibold text-slate-700">{performance.label}</p>
          </div>

          <div
            role="progressbar"
            aria-valuenow={results.accuracy}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Precisión de esta sesión"
            className="mt-6 h-2.5 overflow-hidden rounded-full bg-slate-100"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-bright to-cyan transition-all duration-700"
              style={{ width: `${results.accuracy}%` }}
            />
          </div>

          <p className="mt-4 text-[13.5px] leading-relaxed text-slate-600">
            {falladas === 0
              ? 'No falló ninguna. Suba la dificultad o pase a otra área.'
              : `Hay ${falladas} ${falladas === 1 ? 'pregunta' : 'preguntas'} para repasar abajo. Son las que más le van a subir el puntaje.`}
          </p>
        </section>

        {/* What the AI saw, without the sales copy that used to wrap
            it. The learner is already inside the product; they need
            the reading, not the pitch for it. */}
        <section className="mt-5 rounded-3xl border border-brand-soft bg-gradient-to-br from-wash/80 to-white p-7">
          <h2 className="flex items-center gap-2 text-[16px] font-bold tracking-tight text-slate-900">
            <Sparkles aria-hidden className="h-4 w-4 text-brand-bright" />
            Qué dice su sesión
          </h2>

          {feedback?.summary ? (
            <p className="mt-3 text-[14.5px] leading-[1.75] text-slate-700">{feedback.summary}</p>
          ) : feedbackError ? (
            <div className="mt-4">
              <ErrorAlert
                title="No pudimos cargar el análisis"
                message={feedbackError.message}
                code={feedbackError.code}
                onRetry={() => handleGenerateFeedback()}
              />
            </div>
          ) : (
            <div className="mt-3 space-y-2" aria-live="polite">
              <p className="text-[14px] text-slate-500">
                {feedbackLoading || !sessionCompleted
                  ? 'Estamos leyendo sus respuestas. Tarda unos segundos.'
                  : 'Preparando el análisis de esta sesión.'}
              </p>
              <div aria-hidden className="h-3 w-4/5 animate-pulse rounded bg-slate-200/70" />
              <div aria-hidden className="h-3 w-3/5 animate-pulse rounded bg-slate-200/70" />
            </div>
          )}

          {studySessionId && feedback && !feedbackLoading ? (
            <Link
              to={`/feedback/${studySessionId}`}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-bright px-6 py-2.5 text-[14px] font-semibold text-white
                shadow-[0_6px_20px_-6px_hsl(var(--brand-bright))] transition-transform hover:scale-[1.02]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright focus-visible:ring-offset-2"
            >
              Ver el análisis completo
            </Link>
          ) : null}
        </section>

        {/* Review. One page, closed by default, wrong answers open
            and first. The old version paginated four-at-a-time
            through thirteen pages of always-expanded cards. */}
        <section className="mt-5">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[16px] font-bold tracking-tight text-slate-900">
              Repase sus respuestas
            </h2>
            <p className="text-[13px] text-slate-500">
              {falladas > 0
                ? 'Las falladas van primero y ya están abiertas'
                : 'Toque una pregunta para ver la explicación'}
            </p>
          </div>

          <div className="space-y-2.5">
            {repasoOrdenado.map((answer) => {
              const question = questions[answer.questionIndex];
              if (!question) return null;
              return (
                <RepasoPregunta
                  key={answer.questionIndex}
                  item={question}
                  numero={answer.questionIndex + 1}
                  elegida={answer.selectedAnswer}
                  acerto={answer.isCorrect}
                  abiertoPorDefecto={!answer.isCorrect}
                />
              );
            })}
          </div>
        </section>

        {/* One primary action, chosen by how the session went: more
            practice when there is ground to make up, a clean exit
            when there is not. The old footer offered two buttons of
            equal weight and left the choice to the learner. */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {falladas > 0 ? (
            <>
              <button
                type="button"
                onClick={handleNewTest}
                className="inline-flex items-center gap-2 rounded-full bg-brand-bright px-7 py-3 text-[14.5px] font-semibold text-white
                  shadow-[0_6px_20px_-6px_hsl(var(--brand-bright))] transition-transform hover:scale-[1.02]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright focus-visible:ring-offset-2"
              >
                <RotateCcw aria-hidden className="h-4 w-4" />
                Practicar otra ronda
              </button>
              <Link
                to="/dashboard"
                className="rounded-full px-5 py-3 text-[14px] font-semibold text-slate-600 transition-colors hover:text-slate-900
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
              >
                Volver a mi progreso
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/dashboard"
                className="inline-flex items-center rounded-full bg-brand-bright px-7 py-3 text-[14.5px] font-semibold text-white
                  shadow-[0_6px_20px_-6px_hsl(var(--brand-bright))] transition-transform hover:scale-[1.02]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright focus-visible:ring-offset-2"
              >
                Volver a mi progreso
              </Link>
              <button
                type="button"
                onClick={handleNewTest}
                className="rounded-full px-5 py-3 text-[14px] font-semibold text-slate-600 transition-colors hover:text-slate-900
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
              >
                Otra ronda
              </button>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
