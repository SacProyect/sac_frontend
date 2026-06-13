import { Badge } from '@/components/UI/badge';
import { FileText, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import type { CensusStatus } from '@/types/census-table';

interface CensusStatusBadgeProps {
  status: CensusStatus;
}

const STATUS_CONFIG: Record<
  CensusStatus,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  DRAFT: {
    label: 'Borrador',
    className: 'bg-slate-600/30 text-slate-300 border-slate-500/30',
    icon: FileText,
  },
  COMPLETED: {
    label: 'Completado',
    className: 'bg-blue-900/40 text-blue-300 border-blue-500/30',
    icon: CheckCircle2,
  },
  VERIFIED: {
    label: 'Verificado',
    className: 'bg-emerald-900/40 text-emerald-300 border-emerald-500/30',
    icon: ShieldCheck,
  },
  IMPORTED: {
    label: 'Importado',
    className: 'bg-purple-900/40 text-purple-300 border-purple-500/30',
    icon: Download,
  },
};

export default function CensusStatusBadge({ status }: CensusStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} gap-1.5`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
