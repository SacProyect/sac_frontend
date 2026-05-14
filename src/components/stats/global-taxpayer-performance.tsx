// ─── Imports ────────────────────────────────────────────────────────────────────
import { useMemo, useState, useEffect } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { StatsDesignVariant } from "./global-perfomance";

// ─── Public Types ──────────────────────────────────────────────────────────────

export interface MonthlyIvaStats {
    year: number;
    months: {
        monthIndex: number;  // 0..11
        monthName: string;   // "Enero", etc.
        ivaCollected: number;
    }[];
    totalIvaCollected: number;
}

interface Props {
    stats: MonthlyIvaStats;
    designVariant?: StatsDesignVariant;
    autoHover?: boolean;  // NEW — cycle through bars automatically
}

// ─── Design Variants ───────────────────────────────────────────────────────────

const getStyles = (variant: StatsDesignVariant) => {
    switch (variant) {
        case "minimal":
            return { panelBg: "bg-slate-900/40", grid: "#0f172a", tick: "#64748b", barBase: "#60a5fa" };
        case "contrast":
            return { panelBg: "bg-slate-950", grid: "#1e3a8a", tick: "#e2e8f0", barBase: "#38bdf8" };
        default:
            return { panelBg: "bg-slate-950/80", grid: "#1e293b", tick: "#94a3b8", barBase: "#4f8cff" };
    }
};

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatCurrency = (n: number) =>
    n.toLocaleString("es-VE", { maximumFractionDigits: 2 });

const formatCompact = (n: number) =>
    n.toLocaleString("es-VE", {
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: 1,
    });

// ─── Data Processing ──────────────────────────────────────────────────────────

const MONTH_NAMES = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function getCurrentMonthCaracas(): number {
    return (
        Number(
            new Intl.DateTimeFormat("en-US", {
                timeZone: "America/Caracas",
                month: "numeric",
            }).format(new Date())
        ) - 1
    );
}

function resolveMonthIndex(monthIndex?: number, monthName?: string): number | null {
    if (typeof monthIndex === "number" && monthIndex >= 0 && monthIndex <= 11) {
        return monthIndex;
    }
    const normalized = String(monthName ?? "").trim();
    if (!normalized) return null;
    const match = normalized.match(/(?:\d{4}-)?(\d{1,2})$/);
    if (match) {
        const n = Number(match[1]);
        if (n >= 1 && n <= 12) return n - 1;
    }
    return null;
}

