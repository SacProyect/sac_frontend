import { useEffect, useRef, useMemo } from "react";
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
    autoScroll?: boolean;
}

// ─── Design Variants ────────────────────────────────────────────────────────────

const getContainerStyles = (variant: StatsDesignVariant) => {
    switch (variant) {
        case "minimal":
            return { containerBg: "bg-slate-900/40" };
        case "contrast":
            return { containerBg: "bg-slate-950" };
        case "classic":
        default:
            return { containerBg: "bg-slate-950/80" };
    }
};

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt = (n: number) => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}MM`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString("es-VE", { maximumFractionDigits: 0 });
};

const pct = (value: number, total: number) =>
    total > 0 ? Math.min(100, (value / total) * 100) : 0;

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, pctLabel, color, sub }: {
    label: string;
    value: string;
    pctLabel: string;
    color: string;
    sub?: string;
}) {
    return (
        <div className="flex flex-col rounded-lg border border-slate-700/25 bg-slate-900/40 px-3 py-2 gap-0.5">
            <div className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{label}</div>
            <div className={`text-[14px] font-black tabular-nums leading-none ${color}`}>Bs. {value}</div>
            <div className="flex items-center gap-1 text-[8px] text-slate-600 mt-0.5">
                <span>{pctLabel}</span>
                {sub && <span className="text-slate-700">· {sub}</span>}
            </div>
        </div>
    );
}

function MetricRow({ label, value, total, barColor, textColor }: {
    label: string;
    value: number;
    total: number;
    barColor: string;
    textColor: string;
}) {
    const width = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="flex items-center gap-2">
            <span className={`w-8 text-[9px] font-bold uppercase tracking-wider ${textColor}`}>{label}</span>
            <span className={`w-20 text-right text-[10px] font-bold tabular-nums ${textColor}`}>Bs. {fmt(value)}</span>
            <div className="flex-1 relative h-1.5 rounded-full bg-slate-800 overflow-hidden min-w-[60px]">
                <div
                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${Math.max(width, width > 0 ? 2 : 0)}%` }}
                />
            </div>
            <span className="w-10 text-right text-[9px] font-bold tabular-nums text-slate-400">
                {width.toFixed(1)}%
            </span>
        </div>
    );
}

