import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Timer, Flame, Gauge, Zap } from 'lucide-react';

export default function TimeTrial() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 lg:py-10">
        <div className="mb-8 flex flex-col gap-4">
          <Badge className="w-fit bg-amber-500/10 text-amber-700 hover:bg-amber-500/20" variant="secondary">
            Modo Contrarreloj
          </Badge>
          <h1 className="text-3xl font-bold text-foreground lg:text-4xl">
            Entrena con presión real
          </h1>
          <p className="text-sm text-muted-foreground lg:text-base max-w-2xl">
            Elige un desafío rápido para mejorar velocidad, precisión y manejo del tiempo en el examen.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-amber-600" />
                Desafío rápido
              </CardTitle>
              <CardDescription>Selecciona la modalidad para empezar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { title: 'Sprint 10', time: '10 min', desc: '10 preguntas mixtas con presión moderada.' },
                { title: 'Reto 5', time: '5 min', desc: '5 preguntas de tu área más débil.' },
                { title: 'Explosivo', time: '3 min', desc: '3 preguntas difíciles contra el reloj.' },
              ].map((mode) => (
                <div
                  key={mode.title}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{mode.title}</h3>
                    <p className="text-xs text-muted-foreground">{mode.desc}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-amber-600">{mode.time}</span>
                    <Button size="sm" variant="outline">
                      Próximamente
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-primary" />
                  Beneficios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Mejora tu velocidad de lectura y análisis.</p>
                <p>Simula la presión real del examen.</p>
                <p>Desbloquea insignias al completar retos.</p>
              </CardContent>
            </Card>

            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-amber-600" />
                  Próximo logro
                </CardTitle>
                <CardDescription>Completa 3 sprints en una semana.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Gana el badge “Velocidad ICFES” y 150 XP.
                </p>
                <Link to="/generacion-libre">
                  <Button size="sm" className="gap-2">
                    Practicar ahora
                    <Zap className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
