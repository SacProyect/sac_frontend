import { Card } from './card';
import { Button } from './button';
import { Loader2, AlertCircle, Inbox } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

// Re-exports from v2 directory
export { ModalFooter } from '@/components/UI/v2/modal-footer';
export { PageHeader, type PageHeaderProps } from '@/components/UI/v2/page-header';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Cargando...' }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
        <p className="text-slate-400">{message}</p>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Ocurrió un error', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="bg-slate-800 border-slate-700 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        {message && <p className="text-slate-300 mb-4">{message}</p>}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-[44px] px-4 py-2.5 sm:py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 transition-colors touch-manipulation"
          >
            Reintentar
          </button>
        )}
      </Card>
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export function EmptyState({ title = 'No hay datos', message }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="bg-slate-800 border-slate-700 p-6 text-center">
        <Inbox className="h-8 w-8 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        {message && <p className="text-slate-400">{message}</p>}
      </Card>
    </div>
  );
}

export { BackButton, type BackButtonProps } from '@/components/UI/v2/back-button';

interface YearSelectorProps {
  value: number;
  onChange: (year: number) => void;
}

export function YearSelector({ value, onChange }: YearSelectorProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2022 }, (_, i) => 2023 + i);

  return (
    <Select value={value.toString()} onValueChange={(val) => onChange(Number(val))}>
      <SelectTrigger className="bg-slate-700 border-slate-600 text-white w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-slate-700 border-slate-600">
        {years.map((year) => (
          <SelectItem key={year} value={year.toString()}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
