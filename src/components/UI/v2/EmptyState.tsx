import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  className?: string;
}

/**
 * EmptyState - Estado vacío reutilizable para V2
 */
export function EmptyState({
  title = 'No hay datos disponibles',
  message,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
      <div className="text-center">
        <Inbox className="h-12 w-12 text-slate-500 mx-auto mb-4" />
        <p className="text-slate-400 text-lg mb-2">{title}</p>
        {message && <p className="text-slate-500 text-sm">{message}</p>}
      </div>
    </div>
  );
}
