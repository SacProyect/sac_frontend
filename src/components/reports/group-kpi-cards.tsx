import { GroupRecordsApiResponse } from '@/types/group-records';
import { DollarSign, AlertTriangle, Scale, Handshake, Users } from 'lucide-react';

interface GroupKpiCardsProps {
  data: GroupRecordsApiResponse | null;
}

interface KpiData {
  totalCollection: number;
  totalFines: number;
  totalWarnings: number;
  totalCompromises: number;
  totalTaxpayers: number;
}

function calculateKpis(data: GroupRecordsApiResponse): KpiData {
  const records = data.records;
  return {
    totalCollection: records.reduce((sum, r) =>
      sum + Number(r.collectedFines ?? 0) + Number(r.collectedIVA ?? 0) + Number(r.collectedISLR ?? 0), 0),
    totalFines: records.reduce((sum, r) => sum + (r.fines ?? 0), 0),
    totalWarnings: records.reduce((sum, r) => sum + (r.warnings ?? 0), 0),
    totalCompromises: records.reduce((sum, r) => sum + (r.compromises ?? 0), 0),
    totalTaxpayers: records.reduce((sum, r) => sum + (r.taxpayers ?? 0), 0),
  };
}

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('es-VE', { maximumFractionDigits: 0 });
};

function KpiCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4 flex flex-col gap-2 hover:border-slate-600 transition-all">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-lg ${color} shrink-0`}>{icon}</div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-black text-white tabular-nums leading-none">{value}</p>
      {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
    </div>
  );
}

export function GroupKpiCards({ data }: GroupKpiCardsProps) {
  if (!data) return null;
  const kpis = calculateKpis(data);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <KpiCard
        icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
        label="Recaudado"
        value={`Bs. ${fmt(kpis.totalCollection)}`}
        sub="Multas + IVA + ISLR"
        color="bg-emerald-500/10"
      />
      <KpiCard
        icon={<Scale className="w-4 h-4 text-red-400" />}
        label="Multas"
        value={kpis.totalFines.toLocaleString('es-VE')}
        sub="Total registradas"
        color="bg-red-500/10"
      />
      <KpiCard
        icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
        label="Avisos"
        value={kpis.totalWarnings.toLocaleString('es-VE')}
        sub="Total emitidos"
        color="bg-amber-500/10"
      />
      <KpiCard
        icon={<Handshake className="w-4 h-4 text-blue-400" />}
        label="Compromisos"
        value={kpis.totalCompromises.toLocaleString('es-VE')}
        sub="Total registrados"
        color="bg-blue-500/10"
      />
      <KpiCard
        icon={<Users className="w-4 h-4 text-indigo-400" />}
        label="Contribuyentes"
        value={kpis.totalTaxpayers.toLocaleString('es-VE')}
        sub="Asignados al grupo"
        color="bg-indigo-500/10"
      />
    </div>
  );
}