function GroupRow({ group, rank, totals }: {
    group: GroupStat;
    rank: number;
    totals: { iva: number; islr: number; multas: number; general: number };
}) {
    const totalGroup = group.totalIvaCollected + group.totalIslrCollected + group.totalPaidAmount;
    const contributionPct = totals.general > 0 ? (totalGroup / totals.general) * 100 : 0;

    return (
        <div className="rounded-lg border border-slate-700/15 bg-slate-900/30 px-3 py-2.5 transition-colors hover:bg-slate-900/50">
            <div className="flex items-center gap-2.5 mb-2">
                <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-black ${
                    rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                    rank === 2 ? 'bg-slate-500/20 text-slate-400' :
                    rank === 3 ? 'bg-amber-700/20 text-amber-600' :
                    'bg-slate-800/60 text-slate-500'
                }`}>{rank}</span>
                <span className="flex-1 truncate text-[12px] font-semibold text-slate-100">{group.groupName}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-black text-white tabular-nums">Bs. {fmt(totalGroup)}</span>
                    <span className="text-[8px] font-bold text-slate-600 tabular-nums">{contributionPct.toFixed(1)}%</span>
                </div>
            </div>
            <div className="space-y-1 ml-7">
                <MetricRow
                    label="IVA"
                    value={group.totalIvaCollected}
                    total={totals.iva}
                    barColor="bg-amber-500"
                    textColor="text-amber-400"
                />
                <MetricRow
                    label="ISLR"
                    value={group.totalIslrCollected}
                    total={totals.islr}
                    barColor="bg-violet-500"
                    textColor="text-violet-400"
                />
                <MetricRow
                    label="Mult"
                    value={group.totalPaidAmount}
                    total={totals.multas}
                    barColor="bg-emerald-500"
                    textColor="text-emerald-400"
                />
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const GroupPerformanceStats = ({ groupStats, designVariant = "classic", autoScroll = false }: Props) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const animRef = useRef<number | null>(null);
    const { containerBg } = getContainerStyles(designVariant);

    // Calculate totals
    const totalIva = groupStats.reduce((s, g) => s + g.totalIvaCollected, 0);
    const totalIslr = groupStats.reduce((s, g) => s + g.totalIslrCollected, 0);
    const totalMultas = groupStats.reduce((s, g) => s + g.totalPaidAmount, 0);
    const totalFines = groupStats.reduce((s, g) => s + g.totalPaidFines, 0);
    const totalGeneral = totalIva + totalIslr + totalMultas;

    const totals = useMemo(
        () => ({
            iva: totalIva,
            islr: totalIslr,
            multas: totalMultas,
            general: totalGeneral,
        }),
        [totalIva, totalIslr, totalMultas, totalGeneral]
    );

    // Sort by IVA + ISLR descending
    const sorted = useMemo(
        () => [...groupStats].sort((a, b) => (b.totalIvaCollected + b.totalIslrCollected) - (a.totalIvaCollected + a.totalIslrCollected)),
        [groupStats]
    );

    // Auto-scroll with 1.5s pause at bottom, 1s at top
    useEffect(() => {
        if (!autoScroll) return;
        const el = scrollRef.current;
        if (!el) return;

        let direction = 1;
        let paused = false;

        const step = () => {
            if (!paused && el) {
                el.scrollTop += direction * 0.6;
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
                    paused = true;
                    setTimeout(() => {
                        direction = -1;
                        paused = false;
                    }, 1500);
                }
                if (el.scrollTop <= 0 && direction === -1) {
                    paused = true;
                    setTimeout(() => {
                        direction = 1;
                        paused = false;
                    }, 1000);
                }
            }
            animRef.current = requestAnimationFrame(step);
        };

        animRef.current = requestAnimationFrame(step);
        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [autoScroll]);

    if (sorted.length === 0) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-slate-500">Sin datos de rendimiento por grupo</p>
            </div>
        );
    }

    return (
        <div className={`flex h-full min-h-0 flex-col ${containerBg} px-2 pb-2 pt-3 sm:px-3`}>
            {/* Header */}
            <div className="mb-2.5 shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Coordinaciones Fiscales</p>
                        <h2 className="text-sm font-black tracking-tight text-white">Rendimiento por Coordinación</h2>
                    </div>
                    {autoScroll && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-600/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-blue-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                            Demo
                        </span>
                    )}
                </div>
            </div>

            {/* KPI Strip - 4 columns */}
            <div className="mb-2 grid grid-cols-4 gap-2 shrink-0">
                <KpiCard
                    label="IVA Recaudado"
                    value={fmt(totalIva)}
                    pctLabel={`${pct(totalIva, totalGeneral).toFixed(1)}% del total`}
                    color="text-amber-400"
                />
                <KpiCard
                    label="ISLR Recaudado"
                    value={fmt(totalIslr)}
                    pctLabel={`${pct(totalIslr, totalGeneral).toFixed(1)}% del total`}
                    color="text-violet-400"
                />
                <KpiCard
                    label="Multas Cobradas"
                    value={fmt(totalMultas)}
                    pctLabel={`${pct(totalMultas, totalGeneral).toFixed(1)}% del total`}
                    color="text-emerald-400"
                    sub={`${totalFines} ${totalFines === 1 ? "multa" : "multas"}`}
                />
                <KpiCard
                    label="Recaudación Total"
                    value={fmt(totalGeneral)}
                    pctLabel={`100%`}
                    color="text-white"
                    sub={`${sorted.length} ${sorted.length === 1 ? "grupo" : "grupos"}`}
                />
            </div>

            {/* Separator */}
            <div className="mb-2 flex items-center gap-2 shrink-0">
                <div className="h-px flex-1 bg-slate-800/60" />
                <span className="text-[7px] font-bold uppercase tracking-widest text-slate-700">{sorted.length} coordinaciones</span>
                <div className="h-px flex-1 bg-slate-800/60" />
            </div>

            {/* Scrollable Group Rows */}
            <div
                ref={scrollRef}
                className="custom-scrollbar min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5"
            >
                {sorted.map((group, index) => (
                    <GroupRow
                        key={index}
                        group={group}
                        rank={index + 1}
                        totals={totals}
                    />
                ))}
            </div>
        </div>
    );
};