import { useState, useEffect } from 'react';
import { getTaxpayersCompliance } from '@/components/utils/api/report-functions';
import { decimalToNumber } from '@/components/utils/number.utils';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck, AlertCircle, XCircle, TrendingDown, TrendingUp, Download, AlertTriangle, Building2, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TaxpayerItem {
  id: string;
  name: string;
  rif?: string;
  compliance: number;
  collectedIva?: string | number;
  collectedIslr?: string | number;
  collectedFines?: string | number;
  total?: string | number;
}

interface ComplianceData { high: TaxpayerItem[]; medium: TaxpayerItem[]; low: TaxpayerItem[] }

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmtBs = (val?: unknown) => {
  const n = decimalToNumber(val);
  if (n === 0) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const normalize = (arr: any[]): TaxpayerItem[] =>
  arr.map((t) => ({
    id: t.id ?? t.taxpayerId ?? '',
    name: t.name ?? t.businessName ?? t.razonSocial ?? '',
    rif: t.rif ?? t.taxpayerRif ?? '',
    compliance: Number(t.compliance ?? t.cumplimiento ?? t.complianceRate ?? 0),
    collectedIva: t.collectedIva ?? t.iva ?? 0,
    collectedIslr: t.collectedIslr ?? t.islr ?? 0,
    collectedFines: t.collectedFines ?? t.fines ?? t.multas ?? 0,
    total: t.total ?? t.totalCollection ?? 0,
  })).sort((a, b) => b.compliance - a.compliance);

// ─── Tier config ─────────────────────────────────────────────────────────────

const TIER_CFG = {
  green: {
    label: 'text-emerald-400',
    labelMuted: 'text-emerald-400/50',
    border: 'border-emerald-800/50',
    headerBg: 'from-emerald-950/80 to-slate-900',
    accentBar: 'bg-emerald-500',
    badge: 'bg-emerald-600 text-white',
    progress: 'bg-emerald-500',
    icon: 'text-emerald-400',
    glow: 'shadow-emerald-900/20',
    rowHover: 'hover:border-emerald-700/40',
  },
  yellow: {
    label: 'text-amber-400',
    labelMuted: 'text-amber-400/50',
    border: 'border-amber-800/50',
    headerBg: 'from-amber-950/80 to-slate-900',
    accentBar: 'bg-amber-500',
    badge: 'bg-amber-500 text-black',
    progress: 'bg-amber-500',
    icon: 'text-amber-400',
    glow: 'shadow-amber-900/20',
    rowHover: 'hover:border-amber-700/40',
  },
  red: {
    label: 'text-red-400',
    labelMuted: 'text-red-400/50',
    border: 'border-red-900/60',
    headerBg: 'from-red-950/80 to-slate-900',
    accentBar: 'bg-red-500',
    badge: 'bg-red-600 text-white',
    progress: 'bg-red-500',
    icon: 'text-red-400',
    glow: 'shadow-red-900/20',
    rowHover: 'hover:border-red-700/40',
  },
} as const;

// ─── Taxpayer Row ─────────────────────────────────────────────────────────────

function TaxpayerRow({
  item, index, color,
}: {
  item: TaxpayerItem; index: number; color: keyof typeof TIER_CFG;
}) {
  const c = TIER_CFG[color];
  const pct = Math.min(100, Math.max(0, item.compliance));

  return (
    <div
      className={cn(
        'group rounded-lg border border-slate-700/60 bg-slate-800/60 p-2.5 transition-all duration-150',
        c.rowHover, 'hover:bg-slate-700/40 hover:shadow-md'
      )}
    >
      {/* Top row: rank + name + compliance */}
      <div className="flex items-center gap-2 mb-2">
        <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0', c.badge)}>
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-[11px] truncate leading-tight">{item.name}</p>
          {item.rif && (
            <p className="text-slate-500 text-[9px] font-mono leading-none mt-0.5">{item.rif}</p>
          )}
        </div>
        <span className={cn('font-black text-sm tabular-nums shrink-0', c.label)}>
          {pct.toFixed(1)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-700 rounded-full overflow-hidden mb-2">
        <div
          className={cn('h-full rounded-full transition-all duration-500', c.progress)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Financial row */}
      <div className="grid grid-cols-4 gap-1">
        {([
          ['IVA', item.collectedIva, 'text-sky-400'],
          ['ISLR', item.collectedIslr, 'text-violet-400'],
          ['Multas', item.collectedFines, 'text-orange-400'],
          ['Total', item.total, c.label],
        ] as const).map(([lbl, val, cls], j) => (
          <div key={j} className="bg-slate-900/70 rounded px-1.5 py-1">
            <p className="text-slate-600 text-[7px] uppercase font-medium mb-0.5">{lbl}</p>
            <p className={cn('text-[9px] font-bold tabular-nums leading-none', cls)}>
              {fmtBs(val as any)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tier Panel ───────────────────────────────────────────────────────────────

function TierPanel({
  title, count, color, items, icon, emptyMsg,
}: {
  title: string; count: number; color: keyof typeof TIER_CFG;
  items: TaxpayerItem[]; icon: React.ReactNode; emptyMsg?: string;
}) {
  const c = TIER_CFG[color];
  return (
    <div className={cn('flex flex-col h-full rounded-xl border overflow-hidden shadow-lg', c.border, c.glow)}>
      {/* Header with gradient band */}
      <div className={cn('bg-gradient-to-r px-3 py-2.5 shrink-0 border-b border-slate-700/60', c.headerBg)}>
        <div className="flex items-center gap-2">
          {/* Accent dot */}
          <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', c.accentBar)} />
          <span className={cn('shrink-0', c.icon)}>{icon}</span>
          <h3 className="font-bold text-white text-xs tracking-tight flex-1">
            {title}
          </h3>
          <span className={cn(
            'text-[10px] font-black tabular-nums px-2 py-0.5 rounded-full border',
            color === 'green' ? 'bg-emerald-900/40 border-emerald-700/40 text-emerald-300' :
            color === 'yellow' ? 'bg-amber-900/40 border-amber-700/40 text-amber-300' :
            'bg-red-900/40 border-red-700/40 text-red-300'
          )}>
            {count}
          </span>
          <div className="flex gap-1 ml-1">
            <button className="h-5 w-5 flex items-center justify-center bg-blue-600/80 hover:bg-blue-500 text-white rounded transition-colors">
              <Download className="h-2.5 w-2.5" />
            </button>
            <button className="h-5 w-5 flex items-center justify-center bg-emerald-600/80 hover:bg-emerald-500 text-white rounded transition-colors">
              <Download className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5 bg-slate-900/40">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 gap-2">
            <Building2 className={cn('w-8 h-8', c.labelMuted)} />
            <p className="text-slate-500 text-xs text-center">
              {emptyMsg ?? 'Sin contribuyentes en este nivel'}
            </p>
          </div>
        ) : items.map((item, i) => (
          <TaxpayerRow key={item.id || i} item={item} index={i} color={color} />
        ))}
      </div>
    </div>
  );
}

// ─── Distribution Panel ───────────────────────────────────────────────────────

function DistributionPanel({ high, medium, low }: { high: number; medium: number; low: number }) {
  const total = high + medium + low;
  const pctHigh = total ? ((high / total) * 100).toFixed(0) : '0';
  const pctMed  = total ? ((medium / total) * 100).toFixed(0) : '0';
  const pctLow  = total ? ((low / total) * 100).toFixed(0) : '0';

  const data = [
    { name: 'Alto',  fullName: 'Alto Cumplimiento',  value: high   || 0,              color: '#22c55e', pct: pctHigh },
    { name: 'Medio', fullName: 'Medio Cumplimiento', value: medium || 0,              color: '#eab308', pct: pctMed  },
    { name: 'Bajo',  fullName: 'Bajo Cumplimiento',  value: low    || Math.max(total, 1), color: '#ef4444', pct: pctLow  },
  ];

  // Custom label rendered on each segment
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, pct: pctVal }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (Number(pctVal) < 3) return null;
    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
        fontSize={11} fontWeight={700}>
        {pctVal}%
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-xs shadow-xl">
        <p className="text-white font-bold">{d.fullName}</p>
        <p className="text-slate-300 mt-0.5">{d.value} contribuyentes · {d.pct}%</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-slate-700/60 bg-slate-800/60 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-3 py-2.5 shrink-0 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
          <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
          <h3 className="text-white font-bold text-xs tracking-tight">Distribución de Cumplimiento</h3>
        </div>
      </div>

      {/* Donut chart — takes all remaining space */}
      <div className="flex-1 relative min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="38%"
              outerRadius="70%"
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              label={renderLabel}
              labelLine={false}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend — horizontal, single row */}
      <div className="flex items-center justify-center gap-4 px-3 py-2 shrink-0 border-t border-slate-700/60 flex-wrap">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-slate-300 text-[11px]">
              {d.fullName}: <span className="font-bold text-white">{d.value}</span>
            </span>
          </div>
        ))}
      </div>

      {/* KPI tiles — simple, no icons */}
      <div className="grid grid-cols-3 gap-2 px-3 pb-3 shrink-0">
        <div className="rounded-lg border border-emerald-700/50 bg-slate-900/60 py-3 text-center">
          <p className="text-emerald-400 font-black text-2xl leading-none tabular-nums">{high}</p>
          <p className="text-emerald-400/60 text-[10px] mt-1">Alto</p>
        </div>
        <div className="rounded-lg border border-amber-600/50 bg-slate-900/60 py-3 text-center">
          <p className="text-amber-400 font-black text-2xl leading-none tabular-nums">{medium}</p>
          <p className="text-amber-400/60 text-[10px] mt-1">Medio</p>
        </div>
        <div className="rounded-lg border border-red-700/50 bg-slate-900/60 py-3 text-center">
          <p className="text-red-400 font-black text-2xl leading-none tabular-nums">{low}</p>
          <p className="text-red-400/60 text-[10px] mt-1">Bajo</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function StatsPage3Cumplimiento({ year }: { year: number }) {
  const [data, setData] = useState<ComplianceData>({ high: [], medium: [], low: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getTaxpayersCompliance(year);
        const raw = (res as any)?.data ?? res ?? {};
        setData({
          high:   normalize(raw.alto ?? raw.high ?? raw.highCompliance ?? []),
          medium: normalize(raw.medio ?? raw.medium ?? raw.mediumCompliance ?? []),
          low:    normalize(raw.bajo ?? raw.low ?? raw.lowCompliance ?? []),
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [year]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-3 p-4 h-full overflow-y-auto md:overflow-hidden custom-scrollbar">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-xl bg-slate-800/60 animate-pulse border border-slate-700/60 min-h-[300px] md:min-h-0" />
        ))}
      </div>
    );
  }

  const { high, medium, low } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-3 p-3 h-full overflow-y-auto md:overflow-hidden custom-scrollbar">
      <div className="min-h-[400px] md:min-h-0">
        <TierPanel
          title="Cumplimiento Alto"
          count={high.length}
          color="green"
          items={high}
          icon={<ShieldCheck className="w-3.5 h-3.5" />}
          emptyMsg="No hay contribuyentes con cumplimiento alto"
        />
      </div>
      <div className="min-h-[400px] md:min-h-0">
        <TierPanel
          title="Cumplimiento Medio"
          count={medium.length}
          color="yellow"
          items={medium}
          icon={<AlertCircle className="w-3.5 h-3.5" />}
          emptyMsg="No hay contribuyentes con cumplimiento medio"
        />
      </div>
      <div className="min-h-[400px] md:min-h-0">
        <TierPanel
          title="Cumplimiento Bajo"
          count={low.length}
          color="red"
          items={low}
          icon={<XCircle className="w-3.5 h-3.5" />}
          emptyMsg="No hay contribuyentes con cumplimiento bajo"
        />
      </div>
      <div className="min-h-[400px] md:min-h-0">
        <DistributionPanel high={high.length} medium={medium.length} low={low.length} />
      </div>
    </div>
  );
}
