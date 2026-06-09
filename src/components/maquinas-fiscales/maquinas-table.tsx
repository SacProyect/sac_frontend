import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/UI/table';
import { Badge } from '@/components/UI/badge';
import { Button } from '@/components/UI/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MachineMock } from '@/types/maquinas-fiscales';

interface MaquinasTableProps {
  machines: MachineMock[];
  onRowClick: (machine: MachineMock) => void;
}

const PAGE_SIZE = 8;

const stateBadgeVariant: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  ok: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  unlinked: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  no_machine: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

const tipoBadgeVariant: Record<string, string> = {
  ESPECIAL: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  ORDINARIO: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  DESCONOCIDO: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

const stateLabel: Record<string, string> = {
  critical: 'Crítica',
  warning: 'Alerta',
  ok: 'Normal',
  unlinked: 'Sin enlace',
  no_machine: 'Sin máquina',
};

function getDiasColor(dias: number | null): string {
  if (dias === null) return 'text-slate-500';
  if (dias >= 1000) return 'text-red-400 font-semibold';
  if (dias >= 300) return 'text-orange-400';
  if (dias >= 90) return 'text-yellow-400';
  return 'text-emerald-400';
}

export function MaquinasTable({ machines, onRowClick }: MaquinasTableProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(machines.length / PAGE_SIZE);
  const paged = machines.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-slate-700/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-b border-slate-700/50">
              <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Serial</TableHead>
              <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">RIF</TableHead>
              <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Razón Social</TableHead>
              <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Parroquia</TableHead>
              <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider text-right">Días s/t</TableHead>
              <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Estado</TableHead>
              <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((machine) => (
              <TableRow
                key={machine.id}
                onClick={() => onRowClick(machine)}
                className="border-b border-slate-700/30 hover:bg-slate-700/30 cursor-pointer transition-colors"
              >
                <TableCell className="font-mono text-sm text-slate-300">{machine.serial}</TableCell>
                <TableCell className="text-sm text-slate-300">{machine.rif}</TableCell>
                <TableCell className="text-sm text-slate-200 max-w-[200px] truncate">{machine.razonsocial}</TableCell>
                <TableCell className="text-sm text-slate-400">{machine.parish}</TableCell>
                <TableCell className={`text-sm text-right ${getDiasColor(machine.diasSinTransmitir)}`}>
                  {machine.diasSinTransmitir !== null ? machine.diasSinTransmitir.toLocaleString() : '—'}
                </TableCell>
                <TableCell>
                  <Badge className={`text-[10px] font-medium border ${stateBadgeVariant[machine.machineState]}`}>
                    {stateLabel[machine.machineState]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`text-[10px] font-medium border ${tipoBadgeVariant[machine.contribuyenteTipo]}`}>
                    {machine.contribuyenteTipo === 'ESPECIAL' ? 'Especial' : machine.contribuyenteTipo === 'ORDINARIO' ? 'Ordinario' : 'Desc.'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  No se encontraron máquinas con este filtro.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, machines.length)} de {machines.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-8 border-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-slate-400">
              Página {page + 1} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
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
