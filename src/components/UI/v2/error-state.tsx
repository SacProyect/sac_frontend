import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  className?: string;
}

/**
 * ErrorState - Estado de error reutilizable para V2
 */
export function ErrorState({
  title = 'Error al cargar los datos',
  message,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
      <div className="text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 text-lg mb-2">{title}</p>
        <p className="text-slate-400">{message}</p>
      </div>
    </div>
  );
}
