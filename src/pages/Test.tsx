import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTest } from '@/context/TestContext';
import { AnswerKey } from '@/types/icfes';
import { QuestionCard } from '@/components/QuestionCard';
import { AnswerOption } from '@/components/AnswerOption';
import { FeedbackModal } from '@/components/FeedbackModal';
import { QuestionSkeleton } from '@/components/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, Clock, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStoredAuth, heartbeatStudySession, startStudySession } from '@/services/api';

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

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const hasTimedOutRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastTickRef = useRef<number | null>(null);

  const currentQuestion = getCurrentQuestion();
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

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
    const start = async () => {
      const result = await startStudySession({
        mode: testMode || 'test',
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
      fetch(`${apiBaseUrl}/api/study-sessions/${studySessionId}/heartbeat`, {
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
  }, [studySessionId, testStartTime, apiBaseUrl]);

  // Keyboard shortcuts: A/B/C/D to select, Enter to submit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!currentQuestion) return;
      if (isAnswerRevealed) return;
      const key = e.key.toLowerCase();
      if (['a', 'b', 'c', 'd'].includes(key)) {
        const mapped = key.toUpperCase() as AnswerKey;
        selectAnswer(mapped);
      }
      if (e.key === 'Enter') {
        if (selectedAnswer) {
          e.preventDefault();
          handleSubmitAnswer();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentQuestion, isAnswerRevealed, selectedAnswer, selectAnswer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingSeconds = useMemo(() => {
    if (!timeLimitSeconds) return null;
    return Math.max(0, timeLimitSeconds - elapsedTime);
  }, [timeLimitSeconds, elapsedTime]);

  const remainingRatio = useMemo(() => {
    if (!timeLimitSeconds || remainingSeconds === null) return null;
    return Math.max(0, Math.min(1, remainingSeconds / timeLimitSeconds));
  }, [remainingSeconds, timeLimitSeconds]);

  const timeBarClass = useMemo(() => {
    if (remainingRatio === null) return 'bg-primary';
    if (remainingRatio <= 0.2) return 'bg-destructive';
    if (remainingRatio <= 0.4) return 'bg-amber-500';
    return 'bg-emerald-500';
  }, [remainingRatio]);

  const timePanicClass = useMemo(() => {
    if (remainingSeconds === null) return '';
    if (remainingSeconds <= 10) return 'animate-time-panic-intense';
    if (remainingSeconds <= 20) return 'animate-time-panic';
    return '';
  }, [remainingSeconds]);

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
    setIsAnswerRevealed(true);
    navigate('/results');
  }, [remainingSeconds, timeLimitSeconds, navigate]);

  const handleAnswerClick = (key: AnswerKey) => {
    if (isAnswerRevealed || (timeLimitSeconds && remainingSeconds === 0)) return;
    selectAnswer(key);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;
    if (timeLimitSeconds && remainingSeconds === 0) return;
    confirmAnswer();
    setIsAnswerRevealed(true);
    // Show feedback after a brief delay
    setTimeout(() => {
      setShowFeedbackModal(true);
    }, 500);
  };

  const handleNext = () => {
    setShowFeedbackModal(false);
    setIsAnswerRevealed(false);
    
    if (isLastQuestion()) {
      navigate('/results');
    } else {
      nextQuestion();
    }
  };

  const handleFinish = () => {
    setShowFeedbackModal(false);
    navigate('/results');
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-8">
        <QuestionSkeleton />
      </div>
    );
  }

  const lastAnswer = answersHistory[answersHistory.length - 1];
  const isCorrect = lastAnswer?.isCorrect ?? false;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <GraduationCap className="h-5 w-5" />
              <span className="text-sm font-medium hidden sm:inline">AICFES</span>
            </Link>

            <div className="flex-1 max-w-md mx-4">
              {remainingSeconds !== null && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Timer className="h-3.5 w-3.5 text-destructive" />
                    <span>Tiempo restante</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${timeBarClass} ${timePanicClass} ${remainingSeconds !== null && remainingSeconds <= 10 ? 'shadow-[0_0_10px_rgba(239,68,68,0.7)]' : ''}`}
                      style={{ width: `${(remainingRatio || 0) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  {currentQuestionIndex + 1} / {questions.length}
                </span>
                <Progress value={progress} className="h-2" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {remainingSeconds !== null ? (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-base font-mono ${timePanicClass} ${
                      remainingSeconds <= 60 ? 'text-destructive' : ''
                    } ${remainingSeconds <= 10 ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' : ''}`}
                  >
                    {formatTime(remainingSeconds)}
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    / {formatTime(timeLimitSeconds || 0)}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-mono">{formatTime(elapsedTime)}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 container mx-auto px-4 py-6 lg:py-8 max-w-3xl ${remainingSeconds !== null && remainingSeconds <= 10 ? 'animate-time-panic-bg' : ''}`}>
        <div className="space-y-6 animate-fade-in">
          <QuestionCard
            item={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
          />

          <div className="space-y-3">
            {(['A', 'B', 'C', 'D'] as const).map((key) => (
              <AnswerOption
                key={key}
                optionKey={key}
                text={currentQuestion.opciones[key]}
                isSelected={selectedAnswer === key}
                isCorrect={key === currentQuestion.respuesta_correcta}
                isRevealed={isAnswerRevealed}
                isDisabled={isAnswerRevealed}
                onClick={() => handleAnswerClick(key)}
              />
            ))}
          </div>

          {!isAnswerRevealed && (
            <div className="flex justify-end pt-4">
              <Button
                size="lg"
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
              >
                Enviar Respuesta
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Feedback Modal */}
      {isAnswerRevealed && selectedAnswer && (
        <FeedbackModal
          open={showFeedbackModal}
          item={currentQuestion}
          selectedAnswer={selectedAnswer}
          isCorrect={isCorrect}
          isLastQuestion={isLastQuestion()}
          onNext={handleNext}
          onFinish={handleFinish}
        />
      )}
    </div>
  );
}
