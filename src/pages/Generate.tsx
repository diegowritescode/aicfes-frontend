import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTest } from '@/context/TestContext';
import { generateItems } from '@/services/api';
import { Area, Dificultad, IcfesItem, AREA_LABELS, DIFICULTAD_LABELS } from '@/types/icfes';
import { Layout } from '@/components/Layout';
import { ErrorAlert } from '@/components/ErrorAlert';
import { QuestionCard } from '@/components/QuestionCard';
import { AnswerOption } from '@/components/AnswerOption';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, BookOpen, GraduationCap, Brain, Loader2, ArrowRight } from 'lucide-react';

const AREAS: Area[] = ['MAT', 'LC', 'CN', 'SOC', 'ING'];
const DIFICULTADES: Dificultad[] = ['facil', 'media', 'alta'];

export default function Generate() {
  const navigate = useNavigate();
  const { startTest } = useTest();

  const [area, setArea] = useState<Area | ''>('');
  const [dificultad, setDificultad] = useState<Dificultad | ''>('');
  const [tema, setTema] = useState('');
  const [cantidad, setCantidad] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [previewItem, setPreviewItem] = useState<IcfesItem | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!area || !dificultad) return;

    setIsLoading(true);
    setError(null);
    setShowPreview(false);

    const result = await generateItems({
      area,
      dificultad,
      tema: tema.trim() || undefined,
      n: cantidad,
    });

    setIsLoading(false);

    if (!result.success) {
      setError(result.error || { code: 'UNKNOWN', message: 'Error desconocido' });
      return;
    }

    if (result.items.length === 0) {
      setError({ code: 'EMPTY_RESPONSE', message: 'No se generaron preguntas. Intenta de nuevo.' });
      return;
    }

    if (cantidad === 1) {
      // Preview single question
      setPreviewItem(result.items[0]);
      setShowPreview(true);
    } else {
      // Start test with multiple questions
      startTest(result.items, area);
      navigate('/test');
    }
  };

  const handleStartTestWithPreview = () => {
    if (previewItem && area) {
      startTest([previewItem], area as Area);
      navigate('/test');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
            Generador de Preguntas ICFES
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Practica con preguntas estilo Saber 11 generadas por inteligencia artificial.
            Selecciona el área, dificultad y comienza tu preparación.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Generator Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Configurar Examen
              </CardTitle>
              <CardDescription>
                Personaliza tu sesión de práctica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="area">Área</Label>
                    <Select
                      value={area}
                      onValueChange={(v) => setArea(v as Area)}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="area">
                        <SelectValue placeholder="Selecciona un área" />
                      </SelectTrigger>
                      <SelectContent>
                        {AREAS.map((a) => (
                          <SelectItem key={a} value={a}>
                            {AREA_LABELS[a]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dificultad">Dificultad</Label>
                    <Select
                      value={dificultad}
                      onValueChange={(v) => setDificultad(v as Dificultad)}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="dificultad">
                        <SelectValue placeholder="Selecciona dificultad" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFICULTADES.map((d) => (
                          <SelectItem key={d} value={d}>
                            {DIFICULTAD_LABELS[d]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tema">Tema específico (opcional)</Label>
                  <Input
                    id="tema"
                    placeholder="Ej: Álgebra, Revolución Francesa, Mitosis..."
                    value={tema}
                    onChange={(e) => setTema(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cantidad">Número de preguntas (1-20)</Label>
                  <Input
                    id="cantidad"
                    type="number"
                    min={1}
                    max={20}
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <ErrorAlert
                    title="Error al generar"
                    message={error.message}
                    code={error.code}
                    onRetry={() => setError(null)}
                  />
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={!area || !dificultad || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generando preguntas...
                    </>
                  ) : (
                    <>
                      <Brain className="h-5 w-5 mr-2" />
                      Generar Preguntas
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Info Cards / Preview */}
          <div className="space-y-6">
            {showPreview && previewItem ? (
              <div className="space-y-4 animate-slide-up">
                <QuestionCard item={previewItem} questionNumber={1} totalQuestions={1} />
                <div className="space-y-3">
                  {(['A', 'B', 'C', 'D'] as const).map((key) => (
                    <AnswerOption
                      key={key}
                      optionKey={key}
                      text={previewItem.opciones[key]}
                      isSelected={false}
                      isDisabled
                      onClick={() => {}}
                    />
                  ))}
                </div>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleStartTestWithPreview}
                >
                  Comenzar Prueba
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <>
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">5 Áreas de Conocimiento</h3>
                        <p className="text-sm text-muted-foreground">
                          Matemáticas, Lectura Crítica, Ciencias Naturales, Sociales e Inglés
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-muted">
                        <Brain className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">IA de Última Generación</h3>
                        <p className="text-sm text-muted-foreground">
                          Preguntas generadas con tecnología GPT, siguiendo el formato oficial del ICFES
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-success/5 border-success/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-success/10">
                        <Sparkles className="h-6 w-6 text-success" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Retroalimentación Inmediata</h3>
                        <p className="text-sm text-muted-foreground">
                          Recibe explicaciones detalladas para cada respuesta y aprende de tus errores
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
