import React, { useState, useEffect, useRef } from 'react';
import { getTopFiscals } from '@/components/utils/api/report-functions';
import { decimalToNumber } from '@/components/utils/number.utils';
import { Card } from '@/components/UI/card';
import { Trophy, TrendingUp, AlertTriangle, Filter, ChevronDown, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/UI/button';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TopFiscal {
  name: string;
  collectedIva: string;
  collectedIslr: string;
  collectedFines: string;
  total: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (val: unknown) => {
  const num = decimalToNumber(val);
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const fmtBs = (val: string | number) => `Bs.S ${fmt(val)}`;

const AVAILABLE_YEARS = [2024, 2025, 2026];

// ─── Rank decorations ─────────────────────────────────────────────────────────

const rankConfig: Record<number, { bg: string; border: string; badge: string; icon: React.ReactElement }> = {
  0: {
    bg: 'bg-amber-900/20',
    border: 'border-amber-500/40',
    badge: 'bg-amber-500 text-black',
    icon: <Trophy className="w-4 h-4 text-amber-400" />,
  },
  1: {
    bg: 'bg-slate-700/30',
    border: 'border-slate-400/30',
    badge: 'bg-slate-400 text-black',
    icon: <Medal className="w-4 h-4 text-slate-300" />,
  },
  2: {
    bg: 'bg-orange-900/15',
    border: 'border-orange-700/30',
    badge: 'bg-orange-700 text-white',
    icon: <Medal className="w-4 h-4 text-orange-500" />,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function StatsTopFiscales() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [fiscals, setFiscals] = useState<TopFiscal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    if (calendarOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [calendarOpen]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getTopFiscals(selectedYear);
        const data = (res as any)?.data ?? res ?? [];
        setFiscals(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e.message ?? 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [selectedYear]);

  // ─── Max total (for progress bar scaling) ────────────────────────────────
  const maxTotal = fiscals.length > 0
    ? Math.max(...fiscals.map(f => parseFloat(f.total) || 0))
    : 1;

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden animate-in fade-in duration-300">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <h1 className="text-white font-bold text-xl tracking-tight">Top Fiscales</h1>
          </div>
          <p className="text-slate-400 text-sm pl-10">
            Ranking de recaudación total — IVA · ISLR · Multas
          </p>
        </div>

        {/* Year selector */}
        <div className="flex items-center gap-2 text-slate-400 text-xs pl-0 sm:pl-0">
          <Filter className="w-4 h-4 text-indigo-400" />
          <span className="font-bold uppercase tracking-[0.15em] text-indigo-400">Período</span>
          <div className="relative" ref={calendarRef}>
            <Button
              variant="outline"
              onClick={() => setCalendarOpen(v => !v)}
              className="bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl h-9 gap-2 min-w-[110px] text-xs"
            >
              Año {selectedYear}
              <ChevronDown className={cn('w-3.5 h-3.5 opacity-50 transition-transform ml-auto', calendarOpen && 'rotate-180')} />
            </Button>
            {calendarOpen && (
              <div className="absolute top-full mt-2 right-0 w-40 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150 z-50">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Seleccionar Año</p>
                <div className="space-y-1">
                  {AVAILABLE_YEARS.map(year => (
                    <button
                      key={year}
                      onClick={() => { setSelectedYear(year); setCalendarOpen(false); }}
                      className={cn(
                        'w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                        selectedYear === year
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      )}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Loading ────────────────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 rounded-xl bg-slate-800/60 animate-pulse border border-slate-700/50" />
          ))}
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {!loading && error && (
        <Card className="bg-red-900/20 border-red-700/40 p-8 flex flex-col items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <p className="text-red-300 font-semibold">No se pudieron cargar los datos</p>
          <p className="text-red-400/70 text-sm text-center">{error}</p>
        </Card>
      )}

      {/* ── Empty ─────────────────────────────────────────────────────── */}
      {!loading && !error && fiscals.length === 0 && (
        <Card className="bg-slate-800 border-slate-700 p-10 flex flex-col items-center gap-2">
          <TrendingUp className="w-8 h-8 text-slate-500" />
          <p className="text-slate-400 font-medium">Sin datos para el año {selectedYear}</p>
          <p className="text-slate-500 text-xs">Selecciona otro período o espera que haya registros.</p>
        </Card>
      )}

      {/* ── Podium (Top 3) ────────────────────────────────────────────── */}
      {!loading && !error && fiscals.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3 items-end">
            {/* 2nd place */}
            {fiscals[1] ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-slate-400/20 border border-slate-400/40 flex items-center justify-center">
                  <span className="text-slate-300 font-black text-sm">2</span>
                </div>
                <Card className="w-full bg-slate-700/60 border-slate-500/30 p-3 text-center rounded-xl">
                  <p className="text-white font-semibold text-xs leading-tight truncate">{fiscals[1].name}</p>
                  <p className="text-slate-300 font-bold text-sm mt-1">{fmtBs(fiscals[1].total)}</p>
                  <div className="w-full h-1.5 rounded-full bg-slate-900/60 mt-2">
                    <div
                      className="h-full rounded-full bg-slate-400/80 transition-all duration-700"
                      style={{ width: `${(parseFloat(fiscals[1].total) / maxTotal) * 100}%` }}
                    />
                  </div>
                </Card>
                <div className="w-full h-8 bg-slate-600/40 rounded-t-md border-t border-slate-500/30" />
              </div>
            ) : <div />}

            {/* 1st place */}
            {fiscals[0] && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border-2 border-amber-400/60 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Trophy className="w-5 h-5 text-amber-400" />
                </div>
                <Card className="w-full bg-amber-900/25 border-amber-500/40 p-4 text-center rounded-xl shadow-lg shadow-amber-900/20">
                  <p className="text-amber-200 font-bold text-xs leading-tight truncate">{fiscals[0].name}</p>
                  <p className="text-amber-400 font-black text-base mt-1.5 tabular-nums">{fmtBs(fiscals[0].total)}</p>
                  <div className="w-full h-1.5 rounded-full bg-slate-900/60 mt-2.5">
                    <div className="h-full rounded-full bg-amber-400/90 transition-all duration-700 w-full" />
                  </div>
                </Card>
                <div className="w-full h-14 bg-amber-500/20 rounded-t-md border-t border-amber-500/30" />
              </div>
            )}

            {/* 3rd place */}
            {fiscals[2] ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-orange-700/20 border border-orange-600/40 flex items-center justify-center">
                  <span className="text-orange-400 font-black text-sm">3</span>
                </div>
                <Card className="w-full bg-orange-900/15 border-orange-700/30 p-3 text-center rounded-xl">
                  <p className="text-orange-200 font-semibold text-xs leading-tight truncate">{fiscals[2].name}</p>
                  <p className="text-orange-300 font-bold text-sm mt-1">{fmtBs(fiscals[2].total)}</p>
                  <div className="w-full h-1.5 rounded-full bg-slate-900/60 mt-2">
                    <div
                      className="h-full rounded-full bg-orange-600/80 transition-all duration-700"
                      style={{ width: `${(parseFloat(fiscals[2].total) / maxTotal) * 100}%` }}
                    />
                  </div>
                </Card>
                <div className="w-full h-4 bg-orange-800/30 rounded-t-md border-t border-orange-700/30" />
              </div>
            ) : <div />}
          </div>

          {/* ── Full Ranking List ──────────────────────────────────────── */}
          <Card className="bg-slate-800 border-slate-700 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2 bg-slate-800/80">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <h3 className="font-semibold text-white text-sm">Ranking General — {selectedYear}</h3>
              <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-700/60 px-2 py-0.5 rounded-full">
                {fiscals.length} fiscales
              </span>
            </div>

            <div className="divide-y divide-slate-700/50">
              {fiscals.map((fiscal, idx) => {
                const rank = rankConfig[idx];
                const total = parseFloat(fiscal.total) || 0;
                const iva = parseFloat(fiscal.collectedIva) || 0;
                const islr = parseFloat(fiscal.collectedIslr) || 0;
                const fines = parseFloat(fiscal.collectedFines) || 0;
                const barWidth = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

                return (
                  <div
                    key={idx}
                    className={cn(
                      'flex flex-col gap-3 p-4 transition-colors hover:bg-slate-700/30',
                      rank ? rank.bg : '',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Rank bubble */}
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-black',
                        rank ? rank.badge : 'bg-slate-700 text-slate-300'
                      )}>
                        {idx + 1}
                      </div>

                      {/* Name + Icon */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {rank?.icon}
                          <h4 className="text-white font-semibold text-sm truncate">{fiscal.name}</h4>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-1.5 rounded-full bg-slate-900/60 mt-2">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-700',
                              idx === 0 ? 'bg-amber-400/90' :
                              idx === 1 ? 'bg-slate-400/80' :
                              idx === 2 ? 'bg-orange-600/80' :
                              'bg-indigo-500/70'
                            )}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>

                      {/* Total */}
                      <div className="text-right shrink-0">
                        <p className="text-green-400 font-bold text-sm tabular-nums">{fmtBs(fiscal.total)}</p>
                        <p className="text-slate-500 text-[10px] uppercase tracking-wider mt-0.5">Total</p>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-900/40 rounded-lg p-2.5 border border-slate-700/40">
                      <div>
                        <p className="text-blue-400/70 text-[9px] uppercase tracking-wider mb-0.5">IVA</p>
                        <p className="text-blue-200 text-xs font-medium tabular-nums">{fmtBs(iva)}</p>
                      </div>
                      <div className="border-x border-slate-700/50 px-2">
                        <p className="text-purple-400/70 text-[9px] uppercase tracking-wider mb-0.5">ISLR</p>
                        <p className="text-purple-200 text-xs font-medium tabular-nums">{fmtBs(islr)}</p>
                      </div>
                      <div className="pl-1">
                        <p className="text-orange-400/70 text-[9px] uppercase tracking-wider mb-0.5">Multas</p>
                        <p className="text-orange-300 text-xs font-medium tabular-nums">{fmtBs(fines)}</p>
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
