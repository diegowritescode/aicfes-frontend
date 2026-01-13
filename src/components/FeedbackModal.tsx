import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { IcfesItem, AnswerKey } from '@/types/icfes';
import { CheckCircle2, XCircle, ArrowRight, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackModalProps {
  open: boolean;
  item: IcfesItem;
  selectedAnswer: AnswerKey;
  isCorrect: boolean;
  isLastQuestion: boolean;
  onNext: () => void;
  onFinish: () => void;
}

export function FeedbackModal({
  open,
  item,
  selectedAnswer,
  isCorrect,
  isLastQuestion,
  onNext,
  onFinish,
}: FeedbackModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={() => {}}
      title={isCorrect ? '¡Respuesta Correcta!' : 'Respuesta Incorrecta'}
    >
      <div className="space-y-4">
        <div
          className={cn(
            'flex items-center gap-3 p-4 rounded-lg',
            isCorrect ? 'bg-success/10' : 'bg-destructive/10'
          )}
        >
          {isCorrect ? (
            <CheckCircle2 className="h-8 w-8 text-success flex-shrink-0" />
          ) : (
            <XCircle className="h-8 w-8 text-destructive flex-shrink-0" />
          )}
          <div>
            {isCorrect ? (
              <p className="font-medium text-success">
                ¡Excelente! Has seleccionado la opción correcta.
              </p>
            ) : (
              <div>
                <p className="font-medium text-destructive">
                  Tu respuesta ({selectedAnswer}) es incorrecta.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  La respuesta correcta es: <strong>{item.respuesta_correcta}</strong>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <h4 className="text-sm font-semibold text-foreground mb-2">Explicación</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {item.justificacion}
          </p>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        {isLastQuestion ? (
          <Button onClick={onFinish} size="lg">
            <Trophy className="h-4 w-4 mr-2" />
            Ver Resultados
          </Button>
        ) : (
          <Button onClick={onNext} size="lg">
            Siguiente Pregunta
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </Modal>
  );
}
