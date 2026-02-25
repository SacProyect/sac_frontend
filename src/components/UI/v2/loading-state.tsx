import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

/**
 * LoadingState - Estado de carga reutilizable para V2
 */
export function LoadingState({ message = 'Cargando...', className = '' }: LoadingStateProps) {
  return (
    <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-slate-400">{message}</p>
      </div>
    </div>
  );
}
