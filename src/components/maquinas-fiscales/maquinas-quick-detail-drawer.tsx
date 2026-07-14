import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/UI/sheet';
import { Badge } from '@/components/UI/badge';
import { Button } from '@/components/UI/button';
import { ExternalLink, MapPin, Phone, Calendar, Building2, Cpu, Hash } from 'lucide-react';
import type { MachineMock } from '@/types/maquinas-fiscales';

interface MaquinasQuickDetailDrawerProps {
  machine: MachineMock | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function MaquinasQuickDetailDrawer({ machine, open, onOpenChange }: MaquinasQuickDetailDrawerProps) {
  const navigate = useNavigate();

  if (!machine) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[min(100%,24rem)] sm:w-[420px] bg-slate-900 border-slate-700/50 overflow-y-auto pt-safe pb-safe">
        <SheetHeader className="pb-4 border-b border-slate-700/50">
          <SheetTitle className="text-slate-100 text-lg">Detalle Rápido</SheetTitle>
          <SheetDescription className="text-slate-400 text-sm">
            {machine.razonsocial}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge className={`text-xs font-medium border ${stateColors[machine.machineState]}`}>
              {stateLabel[machine.machineState]}
            </Badge>
            {machine.estadoSAC === 'enlazado' && (
              <Badge className="text-xs font-medium border bg-indigo-500/15 text-indigo-400 border-indigo-500/30">
                Enlazado
              </Badge>
            )}
          </div>

          {/* Info Grid */}
          <div className="space-y-3">
            <InfoRow icon={Hash} label="Serial" value={machine.serial} />
            <InfoRow icon={Building2} label="RIF" value={machine.rif} />
            <InfoRow icon={Cpu} label="Tipo" value={tipoLabel[machine.tipoMaquina]} />
            <InfoRow 
              icon={Calendar} 
              label="Días sin transmitir" 
              value={machine.diasSinTransmitir !== null ? `${machine.diasSinTransmitir} días` : 'N/A'}
              valueColor={
                (machine.diasSinTransmitir ?? 0) >= 1000 ? 'text-red-400' :
                (machine.diasSinTransmitir ?? 0) >= 300 ? 'text-orange-400' :
                (machine.diasSinTransmitir ?? 0) >= 90 ? 'text-yellow-400' : 'text-emerald-400'
              }
            />
            <InfoRow icon={MapPin} label="Parroquia" value={machine.parish} />
            {machine.phone && <InfoRow icon={Phone} label="Teléfono" value={machine.phone} />}
            {machine.address && <InfoRow icon={MapPin} label="Dirección" value={machine.address} />}
          </div>

          {/* Activity Preview */}
          {machine.lastSeen && (
            <div className="pt-4 border-t border-slate-700/50">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Última actividad</p>
              <p className="text-sm text-slate-300">{machine.lastSeen}</p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-700/50 space-y-2">
            <Button
              variant="outline"
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              onClick={() => navigate(`/maquinas-fiscales/${machine.serial}`)}
            >
              Ver detalle completo
            </Button>
            <Button
              variant="outline"
              className="w-full border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
              onClick={() => navigate(`/taxpayer/${machine.rif}`)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver contribuyente
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({ icon: Icon, label, value, valueColor = 'text-slate-200' }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <p className={`text-sm ${valueColor} break-words`}>{value}</p>
      </div>
    </div>
  );
}
