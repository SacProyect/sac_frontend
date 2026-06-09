import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/UI/table';
import { Badge } from '@/components/UI/badge';
import { EmptyState } from '@/components/UI/v2';
import { maquinasFiscalesMock } from '@/data/mock-maquinas-fiscales';
import type { MachineMock } from '@/types/maquinas-fiscales';
import { Cpu } from 'lucide-react';

interface MaquinasTaxpayerSectionProps {
  rif: string;
}

const stateColors: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  ok: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  unlinked: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  no_machine: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

const stateLabel: Record<string, string> = {
  critical: 'Crítica',
  warning: 'Alerta',
  ok: 'Normal',
  unlinked: 'Sin enlace',
  no_machine: 'Sin máquina',
};

const tipoLabel: Record<string, string> = {
  IMPRESORA_FISCAL: 'Impresora Fiscal',
  CAJA_REGISTRADORA: 'Caja Registradora',
  OTRO: 'Otro',
};

export function MaquinasTaxpayerSection({ rif }: MaquinasTaxpayerSectionProps) {
  const machines = useMemo(
    () => maquinasFiscalesMock.filter(m => m.rif === rif),
    [rif]
  );

  if (machines.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-slate-100 text-base flex items-center gap-2">
            <Cpu className="h-4 w-4 text-indigo-400" />
            Máquinas Fiscales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Sin máquinas registradas"
            message="Este contribuyente no tiene máquinas fiscales asociadas."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-slate-100 text-base flex items-center gap-2">
          <Cpu className="h-4 w-4 text-indigo-400" />
          Máquinas Fiscales
          <Badge className="ml-2 text-[10px] bg-slate-700 text-slate-300 border-slate-600">
            {machines.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-slate-700/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-b border-slate-700/50">
                <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Serial</TableHead>
                <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Tipo</TableHead>
                <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Parroquia</TableHead>
                <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider text-right">Días s/t</TableHead>
                <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {machines.map((machine) => (
                <TableRow key={machine.id} className="border-b border-slate-700/30 hover:bg-slate-700/30">
                  <TableCell className="font-mono text-sm text-slate-300">{machine.serial}</TableCell>
                  <TableCell className="text-sm text-slate-400">{tipoLabel[machine.tipoMaquina]}</TableCell>
                  <TableCell className="text-sm text-slate-400">{machine.parish}</TableCell>
                  <TableCell className="text-sm text-right text-slate-300">
                    {machine.diasSinTransmitir !== null ? machine.diasSinTransmitir.toLocaleString() : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] font-medium border ${stateColors[machine.machineState]}`}>
                      {stateLabel[machine.machineState]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
