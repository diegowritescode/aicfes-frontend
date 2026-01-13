import { cn } from '@/lib/utils';
import { AnswerKey } from '@/types/icfes';
import { Check, X } from 'lucide-react';

interface AnswerOptionProps {
  optionKey: AnswerKey;
  text: string;
  isSelected: boolean;
  isCorrect?: boolean;
  isRevealed?: boolean;
  isDisabled?: boolean;
  onClick: () => void;
}

export function AnswerOption({
  optionKey,
  text,
  isSelected,
  isCorrect,
  isRevealed,
  isDisabled,
  onClick,
}: AnswerOptionProps) {
  const getStateClasses = () => {
    if (isRevealed) {
      if (isCorrect) {
        return 'border-success bg-success/10 text-success-foreground';
      }
      if (isSelected && !isCorrect) {
        return 'border-destructive bg-destructive/10 text-destructive-foreground';
      }
      return 'border-border bg-muted/50 opacity-60';
    }
    if (isSelected) {
      return 'border-primary bg-primary/10 ring-2 ring-primary/20';
    }
    return 'border-border bg-card hover:border-primary/50 hover:bg-primary/5';
  };

  return (
    <button
      onClick={onClick}
      disabled={isDisabled || isRevealed}
      className={cn(
        'w-full p-4 rounded-lg border-2 text-left transition-all duration-200',
        'flex items-start gap-4 group',
        getStateClasses(),
        isDisabled && !isRevealed && 'cursor-not-allowed opacity-50'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors',
          isRevealed && isCorrect && 'bg-success text-success-foreground',
          isRevealed && isSelected && !isCorrect && 'bg-destructive text-destructive-foreground',
          !isRevealed && isSelected && 'bg-primary text-primary-foreground',
          !isRevealed && !isSelected && 'bg-muted text-muted-foreground group-hover:bg-primary/20'
        )}
      >
        {isRevealed && isCorrect ? (
          <Check className="h-5 w-5" />
        ) : isRevealed && isSelected && !isCorrect ? (
          <X className="h-5 w-5" />
        ) : (
          optionKey
        )}
      </div>
      <div className="flex-1 pt-1.5">
        <p className={cn(
          'text-base leading-relaxed',
          isRevealed && !isCorrect && !isSelected && 'text-muted-foreground'
        )}>
          {text}
        </p>
      </div>
    </button>
  );
}
