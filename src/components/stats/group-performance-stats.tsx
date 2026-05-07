import React, { useEffect, useRef } from "react";
import { StatsDesignVariant } from "./global-perfomance";

export interface GroupStat {
    groupName: string;
    totalPaidFines: number;
    totalPaidAmount: number;
    totalIvaCollected: number;
    totalIslrCollected: number;
}

interface Props {
    groupStats: GroupStat[];
    designVariant?: StatsDesignVariant;
    /** Si true, activa scroll automático continuo (modo demo) */
    autoScroll?: boolean;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmtBs = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString("es-VE", { maximumFractionDigits: 0 });
};

const pct = (value: number, total: number) =>
    total > 0 ? Math.min(100, (value / total) * 100) : 0;

// ─── Medal colors by rank ─────────────────────────────────────────────────────

const MEDAL = [
    { ring: "ring-amber-400/60",   bg: "bg-amber-400/10",   text: "text-amber-300",   dot: "bg-amber-400"   },
    { ring: "ring-slate-400/40",   bg: "bg-slate-400/10",   text: "text-slate-300",   dot: "bg-slate-400"   },
    { ring: "ring-orange-600/50",  bg: "bg-orange-700/10",  text: "text-orange-400",  dot: "bg-orange-600"  },
];

const getMedal = (i: number) =>
    MEDAL[i] ?? { ring: "ring-slate-700/30", bg: "bg-slate-800/40", text: "text-slate-500", dot: "bg-slate-600" };

// ─── Metric pill ──────────────────────────────────────────────────────────────

