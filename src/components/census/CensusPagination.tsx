import { Button } from '@/components/UI/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CensusPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function CensusPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: CensusPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2 py-3">
      <p className="text-sm text-slate-400">
        {total} registro{total !== 1 ? 's' : ''} en total
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <span className="text-sm text-slate-400 px-2">
          Página {page} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent disabled:opacity-40"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
