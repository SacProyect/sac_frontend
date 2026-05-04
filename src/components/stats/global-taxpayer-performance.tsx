// comments in English
import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { StatsDesignVariant } from "./global-perfomance";

// API response shape
export interface MonthlyIvaStats {
    year: number;
    months: {
        monthIndex: number;   // 0..11
        monthName: string;    // "Enero", ...
        ivaCollected: number; // month sum of IVA paid
    }[];
    totalIvaCollected: number;
}

const DESIGN_STYLES: Record<StatsDesignVariant, {
    panelBg: string;
    titleBorder: string;
    titleBg: string;
    subtitle: string;
    grid: string;
    xTick: string;
    yTick: string;
    tooltipBg: string;
    bar: string;
}> = {
    classic: {
        panelBg: "bg-slate-950/80",
        titleBorder: "border-slate-500",
        titleBg: "bg-slate-800/90",
        subtitle: "text-slate-400",
        grid: "#334155",
        xTick: "#cbd5e1",
        yTick: "#94a3b8",
        tooltipBg: "bg-slate-900/95",
        bar: "#4f8cff",
    },
    contrast: {
        panelBg: "bg-slate-950",
        titleBorder: "border-blue-400/60",
        titleBg: "bg-blue-950/60",
        subtitle: "text-slate-200",
        grid: "#3b82f6",
        xTick: "#ffffff",
        yTick: "#e2e8f0",
        tooltipBg: "bg-blue-950/95",
        bar: "#38bdf8",
    },
    minimal: {
        panelBg: "bg-slate-900/40",
        titleBorder: "border-slate-700",
        titleBg: "bg-slate-900/30",
        subtitle: "text-slate-500",
        grid: "#1e293b",
        xTick: "#94a3b8",
        yTick: "#64748b",
        tooltipBg: "bg-slate-900/90",
        bar: "#60a5fa",
    },
};

export const PageTwoStats: React.FC<{ stats: MonthlyIvaStats; designVariant?: StatsDesignVariant }> = ({ stats, designVariant = "classic" }) => {
    const style = DESIGN_STYLES[designVariant];
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const currentMonthIndexVz = Number(
        new Intl.DateTimeFormat("en-US", {
            timeZone: "America/Caracas",
            month: "numeric",
        }).format(new Date())
    ) - 1;

    const resolveMonthIndex = (monthIndex?: number, monthName?: string) => {
        if (typeof monthIndex === "number" && monthIndex >= 0 && monthIndex <= 11) {
            return monthIndex;
        }

        const normalized = String(monthName ?? "").trim();
        if (!normalized) return null;

        const match = normalized.match(/(?:\d{4}-)?(\d{1,2})$/);
        if (match) {
            const monthNumber = Number(match[1]);
            if (monthNumber >= 1 && monthNumber <= 12) {
                return monthNumber - 1;
            }
        }

        return null;
    };

    const resolveMonthLabel = (monthIndex?: number, monthName?: string) => {
        if (typeof monthIndex === "number" && monthIndex >= 0 && monthIndex <= 11) {
            return monthNames[monthIndex];
        }

        const normalized = String(monthName ?? "").trim();
        if (!normalized) return "Mes";

        // Handles "Mes 2026-01", "2026-01", "01", etc.
        const match = normalized.match(/(?:\d{4}-)?(\d{1,2})$/);
        if (match) {
            const monthNumber = Number(match[1]);
            if (monthNumber >= 1 && monthNumber <= 12) {
                return monthNames[monthNumber - 1];
            }
        }

        return normalized;
    };
    // comments in English
    // Build chart data: 12 points, using month short name as label
    const data = useMemo(
        () =>
            (stats?.months ?? []).map((m) => ({
                monthIndex: resolveMonthIndex(m.monthIndex, m.monthName),
                label: resolveMonthLabel(m.monthIndex, m.monthName),
                value: m.ivaCollected,
                fullLabel: m.monthName,
                previousValue:
                    (stats?.months ?? []).find((item) => item.monthIndex === m.monthIndex - 1)?.ivaCollected ?? 0,
            }))
                .filter((m) => (m.monthIndex === null ? true : m.monthIndex <= currentMonthIndexVz)),
        [stats?.months, currentMonthIndexVz]
    );

    const formatCurrency = (n: number) =>
        n.toLocaleString("es-VE", { maximumFractionDigits: 2 });

    const formatCompact = (n: number) =>
        n.toLocaleString("es-VE", {
            notation: "compact",
            compactDisplay: "short",
            maximumFractionDigits: 1,
        });

    const formatYAxis = (v: number | string) => {
        const n = Number(v);
        return formatCompact(n);
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            const previous = item?.previousValue ?? 0;
            const current = Number(item?.value ?? 0);
            const variation = previous > 0 ? ((current - previous) / previous) * 100 : null;
            
            return (
                <div className={`p-2 border border-slate-700 rounded-md text-xs shadow-xl ${style.tooltipBg}`}>
                    <p className="font-bold text-white mb-1">{item.label}</p>
                    <p className="text-white">IVA: Bs. {formatCurrency(current)}</p>
                    <p className="text-slate-300">
                        {variation === null
                            ? "Var. vs mes anterior: N/A"
                            : `Var. vs mes anterior: ${variation >= 0 ? "+" : ""}${variation.toFixed(1)}%`}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex h-full min-h-0 w-full flex-col">
            <div className={`flex h-full min-h-0 w-full flex-col justify-between ${style.panelBg} px-2 pb-2 pt-3 sm:px-3`}>
                {/* Title */}
                <div className={`mx-auto w-full max-w-sm shrink-0 rounded-md border ${style.titleBorder} ${style.titleBg} py-1`}>
                    <p className="px-1 text-center text-xs font-semibold tracking-wide text-white sm:text-sm">
                        RECAUDACIÓN MENSUAL · IVA · {stats?.year ?? ""}
                    </p>
                </div>

                {/* Description */}
                <p className={`shrink-0 py-1 text-center text-[10px] leading-tight ${style.subtitle}`}>
                    Monto total de IVA recaudado por mes y variación intermensual en tooltip.
                </p>

                {/* Chart */}
                <div className="min-h-0 flex-1 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 5, left: -20, bottom: 25 }}>
                            <CartesianGrid strokeDasharray="2 3" stroke={style.grid} vertical={false} />
                            <XAxis 
                                dataKey="label" 
                                stroke={style.xTick}
                                tick={{ fontSize: 11, fontWeight: "600" }}
                                angle={-35}
                                textAnchor="end"
                                interval={0}
                            />
                            <YAxis 
                                stroke={style.yTick}
                                tickFormatter={(val) => formatYAxis(Number(val))}
                                tick={{ fontSize: 10 }}
                            />
                            <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} content={<CustomTooltip />} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={18}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={style.bar} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Footer summary */}
                <div className="mt-1 shrink-0 text-center text-[10px] text-slate-300 sm:text-xs">
                    Total IVA {stats?.year ?? ""}:{" "}
                    <span className="font-semibold text-blue-200">
                        Bs. {(stats?.totalIvaCollected ?? 0).toLocaleString("es-VE", { maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>
        </div>
    );
};
