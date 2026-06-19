import { Badge } from '@/components/UI/badge';
import { cn } from '@/lib/utils';
import { RepairReportStatus, REPAIR_STATUS_CONFIG } from '@/types/repair-reports';

interface RepairStatusBadgeProps {
  status: RepairReportStatus | string;
  className?: string;
}

const STATUS_VARIANT_MAP: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDIENTE: 'secondary',
  EN_PLAZO: 'default',
  POR_VENCER: 'outline',
  VENCIDO: 'destructive',
  NOTIFICADO: 'default',
};

const STATUS_COLOR_MAP: Record<string, string> = {
  PENDIENTE: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100',
  EN_PLAZO: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50',
  POR_VENCER: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50',
  VENCIDO: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50',
  NOTIFICADO: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50',
};

export function RepairStatusBadge({ status, className }: RepairStatusBadgeProps) {
  const config = REPAIR_STATUS_CONFIG[status as RepairReportStatus];
  const colorClass = STATUS_COLOR_MAP[status] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-medium px-2 py-0.5 whitespace-nowrap',
        colorClass,
        className
      )}
    >
      {config?.label || status}
    </Badge>
  );
}
