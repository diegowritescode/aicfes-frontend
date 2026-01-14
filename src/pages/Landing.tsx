import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Award,
  BarChart3,
  Brain,
  CheckCircle2,
  Clock,
  GraduationCap,
  Sparkles,
  Target,
  Timer,
  Zap,
} from 'lucide-react';

export default function Landing() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 lg:py-16">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-blue-500/10 p-8 lg:p-12">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="space-y-5">
              <Badge className="w-fit bg-primary/10 text-primary hover:bg-primary/20" variant="secondary">
                Preparación Saber 11
              </Badge>
              <h1 className="text-3xl font-bold text-foreground lg:text-5xl">
                AICFES: estudio inteligente con enfoque gamificado
              </h1>
              <p className="text-sm text-muted-foreground lg:text-base">
                Practica con generación libre, desafíate en contrarreloj y mide tu avance real
                con rachas, XP y métricas por área.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/registro">
                  <Button size="lg" className="gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Empezar gratis
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline">
                    Ya tengo cuenta
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  Sin tarjetas
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  Progreso guardado
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  IA con explicación
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Generación libre
                  </CardTitle>
                  <CardDescription>Personaliza área, dificultad y tema.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Practica justo lo que necesitas en minutos.
                </CardContent>
              </Card>
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-amber-600" />
                    Contrarreloj
                  </CardTitle>
                  <CardDescription>Simula presión real del examen.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Sprints rápidos para mejorar velocidad.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-success" />
                    Progreso real
                  </CardTitle>
                  <CardDescription>Métricas claras y útiles.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Rachas, XP y rendimiento por área.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Retroalimentación IA
                  </CardTitle>
                  <CardDescription>Explicaciones para cada error.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Aprende rápido y consolida conocimiento.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          {[
            {
              title: 'Ruta guiada',
              desc: 'Misiones diarias y retos semanales para mantener el ritmo.',
              icon: Award,
              tone: 'text-primary',
            },
            {
              title: 'Analítica clara',
              desc: 'Visualiza precisión, rachas y progreso por área en segundos.',
              icon: BarChart3,
              tone: 'text-blue-600',
            },
            {
              title: 'IA enfocada',
              desc: 'Explicaciones cortas y útiles para mejorar sin saturarte.',
              icon: Brain,
              tone: 'text-emerald-600',
            },
          ].map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <feature.icon className={`h-5 w-5 ${feature.tone}`} />
                  {feature.title}
                </CardTitle>
                <CardDescription>{feature.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>

        {/* How it works */}
        <section className="mt-12 grid gap-6 lg:grid-cols-3">
          {[
            {
              step: '01',
              title: 'Configura tu sesión',
              desc: 'Elige área, dificultad y tema en Generación libre.',
            },
            {
              step: '02',
              title: 'Practica y responde',
              desc: 'Resuelve preguntas con feedback inmediato.',
            },
            {
              step: '03',
              title: 'Mide tu avance',
              desc: 'Revisa tu dashboard y ajusta tu plan.',
            },
          ].map((item) => (
            <Card key={item.step} className="border-border bg-muted/30">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{item.step}</CardTitle>
                <CardDescription className="text-base font-semibold text-foreground">
                  {item.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {item.desc}
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Metrics strip */}
        <section className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Preguntas creadas', value: '10K+', icon: Zap, tone: 'text-primary' },
            { label: 'Tiempo ahorrado', value: '120h', icon: Clock, tone: 'text-blue-600' },
            { label: 'Precisión promedio', value: '78%', icon: Target, tone: 'text-success' },
          ].map((metric) => (
            <Card key={metric.label} className="border-border bg-card">
              <CardContent className="flex items-center gap-3 py-4">
                <metric.icon className={`h-5 w-5 ${metric.tone}`} />
                <div>
                  <p className="text-lg font-semibold text-foreground">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* CTA */}
        <section className="mt-12 rounded-3xl border border-border bg-gradient-to-br from-blue-500/10 via-background to-primary/10 p-8 lg:p-10">
          <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Listo para mejorar tu puntaje?</h2>
              <p className="text-sm text-muted-foreground">
                Empieza hoy y desbloquea tu progreso en minutos.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/registro">
                <Button size="lg" className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Crear cuenta
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  Ver mi dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
