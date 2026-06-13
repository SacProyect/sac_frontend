import type { CensusStatusStats } from '@/types/census-table';

interface CensusStatsBarProps {
  stats: CensusStatusStats;
}

const STATS_ITEMS = [
  { key: 'total' as const, label: 'Total', colorClass: 'bg-slate-600/40 text-slate-200 border-slate-500/30' },
  { key: 'DRAFT' as const, label: 'Borrador', colorClass: 'bg-slate-600/30 text-slate-300 border-slate-500/20' },
  { key: 'COMPLETED' as const, label: 'Completados', colorClass: 'bg-blue-900/40 text-blue-300 border-blue-500/30' },
  { key: 'VERIFIED' as const, label: 'Verificados', colorClass: 'bg-emerald-900/40 text-emerald-300 border-emerald-500/30' },
];

export default function CensusStatsBar({ stats }: CensusStatsBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATS_ITEMS.map((item) => (
        <div
          key={item.key}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium ${item.colorClass}`}
        >
          <span className="text-xs opacity-75">{item.label}</span>
          <span className="font-bold">{stats[item.key]}</span>
        </div>
      ))}
    </div>
  );
}
