import { Badge } from '@/components/UI/badge';
import type { ControlIngresoStatus } from '@/types/controles-ingreso';
import { CONTROL_ESTADO_LABELS } from '@/types/controles-ingreso';

const statusColors: Record<ControlIngresoStatus, string> = {
  borrador: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  en_revision: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  emitido: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  notificado: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  cerrado: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  reemitido: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

interface ControlIngresoStatusBadgeProps {
  status: ControlIngresoStatus;
}

export function ControlIngresoStatusBadge({ status }: ControlIngresoStatusBadgeProps) {
  return (
    <Badge className={`text-[10px] font-medium border ${statusColors[status]}`}>
      {CONTROL_ESTADO_LABELS[status]}
    </Badge>
  );
}
