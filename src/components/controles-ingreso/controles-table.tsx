import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/UI/table';
import { Button } from '@/components/UI/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ControlIngreso } from '@/types/controles-ingreso';
import { COORDINACION_LABELS } from '@/types/controles-ingreso';
import { ControlIngresoStatusBadge } from './control-status-badge';

interface ControlesTableProps {
  controls: ControlIngreso[];
}

const PAGE_SIZE = 10;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function ControlesTable({ controls }: ControlesTableProps) {
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    setPage(0);
  }, [controls.length]);

  const totalPages = Math.ceil(controls.length / PAGE_SIZE);
  const paged = controls.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-slate-700/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-b border-slate-700/50">
              <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">N° Expediente</TableHead>
              <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Sujeto Pasivo</TableHead>
              <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">RIF</TableHead>
              <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Coordinación</TableHead>
              <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Fecha</TableHead>
              <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((ctrl) => (
              <TableRow 
                key={ctrl.id}
                onClick={() => navigate(`/controles-de-ingreso/${ctrl.id}`)}
                className="border-b border-slate-700/30 hover:bg-slate-700/30 cursor-pointer transition-colors"
              >
                <TableCell className="font-mono text-sm text-indigo-400 font-medium">{ctrl.number}</TableCell>
                <TableCell className="text-sm text-slate-200 max-w-[200px] truncate">{ctrl.subject_name}</TableCell>
                <TableCell className="font-mono text-sm text-slate-400">{ctrl.subject_rif}</TableCell>
                <TableCell className="text-sm text-slate-400">{COORDINACION_LABELS[ctrl.coordination_id]}</TableCell>
                <TableCell className="text-sm text-slate-400">{formatDate(ctrl.start_date)}</TableCell>
                <TableCell>
                  <ControlIngresoStatusBadge status={ctrl.status} />
                </TableCell>
              </TableRow>
            ))}
            {paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  No se encontraron controles con este filtro.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, controls.length)} de {controls.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-8 border-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-slate-400">Página {page + 1} de {totalPages}</span>
            <Button
              variant="outline" size="sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="h-8 border-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
