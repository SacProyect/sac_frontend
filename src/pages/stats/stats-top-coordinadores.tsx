import { useState, useEffect } from 'react';
import { getTopCoordinators } from '@/components/utils/api/report-functions';
import { Card } from '@/components/UI/card';
import { Users, TrendingUp, AlertTriangle, Crown, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TopCoordinator {
  groupId: string;
  groupName: string;
  coordinatorName: string;
  totalActiveTaxpayers: number;
  goodComplianceCount: number;
  performance: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const perfColor = (pct: number) => {
  if (pct >= 75) return { text: 'text-emerald-400', bar: 'bg-emerald-500/80', bg: 'bg-emerald-900/10', border: 'border-emerald-600/25' };
  if (pct >= 50) return { text: 'text-amber-400', bar: 'bg-amber-500/80', bg: 'bg-amber-900/10', border: 'border-amber-600/25' };
  return { text: 'text-red-400', bar: 'bg-red-500/75', bg: 'bg-red-900/10', border: 'border-red-700/25' };
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function StatsTopCoordinadores() {
  const [coordinators, setCoordinators] = useState<TopCoordinator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getTopCoordinators();
        const data = (res as any)?.data ?? res ?? [];
        setCoordinators(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e.message ?? 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // ── Avg performance ───────────────────────────────────────────────────────
  const avgPerf = coordinators.length > 0
    ? coordinators.reduce((s, c) => s + c.performance, 0) / coordinators.length
    : 0;

  const totalTaxpayers = coordinators.reduce((s, c) => s + c.totalActiveTaxpayers, 0);
  const totalGood = coordinators.reduce((s, c) => s + c.goodComplianceCount, 0);

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden animate-in fade-in duration-300">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
              <Crown className="w-4 h-4 text-indigo-400" />
            </div>
            <h1 className="text-white font-bold text-xl tracking-tight">Top Coordinadores</h1>
          </div>
          <p className="text-slate-400 text-sm pl-10">
            Ranking por porcentaje de contribuyentes con buen cumplimiento — año en curso
          </p>
        </div>

        {/* Live badge */}
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-700/30 rounded-full px-3 py-1 self-start sm:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Año en curso
        </div>
      </div>

      {/* ── Loading ────────────────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 rounded-xl bg-slate-800/60 animate-pulse border border-slate-700/50" />
          ))}
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {!loading && error && (
        <Card className="bg-red-900/20 border-red-700/40 p-8 flex flex-col items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <p className="text-red-300 font-semibold">No se pudieron cargar los datos</p>
          <p className="text-red-400/70 text-sm text-center max-w-sm">{error}</p>
        </Card>
      )}

      {/* ── Empty ─────────────────────────────────────────────────────── */}
      {!loading && !error && coordinators.length === 0 && (
        <Card className="bg-slate-800 border-slate-700 p-10 flex flex-col items-center gap-2">
          <Users className="w-8 h-8 text-slate-500" />
          <p className="text-slate-400 font-medium">Sin coordinadores disponibles</p>
          <p className="text-slate-500 text-xs">No se encontraron grupos fiscales con coordinador asignado.</p>
        </Card>
      )}

      {/* ── KPI Summary Bar ───────────────────────────────────────────── */}
      {!loading && !error && coordinators.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-slate-800 border-slate-700 p-4 flex flex-col gap-1">
              <p className="text-slate-500 text-[10px] uppercase tracking-wider">Grupos</p>
              <p className="text-white font-bold text-xl tabular-nums">{coordinators.length}</p>
              <p className="text-slate-400 text-[10px]">coordinaciones</p>
            </Card>
            <Card className="bg-slate-800 border-slate-700 p-4 flex flex-col gap-1">
              <p className="text-slate-500 text-[10px] uppercase tracking-wider">Contribuyentes</p>
              <p className="text-white font-bold text-xl tabular-nums">{totalTaxpayers.toLocaleString()}</p>
              <p className="text-emerald-400 text-[10px]">{totalGood.toLocaleString()} en buen cumplimiento</p>
            </Card>
            <Card className={cn('border p-4 flex flex-col gap-1', perfColor(avgPerf).bg, perfColor(avgPerf).border)}>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider">Rendimiento Promedio</p>
              <p className={cn('font-bold text-xl tabular-nums', perfColor(avgPerf).text)}>
                {avgPerf.toFixed(1)}%
              </p>
              <p className="text-slate-400 text-[10px]">entre todos los grupos</p>
            </Card>
          </div>

          {/* ── Ranking List ──────────────────────────────────────────── */}
          <Card className="bg-slate-800 border-slate-700 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2 bg-slate-800/80">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <h3 className="font-semibold text-white text-sm">Ranking de Coordinadores</h3>
              <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-700/60 px-2 py-0.5 rounded-full">
                Ordenado por rendimiento ↓
              </span>
            </div>

            <div className="divide-y divide-slate-700/50">
              {coordinators.map((coord, idx) => {
                const pct = Math.min(100, Math.max(0, coord.performance));
                const colors = perfColor(pct);

                return (
                  <div
                    key={coord.groupId ?? idx}
                    className={cn(
                      'p-4 transition-colors hover:bg-slate-700/30',
                      idx === 0 ? 'bg-indigo-900/10' : ''
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Rank */}
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-black',
                        idx === 0 ? 'bg-indigo-500 text-white' :
                        idx === 1 ? 'bg-slate-500 text-white' :
                        'bg-slate-700 text-slate-300'
                      )}>
                        {idx + 1}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-0.5">
                          <h4 className="text-white font-semibold text-sm">{coord.coordinatorName}</h4>
                          {idx === 0 && <Crown className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                          <span className="text-slate-500 text-[10px]">— {coord.groupName}</span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-2 rounded-full bg-slate-900/60 mt-2 mb-1.5">
                          <div
                            className={cn('h-full rounded-full transition-all duration-700 ease-out', colors.bar)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        {/* Taxpayer counts */}
                        <div className="flex items-center gap-3 text-[10px]">
                          <div className="flex items-center gap-1 text-slate-400">
                            <Users className="w-3 h-3" />
                            {coord.totalActiveTaxpayers} activos
                          </div>
                          <div className="flex items-center gap-1 text-emerald-400">
                            <ShieldCheck className="w-3 h-3" />
                            {coord.goodComplianceCount} buen cumplimiento
                          </div>
                        </div>
                      </div>

                      {/* Performance % */}
                      <div className={cn(
                        'text-right shrink-0 flex flex-col items-end gap-0.5 px-3 py-1.5 rounded-lg border',
                        colors.bg, colors.border
                      )}>
                        <p className={cn('font-black text-lg tabular-nums leading-none', colors.text)}>
                          {pct.toFixed(1)}%
                        </p>
                        <p className="text-slate-500 text-[9px] uppercase tracking-wider">Rendimiento</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
