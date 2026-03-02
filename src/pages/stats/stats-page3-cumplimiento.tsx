import { useState, useEffect } from 'react';
import { getTaxpayersCompliance } from '@/components/utils/api/report-functions';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck, AlertCircle, XCircle, Download, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/UI/button';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TaxpayerItem {
  id: string;
  name: string;
  rif?: string;
  compliance: number;
  collectedIva?: string|number;
  collectedIslr?: string|number;
  collectedFines?: string|number;
  total?: string|number;
}

interface ComplianceData { high: TaxpayerItem[]; medium: TaxpayerItem[]; low: TaxpayerItem[] }

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmtBs = (val?: string|number) => {
  const n = val == null ? 0 : typeof val === 'string' ? parseFloat(val) || 0 : val;
  return `Bs.S ${n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

// ─── Theme map ───────────────────────────────────────────────────────────────

const theme = {
  green:  { text: 'text-green-400', border: 'border-green-700/40', bg: 'bg-green-900/10', badge: 'bg-green-600', headerBg: 'bg-green-900/20' },
  yellow: { text: 'text-amber-400', border: 'border-amber-600/40', bg: 'bg-amber-900/10', badge: 'bg-amber-500', headerBg: 'bg-amber-900/15' },
  red:    { text: 'text-red-400',   border: 'border-red-700/40',   bg: 'bg-red-900/10',   badge: 'bg-red-600',   headerBg: 'bg-red-900/20'  },
};

// ─── Tier Panel ───────────────────────────────────────────────────────────────

function TierPanel({
  title, count, color, items, icon
}: {
  title: string; count: number; color: 'green'|'yellow'|'red'; items: TaxpayerItem[]; icon: React.ReactNode
}) {
  const c = theme[color];
  return (
    <div className={cn('flex flex-col h-full rounded-xl border overflow-hidden', c.border)}>
      {/* Panel header */}
      <div className={cn('flex items-center justify-between px-3 py-2 shrink-0 border-b border-slate-700', c.headerBg)}>
        <div className="flex items-center gap-1.5">
          <span className={c.text}>{icon}</span>
          <h3 className="font-bold text-white text-xs">
            {title} <span className={cn('font-black', c.text)}>({count})</span>
          </h3>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-5 w-5 bg-blue-600 hover:bg-blue-700 text-white rounded">
            <Download className="h-2.5 w-2.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-5 w-5 bg-green-600 hover:bg-green-700 text-white rounded">
            <Download className="h-2.5 w-2.5" />
          </Button>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
        {items.length === 0 ? (
          <p className="text-slate-500 text-xs text-center py-6">Sin contribuyentes en este nivel</p>
        ) : items.map((t, i) => (
          <div key={t.id || i} className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700/50 transition-colors p-2">
            {/* Name + compliance */}
            <div className="flex items-center gap-2 mb-1.5">
              <div className={cn('w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0', c.badge)}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-xs truncate leading-tight">{t.name}</p>
                {t.rif && <p className="text-slate-500 text-[9px] leading-none mt-0.5">{t.rif}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className={cn('font-black text-sm tabular-nums', c.text)}>{t.compliance?.toFixed(2)}%</p>
              </div>
            </div>
            {/* Financials */}
            <div className="grid grid-cols-4 gap-px bg-slate-700 rounded overflow-hidden">
              {[['IVA', t.collectedIva], ['ISLR', t.collectedIslr], ['Multas', t.collectedFines], ['Total', t.total]].map(([label, val], j) => (
                <div key={j} className="bg-slate-900 px-1.5 py-1">
                  <p className="text-slate-600 text-[7px] uppercase">{label}</p>
                  <p className={cn('text-[8px] font-bold tabular-nums leading-tight', j === 3 ? c.text : 'text-slate-300')}>
                    {fmtBs(val as any)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Donut + KPI panel ────────────────────────────────────────────────────────

function DistributionPanel({ high, medium, low }: { high: number; medium: number; low: number }) {
  const total = high + medium + low;
  const data = [
    { name: 'Alto', value: high || 0,  color: '#22c55e' },
    { name: 'Medio', value: medium || 0, color: '#eab308' },
    { name: 'Bajo', value: low || Math.max(total, 1), color: '#ef4444' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-xs text-white shadow-xl">
        <p className="font-bold">{payload[0].payload.name}</p>
        <p className="text-slate-300">{payload[0].value} contribuyentes</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-700 shrink-0">
        <h3 className="text-white font-bold text-xs">Distribución de Cumplimiento</h3>
      </div>

      {/* Donut */}
      <div className="flex-1 relative min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius="45%" outerRadius="65%" paddingAngle={3} dataKey="value" stroke="none">
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="text-slate-500 text-[9px] block">Total</span>
            <span className="text-white text-2xl font-black leading-none">{total}</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 space-y-1 shrink-0 border-t border-slate-700">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-slate-400 flex-1">{d.name} Cumplimiento</span>
            <span className="font-bold text-white tabular-nums">{d.value}</span>
          </div>
        ))}
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-3 gap-1.5 px-3 pb-3 shrink-0">
        <div className="bg-green-900/20 border border-green-700/40 rounded-lg p-2 text-center">
          <p className="text-green-400 font-black text-xl leading-none">{high}</p>
          <p className="text-green-400/60 text-[9px] mt-0.5">Alto</p>
        </div>
        <div className="bg-amber-900/15 border border-amber-600/40 rounded-lg p-2 text-center">
          <p className="text-amber-400 font-black text-xl leading-none">{medium}</p>
          <p className="text-amber-400/60 text-[9px] mt-0.5">Medio</p>
        </div>
        <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-2 text-center">
          <p className="text-red-400 font-black text-xl leading-none">{low}</p>
          <p className="text-red-400/60 text-[9px] mt-0.5">Bajo</p>
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
      <div className="grid grid-cols-2 grid-rows-2 gap-3 p-4 h-full">
        {[1,2,3,4].map(i => (
          <div key={i} className="rounded-xl bg-slate-800 animate-pulse border border-slate-700" />
        ))}
      </div>
    );
  }

  const { high, medium, low } = data;

  return (
    // 2×2 grid that fills parent height — each cell has its own scroll
    <div className="grid grid-cols-2 grid-rows-2 gap-3 p-3 h-full">
      <TierPanel
        title="Cumplimiento Alto"
        count={high.length}
        color="green"
        items={high}
        icon={<ShieldCheck className="w-3.5 h-3.5" />}
      />
      <TierPanel
        title="Cumplimiento Medio"
        count={medium.length}
        color="yellow"
        items={medium}
        icon={<AlertCircle className="w-3.5 h-3.5" />}
      />
      <TierPanel
        title="Cumplimiento Bajo"
        count={low.length}
        color="red"
        items={low}
        icon={<XCircle className="w-3.5 h-3.5" />}
      />
      <DistributionPanel high={high.length} medium={medium.length} low={low.length} />
    </div>
  );
}
