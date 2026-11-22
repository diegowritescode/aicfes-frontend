import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTest } from '@/context/TestContext';
import { AnswerKey } from '@/types/icfes';
import { QuestionSkeleton } from '@/components/LoadingSkeleton';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Enunciado } from '@/components/examen/Enunciado';
import { OpcionRespuesta, EstadoOpcion } from '@/components/examen/OpcionRespuesta';
import { BarraExamen } from '@/components/examen/BarraExamen';
import { PanelExplicacion } from '@/components/examen/PanelExplicacion';
import { API_BASE_URL, getStoredAuth, heartbeatStudySession, startStudySession } from '@/services/api';

const LETRAS = ['A', 'B', 'C', 'D'] as const;

export default function Test() {
  const navigate = useNavigate();
  const {
    questions,
    currentQuestionIndex,
    selectedAnswer,
    answersHistory,
    isTestActive,
    selectAnswer,
    confirmAnswer,
    nextQuestion,
    getCurrentQuestion,
    isLastQuestion,
    testStartTime,
    testArea,
    testDifficulty,
    testTopic,
    testMode,
    studySessionId,
    setStudySessionId,
    timeLimitSeconds,
  } = useTest();

  const [respondida, setRespondida] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const hasTimedOutRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const opcionesRef = useRef<Record<string, HTMLButtonElement | null>>({});

  const currentQuestion = getCurrentQuestion();

  // Redirect if no active test
  useEffect(() => {
    if (!isTestActive || questions.length === 0) {
      navigate('/generacion-especializada');
    }
  }, [isTestActive, questions.length, navigate]);

  // Timer
  useEffect(() => {
    if (!isTestActive) return;
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isTestActive]);

  useEffect(() => {
    if (!isTestActive || !testStartTime) return;
    if (studySessionId) return;

    let isMounted = true;
    const sessionMode = testMode === 'contrarreloj' ? 'contrarreloj' : 'test';
    const start = async () => {
      const result = await startStudySession({
        mode: sessionMode,
        area: testArea || undefined,
        dificultad: testDifficulty || undefined,
        tema: testTopic || undefined,
        startedAt: testStartTime.toISOString(),
      });
      if (!isMounted) return;
      if (result.success && result.data?.sessionId) {
        setStudySessionId(result.data.sessionId);
      }
    };
    start();
    return () => {
      isMounted = false;
    };
  }, [isTestActive, testStartTime, testArea, testDifficulty, testTopic, testMode, studySessionId, setStudySessionId]);

  useEffect(() => {
    if (!studySessionId || !testStartTime) return;

    const sendHeartbeat = () => {
      const elapsedSeconds = Math.max(
        0,
        Math.floor((Date.now() - testStartTime.getTime()) / 1000)
      );
      heartbeatStudySession(studySessionId, { elapsedSeconds }).catch(() => {});
    };

    const sendFinalHeartbeat = () => {
      const elapsedSeconds = Math.max(
        0,
        Math.floor((Date.now() - testStartTime.getTime()) / 1000)
      );
      heartbeatStudySession(studySessionId, {
        elapsedSeconds,
        endedAt: new Date().toISOString(),
      }).catch(() => {});
    };

    sendHeartbeat();
    heartbeatIntervalRef.current = window.setInterval(sendHeartbeat, 60000);

    return () => {
      sendFinalHeartbeat();
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [studySessionId, testStartTime]);

  useEffect(() => {
    if (!studySessionId || !testStartTime) return;

    const sendKeepaliveHeartbeat = () => {
      const elapsedSeconds = Math.max(
        0,
        Math.floor((Date.now() - testStartTime.getTime()) / 1000)
      );
      const auth = getStoredAuth();
      const token = auth?.token;
      if (!token) return;
      fetch(`${API_BASE_URL}/api/study-sessions/${studySessionId}/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ elapsedSeconds, endedAt: new Date().toISOString() }),
        keepalive: true,
      }).catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendKeepaliveHeartbeat();
      }
    };

    window.addEventListener('pagehide', sendKeepaliveHeartbeat);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', sendKeepaliveHeartbeat);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [studySessionId, testStartTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingSeconds = useMemo(() => {
    if (!timeLimitSeconds) return null;
    return Math.max(0, timeLimitSeconds - elapsedTime);
  }, [timeLimitSeconds, elapsedTime]);

  /* The ticking clock plays only in contrarreloj, where the learner
     opted into a timed drill and the sound is the point. It is kept
     exactly as it was. */
  useEffect(() => {
    if (!timeLimitSeconds || testMode !== 'contrarreloj') return;
    if (remainingSeconds === null || remainingSeconds <= 0) return;
    if (document.visibilityState !== 'visible') return;
    if (lastTickRef.current === remainingSeconds) return;

    lastTickRef.current = remainingSeconds;
    const isTock = remainingSeconds % 2 === 0;
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtx();
    }
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    const isUrgent = remainingSeconds <= 10;
    osc.frequency.value = isTock ? (isUrgent ? 760 : 520) : (isUrgent ? 620 : 420);
    const baseGain = isUrgent ? 0.09 : 0.04;
    gain.gain.setValueAtTime(baseGain, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (isUrgent ? 0.08 : 0.06));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (isUrgent ? 0.09 : 0.07));
  }, [remainingSeconds, timeLimitSeconds, testMode]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (!timeLimitSeconds) return;
    if (remainingSeconds === null) return;
    if (remainingSeconds > 0) return;
    if (hasTimedOutRef.current) return;
    hasTimedOutRef.current = true;
    setRespondida(true);
    navigate('/results');
  }, [remainingSeconds, timeLimitSeconds, navigate]);

  const bloqueado = respondida || (timeLimitSeconds !== null && remainingSeconds === 0);

  const handleAnswerClick = useCallback(
    (key: AnswerKey) => {
      if (bloqueado) return;
      selectAnswer(key);
    },
    [bloqueado, selectAnswer]
  );

  const handleSubmitAnswer = useCallback(() => {
    if (!selectedAnswer || bloqueado) return;
    confirmAnswer();
    setRespondida(true);
  }, [selectedAnswer, bloqueado, confirmAnswer]);

  const handleNext = useCallback(() => {
    setRespondida(false);
    if (isLastQuestion()) {
      navigate('/results');
    } else {
      nextQuestion();
    }
  }, [isLastQuestion, navigate, nextQuestion]);

  /* Keyboard: A–D choose, arrows move through the group, Enter
     submits. Arrow support is new — a radiogroup that ignores arrow
     keys is broken by every accessibility guideline there is, and
     the shortcuts are now printed on screen so they are findable
     rather than secret. */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!currentQuestion || bloqueado) return;
      const objetivo = e.target as HTMLElement | null;
      if (objetivo && /^(INPUT|TEXTAREA|SELECT)$/.test(objetivo.tagName)) return;

      const key = e.key.toLowerCase();
      if (['a', 'b', 'c', 'd'].includes(key)) {
        e.preventDefault();
        const letra = key.toUpperCase() as AnswerKey;
        selectAnswer(letra);
        opcionesRef.current[letra]?.focus();
        return;
      }

      if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) {
        e.preventDefault();
        const paso = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
        const actual = selectedAnswer ? LETRAS.indexOf(selectedAnswer) : -1;
        const siguiente = (actual + paso + LETRAS.length) % LETRAS.length;
        const letra = LETRAS[siguiente];
        selectAnswer(letra);
        opcionesRef.current[letra]?.focus();
        return;
      }

      if (e.key === 'Enter' && selectedAnswer) {
        e.preventDefault();
        handleSubmitAnswer();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentQuestion, bloqueado, selectedAnswer, selectAnswer, handleSubmitAnswer]);

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-wash/40 p-4 lg:p-8">
        <QuestionSkeleton />
      </div>
    );
  }

  const lastAnswer = answersHistory[answersHistory.length - 1];
  const acerto = lastAnswer?.isCorrect ?? false;

  const estadoDe = (letra: AnswerKey): EstadoOpcion => {
    if (!respondida) return 'pendiente';
    if (letra === currentQuestion.respuesta_correcta) return 'correcta';
    if (letra === selectedAnswer) return 'elegida-mal';
    return 'descartada';
  };

  // The tab stop sits on the chosen option, or on A before anything
  // is chosen, so Tab reaches the group once and arrows do the rest.
  const letraFoco = selectedAnswer ?? 'A';

  return (
    <div className="flex min-h-screen flex-col bg-wash/40">
      <BarraExamen
        numero={currentQuestionIndex + 1}
        total={questions.length}
        tiempo={formatTime(elapsedTime)}
        limite={timeLimitSeconds ?? null}
        restante={
          remainingSeconds !== null
            ? { texto: formatTime(remainingSeconds), segundos: remainingSeconds }
            : null
        }
        onSalir={() => setConfirmarSalida(true)}
      />

      {/* Spoken once when a minute is left, for anyone who cannot see
          the bar turn red. */}
      <p aria-live="assertive" className="sr-only">
        {remainingSeconds !== null && remainingSeconds <= 60 && remainingSeconds > 55
          ? 'Queda un minuto.'
          : ''}
      </p>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-8">
        <div className="space-y-5">
          <Enunciado item={currentQuestion} />

          <div
            role="radiogroup"
            aria-label={`Opciones de la pregunta ${currentQuestionIndex + 1}`}
            className="space-y-3"
          >
            {LETRAS.map((letra) => (
              <OpcionRespuesta
                key={letra}
                letra={letra}
                texto={currentQuestion.opciones[letra]}
                elegida={selectedAnswer === letra}
                estado={estadoDe(letra)}
                bloqueada={bloqueado}
                esFoco={letraFoco === letra}
                onElegir={() => handleAnswerClick(letra)}
                refBoton={(nodo) => {
                  opcionesRef.current[letra] = nodo;
                }}
              />
            ))}
          </div>

          {respondida && selectedAnswer ? (
            <PanelExplicacion
              item={currentQuestion}
              elegida={selectedAnswer}
              acerto={acerto}
              esUltima={isLastQuestion()}
              onSiguiente={handleNext}
            />
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {/* The shortcuts were already implemented and entirely
                  invisible. A feature nobody can discover is not a
                  feature. */}
              <p className="text-[12.5px] text-slate-500">
                Teclas{' '}
                <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
                  A
                </kbd>
                –
                <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
                  D
                </kbd>{' '}
                para elegir,{' '}
                <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
                  Enter
                </kbd>{' '}
                para responder
              </p>
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
                className="rounded-full bg-brand-bright px-8 py-3 text-[14.5px] font-semibold text-white
                  shadow-[0_6px_20px_-6px_hsl(var(--brand-bright))] transition-transform hover:scale-[1.02]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright focus-visible:ring-offset-2
                  disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:hover:scale-100"
              >
                Responder
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Leaving used to be a single unguarded click on the logo. */}
      <Modal
        open={confirmarSalida}
        onOpenChange={setConfirmarSalida}
        title="¿Salir del examen?"
        description={`Vas en la pregunta ${currentQuestionIndex + 1} de ${questions.length}. Si sales ahora, pierdes este intento.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmarSalida(false)}>
              Seguir respondiendo
            </Button>
            <Button variant="destructive" onClick={() => navigate('/dashboard')}>
              Salir y perder el intento
            </Button>
          </>
        }
      />
    </div>
  );
}
