import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorAlertProps {
  title?: string;
  message: string;
  code?: string;
  onRetry?: () => void;
}

export function ErrorAlert({ title = 'Error', message, code, onRetry }: ErrorAlertProps) {
  return (
    <Alert variant="destructive" className="animate-scale-in">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="font-semibold">{title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p>{message}</p>
        {code && (
          <p className="text-xs mt-1 opacity-75">Código: {code}</p>
        )}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-3"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Intentar de nuevo
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
