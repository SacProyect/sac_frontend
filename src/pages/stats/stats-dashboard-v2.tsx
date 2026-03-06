import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/UI/button';
import { LoadingState } from '@/components/UI/v2';

import {
  getGlobalPerformance,
  getGlobalTaxpayerPerformance,
  getGroupPerformance,
} from '@/components/utils/api/report-functions';

import PageOneStats, { ChartData } from '@/components/stats/global-perfomance';
import { PageTwoStats, MonthlyIvaStats } from '@/components/stats/global-taxpayer-performance';
import { GroupPerformanceStats, GroupStat } from '@/components/stats/group-performance-stats';
import { IvaByGroupChart } from '@/components/stats/iva-by-group-chart';

import StatsPage2Rankings from './stats-page2-rankings';
import StatsPage3Cumplimiento from './stats-page3-cumplimiento';

// ─── Page 1: 2×2 Grid ─────────────────────────────────────────────────────────

function StatsPage1Charts({ year }: { year: number }) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [ivaStats, setIvaStats] = useState<MonthlyIvaStats | null>(null);
  const [groupStats, setGroupStats] = useState<GroupStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [globalPerf, , groupPerf] = await Promise.allSettled([
          getGlobalPerformance(year),
          getGlobalTaxpayerPerformance(year),
          getGroupPerformance(year),
        ]);

        if (globalPerf.status === 'fulfilled' && Array.isArray(globalPerf.value)) {
          const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
          const mapped: ChartData[] = (globalPerf.value as any[]).map((d) => ({
            month: `${year}-${String(d.month).padStart(2,'0')}`,
            realAmount: d.realAmount ?? 0,
            expectedAmount: d.expectedAmount ?? 0,
            taxpayersEmitted: d.taxpayersEmitted ?? 0,
          }));
          setChartData(mapped);

          const monthStats: MonthlyIvaStats = {
            year,
            months: (globalPerf.value as any[]).map((d) => ({
              monthIndex: d.month - 1,
              monthName: months[d.month - 1] ?? `Mes ${d.month}`,
              ivaCollected: d.realAmount ?? 0,
            })),
            totalIvaCollected: (globalPerf.value as any[]).reduce((s: number, d: any) => s + (d.realAmount ?? 0), 0),
          };
          setIvaStats(monthStats);
        }

        if (groupPerf.status === 'fulfilled' && Array.isArray(groupPerf.value)) {
          setGroupStats(groupPerf.value as GroupStat[]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [year]);

  if (loading) return <LoadingState message="Cargando gráficas..." />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 h-full overflow-y-auto md:overflow-hidden custom-scrollbar">
      {/* Top-left */}
      <div className="overflow-hidden border-b md:border-r border-slate-700 min-h-[400px] md:min-h-0">
        <PageOneStats chartData={chartData} />
      </div>

      {/* Top-right */}
      <div className="overflow-hidden border-b border-slate-700 min-h-[400px] md:min-h-0">
        {ivaStats ? (
          <PageTwoStats stats={ivaStats} />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm py-20 md:py-0">Sin datos</div>
        )}
      </div>

      {/* Bottom-left */}
      <div className="overflow-y-auto border-b md:border-b-0 md:border-r border-slate-700 custom-scrollbar min-h-[400px] md:min-h-0">
        <GroupPerformanceStats groupStats={groupStats} />
      </div>

      {/* Bottom-right */}
      <div className="overflow-hidden min-h-[400px] md:min-h-0">
        <IvaByGroupChart year={year} />
      </div>
    </div>
  );
}

// ─── Page labels ──────────────────────────────────────────────────────────────

const PAGES = ['Gráficas', 'Rankings', 'Cumplimiento'];

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function StatsDashboardV2() {
  const [page, setPage] = useState(1);
  const [year] = useState(new Date().getFullYear());

  return (
    <div
      className="flex flex-col bg-slate-900 rounded-xl border border-slate-700 shadow-xl overflow-hidden h-auto min-h-[calc(100vh-120px)] md:h-[calc(100vh-80px)]"
    >
      {/* ── Page content ─────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        {page === 1 && <StatsPage1Charts year={year} />}
        {page === 2 && <StatsPage2Rankings year={year} />}
        {page === 3 && <StatsPage3Cumplimiento year={year} />}
      </div>

      {/* ── Pagination bar ────────────────────────────────────────────── */}
      <div className="shrink-0 flex justify-center items-center py-2.5 border-t border-slate-700 bg-slate-900/80">
        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 shadow-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 h-7 text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Anterior
          </Button>

          {PAGES.map((label, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`h-7 min-w-[28px] px-3 rounded-lg text-xs font-semibold transition-all ${
                page === i + 1
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {i + 1}
            </button>
          ))}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(p => Math.min(3, p + 1))}
            disabled={page === 3}
            className="text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 h-7 text-xs"
          >
            Siguiente
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
