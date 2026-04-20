import { useState, useEffect } from 'react';
import {
  getBestSupervisors,
  getTopFiveByGroup,
  getTopFiscals,
} from '@/components/utils/api/report-functions';
import { decimalToNumber } from '@/components/utils/number.utils';
import { Trophy, Users, TrendingUp, AlertTriangle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SupervisorGroup {
  groupId: string;
  groupName: string;
  best: { name: string; collectedIva: string|number; collectedIslr: string|number; collectedFines: string|number; total: string|number } | null;
  worst: { name: string; collectedIva: string|number; collectedIslr: string|number; collectedFines: string|number; total: string|number } | null;
}

interface TopFiscalByGroup {
  groupId: string;
  groupName: string;
  fiscals: { name: string; total: string|number }[];
}

interface TopFiscal {
  name: string;
  collectedIva: string|number;
  collectedIslr: string|number;
  collectedFines: string|number;
  total: string|number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtBs = (val: unknown) => {
  const n = decimalToNumber(val);
  return n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const rankBadge = (i: number) =>
  i === 0 ? 'bg-amber-500 text-black' :
  i === 1 ? 'bg-slate-400 text-black' :
  i === 2 ? 'bg-orange-700 text-white' :
  'bg-slate-700 text-slate-300';

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-700 shrink-0 bg-slate-900/80">
      {icon}
      <span className="text-white font-bold text-sm tracking-tight">{title}</span>
      {count !== undefined && (
        <span className="ml-auto text-[10px] text-slate-500 bg-slate-800 border border-slate-600 px-2 py-0.5 rounded-full tabular-nums">
          {count}
        </span>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function Empty() {
  return (
    <div className="flex items-center gap-2 text-slate-500 text-xs py-6 px-4">
      <AlertTriangle className="w-4 h-4 shrink-0" /> Sin datos disponibles
    </div>
  );
}

// ─── Supervisor row ───────────────────────────────────────────────────────────

function SupervisorAccordion({ grp, expanded, onToggle }: {
  grp: SupervisorGroup;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mx-3 mb-2 rounded-lg border border-slate-600 bg-slate-800 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-700/50 transition-colors"
      >
        <span className="text-blue-400 font-semibold text-xs uppercase tracking-wider">{grp.groupName}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-slate-500 transition-transform duration-200', expanded && 'rotate-180')} />
      </button>

      {expanded && (grp.best || grp.worst) && (
        <div className="px-3 pb-3 space-y-2">
          {grp.best && (
            <div className="rounded-lg p-2.5 bg-green-900/20 border border-green-700/40">
              <p className="text-green-400 text-[10px] font-bold mb-1.5">🏆 Mejor: {grp.best.name}</p>
              <div className="grid grid-cols-4 gap-1">
                {[['IVA', grp.best.collectedIva, 'text-blue-300'], ['ISLR', grp.best.collectedIslr, 'text-purple-300'], ['Multas', grp.best.collectedFines, 'text-orange-300'], ['Total', grp.best.total, 'text-green-400']].map(([label, val, cls]) => (
                  <div key={label as string}>
                    <p className="text-slate-500 text-[8px]">{label}</p>
                    <p className={cn('text-[9px] font-semibold tabular-nums leading-tight', cls)}>{fmtBs(val as any)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {grp.worst && (
            <div className="rounded-lg p-2.5 bg-red-900/20 border border-red-700/40">
              <p className="text-red-400 text-[10px] font-bold mb-1.5">↓ Menor: {grp.worst.name}</p>
              <div className="grid grid-cols-4 gap-1">
                {[['IVA', grp.worst.collectedIva], ['ISLR', grp.worst.collectedIslr], ['Multas', grp.worst.collectedFines], ['Total', grp.worst.total]].map(([label, val]) => (
                  <div key={label as string}>
                    <p className="text-slate-500 text-[8px]">{label}</p>
                    <p className="text-[9px] font-semibold text-red-300 tabular-nums leading-tight">{fmtBs(val as any)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StatsPage2Rankings({ year }: { year: number }) {
  const [supervisors, setSupervisors] = useState<SupervisorGroup[]>([]);
  const [topByGroup, setTopByGroup] = useState<TopFiscalByGroup[]>([]);
  const [topFiscals, setTopFiscals] = useState<TopFiscal[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [supRes, topGroupRes, topFRes] = await Promise.allSettled([
          getBestSupervisors(year),
          getTopFiveByGroup(year),
          getTopFiscals(year),
        ]);
        if (supRes.status === 'fulfilled') {
          const raw = (supRes.value as any)?.data ?? supRes.value;

          const mapSup = (s: any) => s ? {
            name: s.name ?? '',
            collectedIva:   decimalToNumber(s.collectedIva),
            collectedIslr:  decimalToNumber(s.collectedIslr),
            collectedFines: decimalToNumber(s.collectedFines),
            total:          decimalToNumber(s.total),
          } : null;

          // API returns object: { "COORDINACION N": { best, worse, supervisors[] } }
          const mapped = raw && typeof raw === 'object' && !Array.isArray(raw)
            ? Object.entries(raw).map(([groupName, groupData]: [string, any]) => {
                const supervisors: any[] = groupData.supervisors ?? [];
                const bestSup  = supervisors.find(s => s.name === groupData.best)  ?? supervisors[0] ?? null;
                const worstSup = supervisors.find(s => s.name === groupData.worse) ?? supervisors[1] ?? null;
                return {
                  groupId:   groupName,
                  groupName,
                  best:  mapSup(bestSup),
                  worst: mapSup(worstSup),
                };
              })
            : Array.isArray(raw) ? raw : [];

          setSupervisors(mapped);
          if (mapped.length > 0) setExpandedGroup(mapped[0].groupId);
        }
        if (topGroupRes.status === 'fulfilled') {
          const raw = (topGroupRes.value as any)?.data ?? topGroupRes.value;
          // API returns a plain object: { "COORDINACION 1": [...fiscals], "COORDINACION 2": [...] }
          const mapped = raw && typeof raw === 'object' && !Array.isArray(raw)
            ? Object.entries(raw).map(([groupName, fiscals]) => ({
                groupId: groupName,
                groupName,
                fiscals: (fiscals as any[]).map((f) => ({
                  name: f.name ?? '',
                  total: decimalToNumber(f.totalCollected),
                })),
              }))
            : Array.isArray(raw) ? raw : [];
          setTopByGroup(mapped);
        }
        if (topFRes.status === 'fulfilled') {
          const raw = (topFRes.value as any)?.data ?? topFRes.value;
          setTopFiscals(Array.isArray(raw) ? raw : []);
        }
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
      <div className="grid grid-cols-1 md:grid-cols-2 h-full gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-700">
        {[1, 2].map(i => (
          <div key={i} className="p-4 space-y-3">
            {[1, 2, 3, 4].map(j => (
              <div key={j} className="h-20 rounded-lg bg-slate-800 animate-pulse border border-slate-700" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    // Two fixed-height columns on desktop, stacked on mobile
    <div className="grid grid-cols-1 md:grid-cols-2 h-full divide-y md:divide-y-0 md:divide-x divide-slate-700 overflow-y-auto md:overflow-hidden custom-scrollbar">

      {/* ── LEFT col: split into top half / bottom half ──────────────── */}
      <div className="flex flex-col h-full divide-y divide-slate-700 min-h-0">

        {/* Supervisors — top half */}
        <div className="flex flex-col flex-1 min-h-0">
          <SectionHeader
            icon={<Trophy className="w-3.5 h-3.5 text-amber-400" />}
            title="Mejor Supervisor por Coordinaciones"
          />
          <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
            {supervisors.length === 0 ? <Empty /> : supervisors.map(grp => (
              <SupervisorAccordion
                key={grp.groupId}
                grp={grp}
                expanded={expandedGroup === grp.groupId}
                onToggle={() => setExpandedGroup(expandedGroup === grp.groupId ? null : grp.groupId)}
              />
            ))}
          </div>
        </div>

        {/* Top 5 por coordinación — bottom half */}
        <div className="flex flex-col flex-1 min-h-0">
          <SectionHeader
            icon={<Users className="w-3.5 h-3.5 text-blue-400" />}
            title="Top 5 Fiscales por Coordinación"
          />
          <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
            {topByGroup.length === 0 ? <Empty /> : topByGroup.map(grp => (
              <div key={grp.groupId} className="px-3 mb-4">
                <p className="text-blue-400 font-bold text-[10px] uppercase tracking-wider mb-2">{grp.groupName}</p>
                <div className="space-y-1.5">
                  {(grp.fiscals ?? []).slice(0, 5).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-600 hover:bg-slate-700/50 transition-colors">
                      <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0', rankBadge(i))}>
                        {i + 1}
                      </span>
                      <p className="text-slate-200 text-xs flex-1 truncate font-medium">{f.name}</p>
                      <p className="text-green-400 text-xs font-bold tabular-nums shrink-0">{fmtBs(f.total)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT col: Top Fiscales Ranking General ───────────────────── */}
      <div className="flex flex-col h-full min-h-0">
        <SectionHeader
          icon={<TrendingUp className="w-3.5 h-3.5 text-indigo-400" />}
          title="Top Fiscales — Ranking General"
          count={topFiscals.length}
        />
        <div className="flex-1 overflow-y-auto py-2 px-3 space-y-2 custom-scrollbar">
          {topFiscals.length === 0 ? <Empty /> : topFiscals.map((f, i) => (
            <div
              key={i}
              className={cn(
                'rounded-xl border p-3 transition-colors group',
                i === 0 ? 'bg-amber-900/20 border-amber-600/30' :
                i === 1 ? 'bg-slate-700/20 border-slate-500/30' :
                i === 2 ? 'bg-orange-900/15 border-orange-700/25' :
                'bg-slate-800 border-slate-700 hover:bg-slate-700/50'
              )}
            >
              {/* Name row */}
              <div className="flex items-center gap-2.5 mb-2">
                <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0', rankBadge(i))}>
                  {i + 1}
                </span>
                <p className="text-white font-semibold text-sm flex-1 truncate">{f.name}</p>
                <p className="text-green-400 font-bold text-sm tabular-nums shrink-0">
                  Bs.S {fmtBs(f.total)}
                </p>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-3 gap-px bg-slate-700 rounded-lg overflow-hidden text-[10px]">
                <div className="bg-slate-900 px-2 py-1.5">
                  <p className="text-blue-400/60 text-[8px] uppercase mb-0.5">IVA</p>
                  <p className="text-blue-200 font-semibold tabular-nums">{fmtBs(f.collectedIva)}</p>
                </div>
                <div className="bg-slate-900 px-2 py-1.5">
                  <p className="text-purple-400/60 text-[8px] uppercase mb-0.5">ISLR</p>
                  <p className="text-purple-200 font-semibold tabular-nums">{fmtBs(f.collectedIslr)}</p>
                </div>
                <div className="bg-slate-900 px-2 py-1.5">
                  <p className="text-orange-400/60 text-[8px] uppercase mb-0.5">Multas</p>
                  <p className="text-orange-300 font-semibold tabular-nums">{fmtBs(f.collectedFines)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
