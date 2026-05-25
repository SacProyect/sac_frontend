import { GroupRecordsApiResponse } from '@/types/group-records';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useMemo } from 'react';

interface GroupChartsProps {
  data: GroupRecordsApiResponse | null;
}

const PROCESS_LABELS: Record<string, string> = { FP: 'FP', AF: 'AF', VDF: 'VDF', NA: 'N/A' };
const PROCESS_COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#6b7280'];

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('es-VE', { maximumFractionDigits: 0 });
};

const formatTooltip = (value: number) => `Bs. ${value.toLocaleString('es-VE', { maximumFractionDigits: 0 })}`;

export function GroupCharts({ data }: GroupChartsProps) {
  const barData = useMemo(() => {
    if (!data) return [];
    const grouped = new Map<string, { name: string; total: number }>();
    for (const r of data.records) {
      const name = r.fiscal.name;
      const total = Number(r.collectedFines ?? 0) + Number(r.collectedIVA ?? 0) + Number(r.collectedISLR ?? 0);
      if (grouped.has(name)) {
        grouped.get(name)!.total += total;
      } else {
        grouped.set(name, { name, total });
      }
    }
    return Array.from(grouped.values()).sort((a, b) => b.total - a.total);
  }, [data]);

  const pieData = useMemo(() => {
    if (!data) return [];
    const counts: Record<string, number> = { FP: 0, AF: 0, VDF: 0, NA: 0 };
    for (const r of data.records) {
      if (counts[r.process] !== undefined) counts[r.process]++;
      else counts.NA++;
    }
    return Object.entries(counts)
      .filter(([_, v]) => v > 0)
      .map(([name, value]) => ({ name: PROCESS_LABELS[name], value }));
  }, [data]);

  if (!data || (barData.length === 0 && pieData.length === 0)) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar Chart - Collection per Fiscal */}
      <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4">
        <h3 className="text-sm font-bold text-white mb-4">Recaudación por Fiscal</h3>
        {barData.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" interval={0} height={60} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                  formatter={formatTooltip}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-slate-500 text-sm py-10 text-center">Sin datos de recaudación</p>
        )}
      </div>

      {/* Pie Chart - Process Distribution */}
      <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4">
        <h3 className="text-sm font-bold text-white mb-4">Distribución por Proceso</h3>
        {pieData.length > 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#64748b' }}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PROCESS_COLORS[index % PROCESS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value} registros`, 'Cantidad']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-slate-500 text-sm py-10 text-center">Sin datos de procesos</p>
        )}
      </div>
    </div>
  );
}
