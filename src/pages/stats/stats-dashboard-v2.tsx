import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/UI/button';
import { LoadingState } from '@/components/UI/v2';

import {
  getGlobalPerformance,
  getGlobalTaxpayerPerformance,
  getGroupPerformance,
} from '@/components/utils/api/report-functions';
import { decimalToNumber } from '@/components/utils/number.utils';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/UI/select";
import { Filter, CalendarDays, Activity } from 'lucide-react';

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
            realAmount: decimalToNumber(d.realAmount),
            expectedAmount: decimalToNumber(d.expectedAmount),
            taxpayersEmitted: d.taxpayersEmitted ?? 0,
          }));
          setChartData(mapped);

          const monthStats: MonthlyIvaStats = {
            year,
            months: (globalPerf.value as any[]).map((d) => ({
              monthIndex: d.month - 1,
              monthName: months[d.month - 1] ?? `Mes ${d.month}`,
              ivaCollected: decimalToNumber(d.realAmount),
            })),
            totalIvaCollected: (globalPerf.value as any[]).reduce((s: number, d: any) => s + decimalToNumber(d.realAmount), 0),
          };
          setIvaStats(monthStats);
        }

        if (groupPerf.status === 'fulfilled' && Array.isArray(groupPerf.value)) {
          const mappedGroups = (groupPerf.value as any[]).map(g => ({
            ...g,
            totalPaidFines: decimalToNumber(g.totalPaidFines),
            totalPaidAmount: decimalToNumber(g.totalPaidAmount),
            totalIvaCollected: decimalToNumber(g.totalIvaCollected),
            totalIslrCollected: decimalToNumber(g.totalIslrCollected),
          }));
          setGroupStats(mappedGroups as GroupStat[]);
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

  // Un solo bloque con cruz (1 línea vert. + 1 horiz.) en sm+; en móvil solo separadores horizontales
  const qBase = 'min-h-0 overflow-hidden bg-slate-900/50';
  return (
    <div className="mx-auto flex h-full min-h-0 w-full min-w-0 max-w-5xl flex-1 flex-col px-2 py-2 sm:px-3 md:py-3">
      <div className="grid h-full min-h-0 flex-1 auto-rows-[minmax(0,1fr)] grid-cols-1 overflow-hidden rounded-lg border border-slate-700/80 sm:grid-cols-2 sm:grid-rows-2">
        <div className={`${qBase} border-b border-slate-700/60 sm:border-b sm:border-r`}>
          <PageOneStats chartData={chartData} />
        </div>

        <div className={`${qBase} border-b border-slate-700/60 sm:border-b`}>
          {ivaStats ? (
            <PageTwoStats stats={ivaStats} />
          ) : (
            <div className="flex h-full min-h-[80px] items-center justify-center text-slate-400 text-sm">Sin datos</div>
          )}
        </div>

        <div className={`${qBase} border-b border-slate-700/60 sm:border-b-0 sm:border-r`}>
          <GroupPerformanceStats groupStats={groupStats} />
        </div>

        <div className={qBase}>
          <IvaByGroupChart year={year} />
        </div>
      </div>
    </div>
  );
}

// ─── Page labels ──────────────────────────────────────────────────────────────

const PAGES = ['Gráficas', 'Rankings', 'Cumplimiento'];

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function StatsDashboardV2() {
  const [page, setPage] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear());

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div
      className="mx-auto -mt-2 flex h-[calc(100dvh-4.5rem)] max-h-[calc(100dvh-4.5rem)] w-full min-w-0 max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl md:-mt-3"
    >
      {/* ── Filter Bar ──────────────────────────────────────────────── */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 border-b border-slate-700 bg-slate-900/50 backdrop-blur-md min-w-0">
        <div className="flex min-w-0 items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Filtros de Análisis</h2>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Estadísticas Consolidadas</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
          <form 
            className="flex min-w-0 items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-1.5 sm:px-4 transition-all focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20"
            onSubmit={(e) => e.preventDefault()}
          >
            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
            <label htmlFor="year-select" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Período</label>
            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger id="year-select" className="h-7 w-[110px] bg-slate-950/50 border-slate-700 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors rounded-lg">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-300">
                {years.map(y => (
                  <SelectItem key={y} value={y.toString()} className="text-xs hover:bg-slate-800 focus:bg-slate-800 focus:text-white cursor-pointer">
                    Año {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </form>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 px-3 border-slate-700 bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl gap-2 text-xs"
            onClick={() => window.location.reload()}
          >
            <Activity className="w-3.5 h-3.5" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* ── Page content: página 1 rellena el área (sin scroll); 2 y 3 desplazables */}
      <div
        className={
          page === 1
            ? 'min-h-0 flex-1 overflow-hidden flex flex-col'
            : 'min-h-0 flex-1 overflow-y-auto custom-scrollbar'
        }
      >
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
