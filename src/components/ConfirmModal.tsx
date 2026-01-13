import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { AnswerKey } from '@/types/icfes';
import { AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAnswer: AnswerKey | null;
  answerText: string;
  onConfirm: () => void;
}

export function ConfirmModal({
  open,
  onOpenChange,
  selectedAnswer,
  answerText,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Confirmar Respuesta"
      description="¿Estás seguro de que deseas enviar esta respuesta? No podrás cambiarla después."
    >
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
            {selectedAnswer}
          </div>
          <p className="text-sm text-foreground leading-relaxed pt-1">{answerText}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
        <AlertCircle className="h-4 w-4" />
        <span>Esta acción no se puede deshacer</span>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button onClick={onConfirm}>
          Confirmar Respuesta
        </Button>
      </div>
    </Modal>
  );
}
