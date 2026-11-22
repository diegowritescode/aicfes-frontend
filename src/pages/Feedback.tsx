import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ErrorAlert } from '@/components/ErrorAlert';
import { useTest } from '@/context/TestContext';
import { generateFeedback, getFeedback } from '@/services/api';
import { AREA_LABELS, Area } from '@/types/icfes';
import { Sparkles, TrendingUp, Target, BookOpen } from 'lucide-react';

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
  const [cargandoInicial, setCargandoInicial] = useState(true);

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
      if (!resolvedSessionId) {
        setCargandoInicial(false);
        return;
      }
      if (feedbackRequestedRef.current) return;
      if (feedbackCacheKey) {
        try {
          const cached = sessionStorage.getItem(feedbackCacheKey);
          if (cached) {
            setFeedback(JSON.parse(cached));
            feedbackRequestedRef.current = true;
            setCargandoInicial(false);
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
          setCargandoInicial(false);
          return;
        }
        setFeedbackError(result.error || { message: 'No se pudo cargar el análisis.' });
        setCargandoInicial(false);
        return;
      }
      setCargandoInicial(false);
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
      setFeedbackError(result.error || { message: 'No se pudo generar el análisis.' });
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

  /* results comes from the test context, which holds whatever the
     learner last answered in this tab — not necessarily the session
     in the URL. Opening /feedback/:id directly, or reloading the
     page, left the counters at zero beside a real analysis of a real
     session. The counts are only shown when they belong to the
     session being displayed. */
  const cifrasCorresponden =
    results.total > 0 && (!routeSessionId || routeSessionId === studySessionId);

  const ritmo =
    typeof feedback?.insights?.avgTimePerQuestionSeconds === 'number'
      ? Math.round(feedback.insights.avgTimePerQuestionSeconds)
      : null;

  const esperando = cargandoInicial || feedbackLoading;

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-8 lg:py-12">
        <header className="mb-7">
          <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-slate-900">
            Qué le dejó esta práctica
          </h1>
          <p className="mt-1.5 max-w-xl text-[14.5px] leading-relaxed text-slate-600">
            Lo que vimos en sus respuestas y qué estudiar después.
          </p>
        </header>

        {!resolvedSessionId ? (
          <ErrorAlert
            title="No encontramos la práctica"
            message="Vuelva a sus resultados y entre otra vez desde ahí."
          />
        ) : null}

        {feedbackError ? (
          <div className="mb-6">
            <ErrorAlert
              title="No pudimos cargar el análisis"
              message={feedbackError.message}
              code={feedbackError.code}
              onRetry={() => handleGenerateFeedback()}
            />
          </div>
        ) : null}

        {/* The headline reading, first. "Resumen ejecutivo" was a
            board-meeting word on a page for a seventeen-year-old. */}
        <section className="rounded-3xl border border-brand-soft bg-gradient-to-br from-wash/80 to-white p-7">
          <h2 className="flex items-center gap-2 text-[16px] font-bold tracking-tight text-slate-900">
            <Sparkles aria-hidden className="h-4 w-4 text-brand-bright" />
            En resumen
          </h2>

          <div aria-live="polite" className="mt-3">
            {feedback?.summary ? (
              <p className="text-[15px] leading-[1.75] text-slate-700">{feedback.summary}</p>
            ) : esperando ? (
              <div className="space-y-2">
                <p className="text-[14px] text-slate-500">
                  Estamos leyendo sus respuestas. Tarda unos segundos.
                </p>
                <div aria-hidden className="h-3 w-4/5 animate-pulse rounded bg-slate-200/70" />
                <div aria-hidden className="h-3 w-3/5 animate-pulse rounded bg-slate-200/70" />
              </div>
            ) : (
              <p className="text-[14px] text-slate-500">
                Todavía no hay un análisis de esta práctica.
              </p>
            )}
          </div>

          {/* Two numbers, not four cards for three facts: accuracy
              already carries correct-out-of-total. */}
          {cifrasCorresponden || ritmo !== null ? (
            <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-t border-brand-soft/70 pt-5">
              {cifrasCorresponden ? (
                <div>
                  <dt className="text-[12.5px] font-medium text-slate-500">Precisión</dt>
                  <dd className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="text-[1.75rem] leading-none font-extrabold tracking-tight text-brand-bright">
                      {accuracyDisplay}
                    </span>
                    <span className="text-[14px] font-semibold text-slate-400">%</span>
                    <span className="ml-1 text-[12.5px] text-slate-500">
                      {results.correct} de {results.total}
                    </span>
                  </dd>
                </div>
              ) : null}

              {ritmo !== null ? (
                <div>
                  <dt className="text-[12.5px] font-medium text-slate-500">Ritmo</dt>
                  <dd className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="text-[1.75rem] leading-none font-extrabold tracking-tight text-slate-900">
                      {ritmo}
                    </span>
                    <span className="text-[14px] font-semibold text-slate-400">s</span>
                    <span className="ml-1 text-[12.5px] text-slate-500">por pregunta</span>
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {feedback?.insights?.speedNote ? (
            <p className="mt-4 text-[13.5px] leading-relaxed text-slate-600">
              {feedback.insights.speedNote}
            </p>
          ) : null}
        </section>

        {/* What to fix comes before what went well, and the plan
            follows straight after it. These used to sit in three
            side-by-side columns, which on a phone put the plan — the
            part that says what to do — last of all. */}
        {groupedWeaknesses.length ? (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="flex items-center gap-2 text-[16px] font-bold tracking-tight text-slate-900">
              <Target aria-hidden className="h-4 w-4 text-amber" />
              Qué reforzar
            </h2>
            <div className="mt-4 space-y-4">
              {groupedWeaknesses.map(([areaLabel, notes]) => (
                <div key={areaLabel}>
                  <h3 className="text-[13.5px] font-bold text-slate-900">{areaLabel}</h3>
                  <ul className="mt-1.5 space-y-1.5">
                    {notes.map((note, idx) => (
                      <li
                        key={`${areaLabel}-${idx}`}
                        className="flex gap-2 text-[14px] leading-relaxed text-slate-700"
                      >
                        <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber" />
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {feedback?.plan?.length ? (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="flex items-center gap-2 text-[16px] font-bold tracking-tight text-slate-900">
              <BookOpen aria-hidden className="h-4 w-4 text-brand-bright" />
              Qué estudiar ahora
            </h2>
            <ol className="mt-4 space-y-4">
              {feedback.plan.map((item, idx) => (
                <li key={`${item.title}-${idx}`} className="flex gap-3.5">
                  <span
                    aria-hidden
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[12px] font-bold text-brand"
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-0.5 text-[14px] leading-relaxed text-slate-700">
                      {item.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {groupedStrengths.length ? (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="flex items-center gap-2 text-[16px] font-bold tracking-tight text-slate-900">
              <TrendingUp aria-hidden className="h-4 w-4 text-lime" />
              Lo que ya le sale bien
            </h2>
            <div className="mt-4 space-y-4">
              {groupedStrengths.map(([areaLabel, notes]) => (
                <div key={areaLabel}>
                  <h3 className="text-[13.5px] font-bold text-slate-900">{areaLabel}</h3>
                  <ul className="mt-1.5 space-y-1.5">
                    {notes.map((note, idx) => (
                      <li
                        key={`${areaLabel}-${idx}`}
                        className="flex gap-2 text-[14px] leading-relaxed text-slate-700"
                      >
                        <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-lime" />
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* One primary action: practise what the plan just named.
            The old page had two equal buttons at the top and a
            "Regenerar feedback" at the bottom — regenerating the
            same analysis of the same answers is not something a
            learner needs to do. */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/generacion-especializada"
            className="rounded-full bg-brand-bright px-7 py-3 text-[14.5px] font-semibold text-white
              shadow-[0_6px_20px_-6px_hsl(var(--brand-bright))] transition-transform hover:scale-[1.02]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright focus-visible:ring-offset-2"
          >
            Practicar lo que falta
          </Link>
          <Link
            to="/dashboard"
            className="rounded-full px-5 py-3 text-[14px] font-semibold text-slate-600 transition-colors hover:text-slate-900
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
          >
            Volver a mi progreso
          </Link>
        </div>
      </div>
    </Layout>
  );
}
