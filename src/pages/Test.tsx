import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTest } from '@/context/TestContext';
import { AnswerKey } from '@/types/icfes';
import { QuestionCard } from '@/components/QuestionCard';
import { AnswerOption } from '@/components/AnswerOption';
import { ConfirmModal } from '@/components/ConfirmModal';
import { FeedbackModal } from '@/components/FeedbackModal';
import { QuestionSkeleton } from '@/components/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, Home, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  } = useTest();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const currentQuestion = getCurrentQuestion();
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Redirect if no active test
  useEffect(() => {
    if (!isTestActive || questions.length === 0) {
      navigate('/');
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerClick = (key: AnswerKey) => {
    if (isAnswerRevealed) return;
    selectAnswer(key);
  };

  const handleConfirmClick = () => {
    if (!selectedAnswer) return;
    setShowConfirmModal(true);
  };

  const handleConfirmAnswer = () => {
    setShowConfirmModal(false);
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
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  {currentQuestionIndex + 1} / {questions.length}
                </span>
                <Progress value={progress} className="h-2" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-mono">{formatTime(elapsedTime)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 lg:py-8 max-w-3xl">
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
                onClick={handleConfirmClick}
                disabled={!selectedAnswer}
              >
                Confirmar Respuesta
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Confirm Modal */}
      <ConfirmModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        selectedAnswer={selectedAnswer}
        answerText={selectedAnswer ? currentQuestion.opciones[selectedAnswer] : ''}
        onConfirm={handleConfirmAnswer}
      />

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
