// comments in English
import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { StatsDesignVariant } from "./global-perfomance";
import { DollarSign, TrendingUp, TrendingDown, Award, BarChart3 } from "lucide-react";

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
    titleBg: string;
    subtitle: string;
    grid: string;
    xTick: string;
    yTick: string;
    tooltipBg: string;
    barBase: string;
}> = {
    classic: {
        panelBg: "bg-slate-950/80",
        titleBg: "bg-slate-900/40",
        subtitle: "text-slate-400",
        grid: "#1e293b",
        xTick: "#94a3b8",
        yTick: "#94a3b8",
        tooltipBg: "bg-slate-900/95",
        barBase: "#4f8cff",
    },
    contrast: {
        panelBg: "bg-slate-950",
        titleBg: "bg-blue-950/30",
        subtitle: "text-slate-300",
        grid: "#1e3a8a",
        xTick: "#e2e8f0",
        yTick: "#e2e8f0",
        tooltipBg: "bg-blue-950/95",
        barBase: "#38bdf8",
    },
    minimal: {
        panelBg: "bg-slate-900/40",
        titleBg: "transparent",
        subtitle: "text-slate-500",
        grid: "#0f172a",
        xTick: "#64748b",
        yTick: "#64748b",
        tooltipBg: "bg-slate-900/90",
        barBase: "#60a5fa",
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

        const match = normalized.match(/(?:\d{4}-)?(\d{1,2})$/);
        if (match) {
            const monthNumber = Number(match[1]);
            if (monthNumber >= 1 && monthNumber <= 12) {
                return monthNames[monthNumber - 1];
            }
        }

        return normalized;
    };

    const data = useMemo(
        () =>
            (stats?.months ?? []).map((m) => {
                const monthIndex = resolveMonthIndex(m.monthIndex, m.monthName);
                const previousValue = (stats?.months ?? []).find((item) => item.monthIndex === (monthIndex ?? 0) - 1)?.ivaCollected ?? 0;
                const currentValue = m.ivaCollected;
                const variation = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : null;

                // Color based on growth (financial candle style)
                let color = style.barBase;
                if (variation !== null) {
                    if (variation > 0) color = "#10b981"; // Green (Up)
                    else if (variation < 0) color = "#ef4444"; // Red (Down)
                }

                return {
                    monthIndex,
                    label: resolveMonthLabel(m.monthIndex, m.monthName),
                    value: currentValue,
                    fullLabel: m.monthName,
                    previousValue,
                    variation,
                    color,
                };
            }).filter((m) => (m.monthIndex === null ? true : m.monthIndex <= currentMonthIndexVz)),
        [stats?.months, currentMonthIndexVz, style.barBase]
    );

    const totalCollected = stats?.totalIvaCollected ?? 0;
    const avgMonthly = data.length > 0 ? totalCollected / data.length : 0;
    const bestMonth = data.length > 0 ? [...data].sort((a, b) => b.value - a.value)[0] : null;

    const formatCurrency = (n: number) => n.toLocaleString("es-VE", { maximumFractionDigits: 2 });
    
    const formatCompact = (n: number) =>
        n.toLocaleString("es-VE", {
            notation: "compact",
            compactDisplay: "short",
            maximumFractionDigits: 1,
        });

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            const variation = item.variation;
            const isUp = variation !== null && variation > 0;
            const isDown = variation !== null && variation < 0;
            
            return (
                <div className={`p-3 border border-slate-700/40 rounded-xl text-xs shadow-2xl backdrop-blur-sm ${style.tooltipBg}`}>
                    <p className="font-bold text-slate-200 mb-2 pb-1.5 border-b border-slate-700/30 uppercase tracking-widest text-[9px]">
                        {item.label}
                    </p>
                    
                    <div className="mb-3">
                        <p className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Recaudado</p>
                        <p className="text-lg font-black text-white leading-none mt-0.5" style={{ color: item.color }}>
                            Bs. {formatCurrency(item.value)}
                        </p>
                    </div>

                    <div className="pt-2 border-t border-slate-700/30">
                        <p className="text-slate-500 text-[9px] uppercase font-bold tracking-wider mb-1.5">Evolución vs Mes Anterior</p>
                        {variation === null ? (
                            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                                <BarChart3 className="w-3.5 h-3.5" /> Primer registro (N/A)
                            </span>
                        ) : (
                            <span className={`font-bold flex items-center gap-1.5 ${isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-slate-300'}`}>
                                {isUp ? <TrendingUp className="w-4 h-4" /> : isDown ? <TrendingDown className="w-4 h-4" /> : null}
                                {isUp ? "+" : ""}{variation.toFixed(1)}% 
                                <span className="text-slate-500 font-normal ml-1 tabular-nums">
                                    (Bs. {formatCompact(Math.abs(item.value - item.previousValue))})
                                </span>
                            </span>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={`flex w-full flex-col h-full overflow-y-auto custom-scrollbar ${style.panelBg}`}>
            <div className={`flex w-full flex-col min-h-full px-2 pb-2 pt-3 sm:px-3`}>
                
                {/* Title */}
                <div className="mb-4 w-full max-w-md shrink-0 text-center mx-auto">
                    <div className={`w-full rounded-lg ${style.titleBg} py-1.5`}>
                        <h1 className="px-2 text-xs font-bold tracking-widest text-slate-200 sm:text-sm uppercase">
                            Evolución de Recaudación Mensual ({stats?.year ?? ""})
                        </h1>
                    </div>
                    <p className={`mt-2 line-clamp-2 text-[10px] leading-relaxed font-medium ${style.subtitle}`}>
                        Análisis del crecimiento intermensual. Verde indica alza; rojo indica baja.
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="w-full shrink-0 grid grid-cols-3 gap-3 mb-2 max-w-4xl px-1 mx-auto">
                    <div className="flex flex-col items-center py-2.5 bg-slate-900/30 border border-slate-700/30 rounded-xl transition-colors hover:bg-slate-900/40">
                        <p className="text-[9px] text-blue-400/90 uppercase font-bold tracking-widest mb-1 flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5" /> Acumulado
                        </p>
                        <p className="text-sm sm:text-lg font-black text-white tabular-nums">{formatCompact(totalCollected)}</p>
                    </div>
                    <div className="flex flex-col items-center py-2.5 bg-slate-900/30 border border-slate-700/30 rounded-xl transition-colors hover:bg-slate-900/40">
                        <p className="text-[9px] text-purple-400/90 uppercase font-bold tracking-widest mb-1 flex items-center gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5" /> Promedio / Mes
                        </p>
                        <p className="text-sm sm:text-lg font-black text-slate-300 tabular-nums">{formatCompact(avgMonthly)}</p>
                    </div>
                    <div className="flex flex-col items-center py-2.5 bg-slate-900/30 border border-slate-700/30 rounded-xl transition-colors hover:bg-slate-900/40">
                        <p className="text-[9px] text-amber-400/90 uppercase font-bold tracking-widest mb-1 flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5" /> Mes Pico
                        </p>
                        <p className="text-sm sm:text-lg font-black text-white">
                            {bestMonth ? bestMonth.label : 'N/A'}
                        </p>
                    </div>
                </div>

                {/* Chart */}
                <div className="mt-2 flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={style.grid} vertical={false} />
                            <XAxis 
                                dataKey="label" 
                                stroke={style.xTick}
                                tick={{ fontSize: 11, fontWeight: "600" }}
                                axisLine={{ stroke: style.grid }}
                                tickLine={false}
                                dy={5}
                            />
                            <YAxis 
                                stroke={style.yTick}
                                tickFormatter={(val) => formatCompact(Number(val))}
                                tick={{ fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                width={45}
                            />
                            <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} content={<CustomTooltip />} />
                            
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={24}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                
                {/* Visual Legend */}
                <div className="shrink-0 flex items-center justify-center gap-5 mt-3 pt-2 text-[9px] text-slate-400 uppercase font-bold tracking-widest border-t border-slate-800/30">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" />
                        <span>Crecimiento (+%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm bg-[#ef4444]" />
                        <span>Caída (-%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: style.barBase }} />
                        <span>Base / Estable</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
