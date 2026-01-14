import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTest } from '@/context/TestContext';
import { AREA_LABELS } from '@/types/icfes';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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

export default function Results() {
  const navigate = useNavigate();
  const { getResults, resetTest, isTestActive, questions } = useTest();

  const results = getResults();

  // Redirect if no results
  useEffect(() => {
    if (results.total === 0) {
      navigate('/');
    }
  }, [results.total, navigate]);

  const handleNewTest = () => {
    resetTest();
    navigate('/');
  };

  const getPerformanceLevel = (accuracy: number) => {
    if (accuracy >= 80) return { label: '¡Excelente!', color: 'text-success', icon: Trophy };
    if (accuracy >= 60) return { label: 'Buen trabajo', color: 'text-primary', icon: TrendingUp };
    if (accuracy >= 40) return { label: 'Puedes mejorar', color: 'text-warning', icon: Target };
    return { label: 'Sigue practicando', color: 'text-destructive', icon: BookOpen };
  };

  const performance = getPerformanceLevel(results.accuracy);
  const PerformanceIcon = performance.icon;

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
              {results.answersHistory.map((answer, idx) => {
                const question = questions[answer.questionIndex];
                if (!question) return null;
                const selectedKey = answer.selectedAnswer;
                const selectedText = question.opciones[selectedKey];
                const correctKey = question.respuesta_correcta;
                const explanation = question.explicaciones?.[selectedKey] || question.justificacion;

                return (
                  <div key={idx} className="p-4 rounded-lg border border-border bg-card">
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
          </CardContent>
        </Card>

        {/* Future AI Feedback Placeholder */}
        <Card className="mb-8 bg-muted/30 border-dashed animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Retroalimentación IA Personalizada
                </h3>
                <p className="text-sm text-muted-foreground">
                  Próximamente: Análisis detallado de tus fortalezas y áreas de mejora basado en inteligencia artificial.
                  Recibirás recomendaciones personalizadas para optimizar tu preparación.
                </p>
              </div>
            </div>
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
          <Link to="/">
            <Button size="lg" className="w-full sm:w-auto">
              Volver al Inicio
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
