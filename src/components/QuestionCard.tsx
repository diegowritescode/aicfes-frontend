import { IcfesItem, AREA_LABELS, DIFICULTAD_LABELS } from '@/types/icfes';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, BarChart3 } from 'lucide-react';
import { useState } from 'react';

interface QuestionCardProps {
  item: IcfesItem;
  questionNumber?: number;
  totalQuestions?: number;
}

export function QuestionCard({ item, questionNumber, totalQuestions }: QuestionCardProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="shadow-md animate-fade-in">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {AREA_LABELS[item.area]}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            {DIFICULTAD_LABELS[item.dificultad]}
          </Badge>
          {questionNumber && totalQuestions && (
            <span className="ml-auto text-sm text-muted-foreground font-medium">
              Pregunta {questionNumber} de {totalQuestions}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {item.contexto && (
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Contexto
            </h4>
            <div>
              <ScrollArea className={expanded ? 'max-h-96' : 'max-h-32'}>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {item.contexto}
                </p>
              </ScrollArea>
              {item.contexto.length > 300 && (
                <div className="mt-2 text-right">
                  <button
                    className="text-xs text-primary hover:underline"
                    onClick={() => setExpanded((s) => !s)}
                  >
                    {expanded ? 'Mostrar menos' : 'Ver más'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        <div>
          <p className="text-lg font-medium leading-relaxed text-foreground">
            {item.pregunta}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