function resolveMonthLabel(monthIndex?: number, monthName?: string): string {
    if (typeof monthIndex === "number" && monthIndex >= 0 && monthIndex <= 11) {
        return MONTH_NAMES[monthIndex];
    }
    const normalized = String(monthName ?? "").trim();
    if (!normalized) return "Mes";
    const match = normalized.match(/(?:\d{4}-)?(\d{1,2})$/);
    if (match) {
        const n = Number(match[1]);
        if (n >= 1 && n <= 12) return MONTH_NAMES[n - 1];
    }
    return normalized;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
    active,
    payload,
    barBase,
}: {
    active?: boolean;
    payload?: Array<{ payload: ReturnType<typeof buildData>[number] }>;
    barBase: string;
}) {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    const { variation } = item;
    const isUp = variation !== null && variation > 0;
    const isDown = variation !== null && variation < 0;

    return (
        <div className="border-slate-700/40 bg-slate-900/95 rounded-xl border p-3 text-xs shadow-2xl backdrop-blur-sm">
            <p className="mb-2 border-b border-slate-700/30 pb-1.5 font-bold text-slate-200 text-[9px] uppercase tracking-widest">
                {item.label}
            </p>
            <div className="mb-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Recaudado</p>
                <p className="mt-0.5 text-lg font-black leading-none text-white" style={{ color: item.color }}>
                    Bs. {formatCurrency(item.value)}
                </p>
            </div>
            <div className="border-t border-slate-700/30 pt-2">
                <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    vs mes anterior
                </p>
                {variation === null ? (
                    <span className="flex items-center gap-1.5 font-semibold text-slate-400">
                        Primer registro (N/A)
                    </span>
                ) : (
                    <span className={`flex items-center gap-1.5 font-bold ${
                        isUp ? "text-emerald-400" : isDown ? "text-red-400" : "text-slate-300"
                    }`}>
                        {isUp ? "▲" : isDown ? "▼" : "—"}
                        {isUp ? "+" : ""}
                        {variation.toFixed(1)}%
                        <span className="ml-1 font-normal text-slate-500 tabular-nums">
                            (Bs. {formatCompact(Math.abs(item.value - item.previousValue))})
                        </span>
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function buildData(
    months: MonthlyIvaStats["months"],
    currentMonthIndexVz: number,
    barBase: string
) {
    return (months ?? [])
        .map((m) => {
            const monthIndex = resolveMonthIndex(m.monthIndex, m.monthName);
            const previousValue =
                (months ?? []).find((item) => item.monthIndex === (monthIndex ?? 0) - 1)?.ivaCollected ?? 0;
            const currentValue = m.ivaCollected;
            const variation = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : null;

            let color = barBase;
            if (variation !== null) {
                if (variation > 0) color = "#10b981";
                else if (variation < 0) color = "#ef4444";
            }

            return {
                monthIndex,
                label: resolveMonthLabel(m.monthIndex, m.monthName),
                value: currentValue,
                previousValue,
                variation,
                color,
            };
        })
        .filter((m) => (m.monthIndex === null ? true : m.monthIndex <= currentMonthIndexVz));
}

export const PageTwoStats: React.FC<Props> = ({
    stats,
    designVariant = "classic",
    autoHover = false,
}) => {
    const s = getStyles(designVariant);
    const currentMonthIndexVz = getCurrentMonthCaracas();
    const barBase = s.barBase;

    // Processed chart data
    const data = useMemo(
        () => buildData(stats?.months, currentMonthIndexVz, barBase),
        [stats?.months, currentMonthIndexVz, barBase]
    );

    // Derived KPIs
    const totalCollected = stats?.totalIvaCollected ?? 0;
    const avgMonthly = data.length > 0 ? totalCollected / data.length : 0;
    const bestMonth =
        data.length > 0 ? [...data].sort((a, b) => b.value - a.value)[0] : null;

    // Auto-hover state
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Auto-hover cycle
    useEffect(() => {
        if (!autoHover || data.length === 0) {
            setHoveredIndex(null);
            return;
        }
        setHoveredIndex(0);
        const interval = setInterval(() => {
            setHoveredIndex((prev) => (prev === null ? 0 : (prev + 1) % data.length));
        }, 2500);
        return () => clearInterval(interval);
    }, [autoHover, data.length]);

    // Empty state
    if (!data.length) {
        return (
            <div className={`flex h-full flex-col ${s.panelBg} px-3 pb-2 pt-3`}>
                <div className="flex flex-1 items-center justify-center">
                    <p className="text-sm text-slate-500">Sin datos de recaudación mensual</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex h-full flex-col ${s.panelBg} px-2 pb-2 pt-2 sm:px-3`}>
            {/* Header: doble línea alineada a izquierda */}
            <div className="mb-2 flex items-center justify-between shrink-0">
                <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Recaudación IVA</p>
                    <h2 className="text-sm font-black tracking-tight text-white">
                        Recaudación Mensual · {stats?.year}
                    </h2>
                </div>
                {autoHover && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-600/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-blue-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                        Demo
                    </span>
                )}
            </div>

            {/* KPIs: franja horizontal con valores jerarquizados */}
            <div className="mb-2 flex items-center gap-2 rounded-md bg-slate-900/40 border border-slate-700/30 px-3 py-1.5 text-[10px] shrink-0">
                <span className="text-slate-600 font-bold uppercase tracking-wider text-[8px]">Acumulado</span>
                <span className="text-sm font-black tabular-nums" style={{ color: barBase }}>Bs. {formatCompact(totalCollected)}</span>
                <span className="text-slate-700 mx-0.5">/</span>
                <span className="text-slate-600 font-bold uppercase tracking-wider text-[8px]">Promedio</span>
                <span className="font-bold tabular-nums text-slate-300">Bs. {formatCompact(avgMonthly)}</span>
                <span className="text-slate-700 mx-0.5">/</span>
                <span className="text-slate-600 font-bold uppercase tracking-wider text-[8px]">Pico</span>
                <span className="font-bold tabular-nums text-amber-400">
                    {bestMonth ? `${bestMonth.label} — Bs. ${formatCompact(bestMonth.value)}` : "—"}
                </span>
                <span className="ml-auto text-[8px] font-bold text-slate-700 tabular-nums">{data.length} meses</span>
            </div>

            {/* Auto-hover: Single compact line */}
            {autoHover && hoveredIndex !== null && data[hoveredIndex] && (
                <div className="mb-1.5 flex items-center gap-3 rounded bg-slate-900/60 px-2.5 py-1 text-[10px] shrink-0 animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="font-bold text-white text-xs">{data[hoveredIndex].label}</span>
                    <span className="font-black tabular-nums" style={{ color: data[hoveredIndex].color }}>
                        Bs. {formatCurrency(data[hoveredIndex].value)}
                    </span>
                    {data[hoveredIndex].variation !== null ? (
                        <span className={`font-bold flex items-center gap-0.5 ${
                            data[hoveredIndex].variation > 0 ? "text-emerald-400" : "text-red-400"
                        }`}>
                            {data[hoveredIndex].variation > 0 ? "▲" : "▼"}
                            {data[hoveredIndex].variation > 0 ? "+" : ""}{data[hoveredIndex].variation.toFixed(1)}%
                        </span>
                    ) : (
                        <span className="text-slate-500">Primer registro</span>
                    )}
                    <span className="text-slate-600 ml-auto">
                        vs {data[hoveredIndex].previousValue > 0 ? `Bs. ${formatCompact(data[hoveredIndex].previousValue)}` : "N/A"}
                    </span>
                </div>
            )}

            {/* Chart: Takes all remaining space */}
            <div className="relative flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 5, left: 2, bottom: 2 }}>
                        <XAxis dataKey="label" stroke={s.tick} tick={{ fontSize: 10, fontWeight: "600" }} axisLine={{ stroke: s.grid }} tickLine={false} dy={3} />
                        <YAxis stroke={s.tick} tickFormatter={(val) => formatCompact(Number(val))} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={40} />
                        <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} content={<CustomTooltip barBase={barBase} />} />
                        <Bar dataKey="value" radius={[3, 3, 0, 0]} barSize={24}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    opacity={autoHover && hoveredIndex !== null && index !== hoveredIndex ? 0.35 : 1}
                                    stroke={autoHover && index === hoveredIndex ? entry.color : "transparent"}
                                    strokeWidth={autoHover && index === hoveredIndex ? 2 : 0}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Legend: Minimal, single line, no border */}
            <div className="flex items-center justify-center gap-4 text-[8px] font-bold uppercase tracking-widest text-slate-500 shrink-0 mt-1">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#10b981]" /> Crecimiento</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#ef4444]" /> Caída</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: barBase }} /> Estable</span>
            </div>
        </div>
    );
};