function MetricBar({
    label, value, total, colorBg, colorText,
}: {
    label: string;
    value: number;
    total: number;
    colorBg: string;
    colorText: string;
}) {
    const width = pct(value, total);
    return (
        <div className="space-y-0.5">
            <div className="flex items-center justify-between gap-2">
                <span className={`text-[9px] font-semibold uppercase tracking-wider ${colorText}`}>{label}</span>
                <span className={`text-[9px] font-bold tabular-nums ${colorText}`}>
                    Bs.&nbsp;{fmtBs(value)}
                </span>
            </div>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${colorBg}`}
                    style={{ width: `${width}%`, minWidth: width > 0 ? "3px" : "0" }}
                />
            </div>
        </div>
    );
}

// ─── Group card ───────────────────────────────────────────────────────────────

function GroupCard({
    group, index, totals,
}: {
    group: GroupStat;
    index: number;
    totals: { iva: number; islr: number; paid: number; fines: number };
}) {
    const medal = getMedal(index);
    const score = pct(group.totalIvaCollected + group.totalIslrCollected, totals.iva + totals.islr);

    return (
        <div
            className={`
                relative overflow-hidden rounded-xl border bg-slate-900/70 p-3
                ring-1 ${medal.ring}
                transition-all duration-200 hover:bg-slate-800/80
            `}
        >
            {/* Rank badge + group name */}
            <div className="mb-2.5 flex items-center gap-2.5">
                <div className={`
                    flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
                    ring-1 ${medal.ring} ${medal.bg}
                    text-[11px] font-black tabular-nums ${medal.text}
                `}>
                    {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold leading-tight text-white" title={group.groupName}>
                        {group.groupName}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                        {score.toFixed(1)}% participación global
                    </p>
                </div>

                {/* Mini score ring */}
                <div className="relative shrink-0 h-9 w-9">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="3.5" />
                        <circle
                            cx="18" cy="18" r="14"
                            fill="none"
                            stroke={index === 0 ? "#fbbf24" : index === 1 ? "#94a3b8" : index === 2 ? "#ea580c" : "#3b82f6"}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeDasharray={`${(score / 100) * 87.96} 87.96`}
                        />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white tabular-nums">
                        {score.toFixed(0)}%
                    </span>
                </div>
            </div>

            {/* Metrics */}
            <div className="space-y-1.5">
                <MetricBar
                    label="IVA"
                    value={group.totalIvaCollected}
                    total={totals.iva}
                    colorBg="bg-amber-500"
                    colorText="text-amber-400"
                />
                <MetricBar
                    label="ISLR"
                    value={group.totalIslrCollected}
                    total={totals.islr}
                    colorBg="bg-violet-500"
                    colorText="text-violet-400"
                />
                <MetricBar
                    label="Pagos multas"
                    value={group.totalPaidAmount}
                    total={totals.paid}
                    colorBg="bg-emerald-500"
                    colorText="text-emerald-400"
                />
            </div>

            {/* Subtle glow accent top-left */}
            <div
                className={`pointer-events-none absolute -left-4 -top-4 h-16 w-16 rounded-full blur-2xl opacity-20 ${medal.dot}`}
            />
        </div>
    );
}

// ─── Global KPI strip ────────────────────────────────────────────────────────

function KpiStrip({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="flex flex-col items-center gap-0.5 px-2">
            <span className={`text-[10px] font-black tabular-nums ${color}`}>
                Bs. {fmtBs(value)}
            </span>
            <span className="text-[8px] uppercase tracking-wider text-slate-600 font-semibold">{label}</span>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const GroupPerformanceStats = ({ groupStats, designVariant = "classic", autoScroll = false }: Props) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const animRef = useRef<number | null>(null);

    // Auto-scroll continuo en modo demo
    useEffect(() => {
        if (!autoScroll) return;
        const el = scrollRef.current;
        if (!el) return;

        let direction = 1;
        let paused = false;

        const step = () => {
            if (!paused && el) {
                el.scrollTop += direction * 0.6;
                // Cuando llega al fondo, espera 1.2s y vuelve
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
                    paused = true;
                    setTimeout(() => {
                        direction = -1;
                        paused = false;
                    }, 1200);
                }
                // Cuando llega al inicio, espera 0.8s y baja
                if (el.scrollTop <= 0 && direction === -1) {
                    paused = true;
                    setTimeout(() => {
                        direction = 1;
                        paused = false;
                    }, 800);
                }
            }
            animRef.current = requestAnimationFrame(step);
        };

        animRef.current = requestAnimationFrame(step);
        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [autoScroll]);

    const totalIva   = groupStats.reduce((s, g) => s + g.totalIvaCollected, 0);
    const totalIslr  = groupStats.reduce((s, g) => s + g.totalIslrCollected, 0);
    const totalPaid  = groupStats.reduce((s, g) => s + g.totalPaidAmount, 0);
    const totalFines = groupStats.reduce((s, g) => s + g.totalPaidFines, 0);

    const sorted = [...groupStats].sort(
        (a, b) =>
            (b.totalIvaCollected + b.totalIslrCollected) -
            (a.totalIvaCollected + a.totalIslrCollected)
    );

    const totals = { iva: totalIva, islr: totalIslr, paid: totalPaid, fines: totalFines };

    if (sorted.length === 0) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-slate-500">Sin datos de rendimiento por grupo</p>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col bg-slate-950/80 px-2 pb-2 pt-3 sm:px-3">
            {/* Header */}
            <div className="mb-2 shrink-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-white">
                            Rendimiento por Coordinación
                        </p>
                        <p className="text-[9px] text-slate-500 font-medium mt-0.5">
                            Ordenados por IVA + ISLR recaudado · {sorted.length} grupos
                        </p>
                    </div>
                    {autoScroll && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-600/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                            Demo
                        </span>
                    )}
                </div>

                {/* KPI totals strip */}
                <div className="mt-2 flex items-center justify-around rounded-lg border border-slate-800 bg-slate-900/60 py-1.5 divide-x divide-slate-800">
                    <KpiStrip label="IVA total"  value={totalIva}   color="text-amber-400"   />
                    <KpiStrip label="ISLR total" value={totalIslr}  color="text-violet-400"  />
                    <KpiStrip label="Pagos"      value={totalPaid}  color="text-emerald-400" />
                </div>
            </div>

            {/* Scrollable group cards */}
            <div
                ref={scrollRef}
                className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5"
            >
                {sorted.map((group, i) => (
                    <GroupCard key={i} group={group} index={i} totals={totals} />
                ))}
            </div>
        </div>
    );
};
