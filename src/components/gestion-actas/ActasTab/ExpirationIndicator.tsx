import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getExpirationInfo } from '@/utils/business-days';

interface ExpirationIndicatorProps {
  fechaVencimiento: string | null;
  className?: string;
}

const URGENCY_STYLES = {
  safe: 'text-emerald-600',
  warning: 'text-amber-600',
  danger: 'text-rose-600',
  expired: 'text-rose-700 font-semibold',
  none: 'text-slate-400',
};

const URGENCY_ICONS = {
  safe: CheckCircle,
  warning: Clock,
  danger: AlertTriangle,
  expired: AlertTriangle,
  none: Clock,
};

export function ExpirationIndicator({ fechaVencimiento, className }: ExpirationIndicatorProps) {
  const info = getExpirationInfo(fechaVencimiento);
  const Icon = URGENCY_ICONS[info.urgency];
  const colorClass = URGENCY_STYLES[info.urgency];

  return (
    <div className={cn('flex items-center gap-1.5 text-xs', colorClass, className)}>
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="whitespace-nowrap">{info.label}</span>
    </div>
  );
}
