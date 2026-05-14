// comments in English
import React, { useMemo } from "react";
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    ResponsiveContainer, 
    CartesianGrid, 
    Cell,
    ReferenceLine
} from "recharts";
import { TrendingUp, TrendingDown, Target, DollarSign, Award, AlertTriangle } from "lucide-react";

export type ChartData = {
    month: string;            // "2025-01"
    expectedAmount: number;   // monthly expected
    realAmount: number;       // monthly collected
    taxpayersEmitted: number; // count of taxpayers with emition_date in that month
};

export type StatsDesignVariant = "classic" | "contrast" | "minimal";

const DESIGN_STYLES: Record<StatsDesignVariant, {
    panelBg: string;
    titleBg: string;
    subtitle: string;
    grid: string;
    yTick: string;
    xTick: string;
    tooltipBg: string;
    barReal: string;
    barExpected: string;
}> = {
    classic: {
        panelBg: "bg-slate-950/80",
        titleBg: "bg-slate-900/40",
        subtitle: "text-slate-400",
        grid: "#1e293b", // softer grid
        yTick: "#94a3b8",
        xTick: "#94a3b8",
        tooltipBg: "bg-slate-900/95",
        barReal: "#3b82f6",
        barExpected: "#1e293b",
    },
    contrast: {
        panelBg: "bg-slate-950",
        titleBg: "bg-blue-950/30",
        subtitle: "text-slate-300",
        grid: "#1e3a8a",
        yTick: "#e2e8f0",
        xTick: "#e2e8f0",
        tooltipBg: "bg-blue-950/95",
        barReal: "#0ea5e9",
        barExpected: "#0f172a",
    },
    minimal: {
        panelBg: "bg-slate-900/40",
        titleBg: "transparent",
        subtitle: "text-slate-500",
        grid: "#0f172a",
        yTick: "#64748b",
        xTick: "#64748b",
        tooltipBg: "bg-slate-900/90",
        barReal: "#60a5fa",
        barExpected: "#0f172a",
    },
};

// Performance colors based on compliance percentage
const getPerformanceColor = (compliance: number): string => {
    if (compliance >= 100) return "#10b981"; // green
    if (compliance >= 80) return "#f59e0b";  // yellow
    return "#ef4444"; // red
};

const getPerformanceColorClass = (compliance: number): string => {
    if (compliance >= 100) return "text-emerald-400";
    if (compliance >= 80) return "text-amber-400";
    return "text-rose-400";
};

const getPerformanceBgClass = (compliance: number): string => {
    if (compliance >= 100) return "bg-emerald-500/10 border-emerald-500/30";
    if (compliance >= 80) return "bg-amber-500/10 border-amber-500/30";
    return "bg-rose-500/10 border-rose-500/30";
};

const PageOneStats = ({ chartData, designVariant = "classic" }: { chartData: ChartData[]; designVariant?: StatsDesignVariant }) => {
    const style = DESIGN_STYLES[designVariant];
    
    const getShortMonthName = (monthStr: string) => {
        const monthNum = parseInt(monthStr.split("-")[1], 10);
        const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        return months[monthNum - 1] || monthStr;
    };

    const data = useMemo(
        () =>
            (chartData ?? []).map((d, index) => {
                const paid = Number(d.realAmount) || 0;
                const exp = Number(d.expectedAmount) || 0;
                const compliance = exp > 0 ? (paid / exp) * 100 : (paid > 0 ? 100 : 0);
                const color = getPerformanceColor(compliance);

                // Calculate trend (compare with previous month)
                let trend = null;
                let trendPercentage = 0;
                if (index > 0 && chartData[index - 1]) {
                    const prevPaid = Number(chartData[index - 1].realAmount) || 0;
                    const prevExp = Number(chartData[index - 1].expectedAmount) || 0;
                    const prevCompliance = prevExp > 0 ? (prevPaid / prevExp) * 100 : 0;
                    trendPercentage = compliance - prevCompliance;
                    trend = trendPercentage >= 0 ? "up" : "down";
                }

                return {
                    monthLabel: getShortMonthName(d.month),
                    realAmount: paid,
                    expectedAmount: exp,
                    taxpayersEmitted: d.taxpayersEmitted ?? 0,
                    rawMonth: d.month,
                    compliance,
                    color,
                    trend,
                    trendPercentage,
                };
            }),
        [chartData]
    );

    const totalCollected = useMemo(() => data.reduce((sum, item) => sum + item.realAmount, 0), [data]);
    const totalExpected = useMemo(() => data.reduce((sum, item) => sum + item.expectedAmount, 0), [data]);
    const globalCompliance = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : (totalCollected > 0 ? 100 : 0);
    const gap = totalCollected - totalExpected; // positive means exceeded, negative means below

    // Find best and worst performing months
    const bestMonth = useMemo(() => {
        if (data.length === 0) return null;
        return data.reduce((best, item) => item.compliance > best.compliance ? item : best, data[0]);
    }, [data]);

    const worstMonth = useMemo(() => {
        if (data.length === 0) return null;
        return data.reduce((worst, item) => item.compliance < worst.compliance ? item : worst, data[0]);
    }, [data]);

    // Calculate average compliance
    const avgCompliance = useMemo(() => {
        if (data.length === 0) return 0;
        return data.reduce((sum, item) => sum + item.compliance, 0) / data.length;
    }, [data]);

    const fmtCurrency = (n: number) =>
        (n ?? 0).toLocaleString("es-VE", {
            style: "currency",
            currency: "VES",
            minimumFractionDigits: 2,
        });

    const formatCompact = (n: number) =>
        (n ?? 0).toLocaleString("es-VE", {
            notation: "compact",
            compactDisplay: "short",
            maximumFractionDigits: 1,
        });

    const formatNumber = (n: number) =>
        (n ?? 0).toLocaleString("es-VE", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        });

    // Global performance colors
    const globalColor = getPerformanceColor(globalCompliance);
    const globalColorClass = getPerformanceColorClass(globalCompliance);
    const gapColorClass = gap >= 0 ? "text-emerald-400" : "text-rose-400";

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            const monthlyShare = totalCollected > 0 ? (d.realAmount / totalCollected) * 100 : 0;
            const diffAmount = d.realAmount - d.expectedAmount;
            const diffPercent = d.expectedAmount > 0 ? (diffAmount / d.expectedAmount) * 100 : 0;

            return (
                <div className={`p-4 border border-slate-700/40 rounded-xl text-xs shadow-2xl backdrop-blur-sm ${style.tooltipBg} min-w-[200px]`}>
                    <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-700/30">
                        <p className="font-bold text-slate-200 uppercase tracking-widest text-[10px]">
                            {d.monthLabel}
                        </p>
                        {d.trend && (
                            <div className={`flex items-center gap-0.5 text-[11px] font-bold ${d.trend === "up" ? "text-emerald-400" : "text-rose-400"}`}>
                                {d.trend === "up" ? (
                                    <TrendingUp className="w-3.5 h-3.5" />
                                ) : (
                                    <TrendingDown className="w-3.5 h-3.5" />
                                )}
                                <span>{formatNumber(Math.abs(d.trendPercentage))}%</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-2.5 mb-3">
                        <div>
                            <p className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">IVA Recaudado</p>
                            <p className="text-lg font-black text-white leading-none mt-0.5" style={{ color: d.color }}>
                                {fmtCurrency(d.realAmount)}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Meta Estimada</p>
                            <p className="text-[13px] font-bold text-slate-300 leading-none mt-1">
                                {fmtCurrency(d.expectedAmount)}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Diferencia</p>
                            <p className={`text-[13px] font-bold leading-none mt-1 tabular-nums ${diffAmount >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                {diffAmount >= 0 ? "+" : ""}{formatCompact(diffAmount)} ({diffPercent >= 0 ? "+" : ""}{formatNumber(diffPercent)}%)
                            </p>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-700/30 space-y-1.5">
                        <p className="flex items-center justify-between gap-4 text-slate-300">
                            <span className="text-slate-500 text-[9px] uppercase font-bold">Cumplimiento</span>
                            <span className="font-bold tabular-nums" style={{ color: d.color }}>{d.compliance.toFixed(1)}%</span>
                        </p>
                        <p className="flex items-center justify-between gap-4 text-slate-300">
                            <span className="text-slate-500 text-[9px] uppercase font-bold">Aporte Anual</span>
                            <span className="font-bold text-blue-400 tabular-nums">{monthlyShare.toFixed(1)}%</span>
                        </p>
                        {d.taxpayersEmitted > 0 && (
                            <p className="flex items-center justify-between gap-4 text-slate-300">
                                <span className="text-slate-500 text-[9px] uppercase font-bold">Contribuyentes</span>
                                <span className="font-bold text-slate-300 tabular-nums">{d.taxpayersEmitted.toLocaleString()}</span>
                            </p>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    // Bar label renderer
    const BarLabel = (props: any) => {
        const { x, y, width, height, payload } = props;
        if (height < 30) return null; // Don't show label if bar is too small
        return (
            <text
                x={x + width / 2}
                y={y - 8}
                fill={payload.color}
                textAnchor="middle"
                className="text-[9px] font-bold"
                style={{ fontSize: 9, fontWeight: 700 }}
            >
                {formatCompact(payload.compliance)}%
            </text>
        );
    };

    return (
        <div className={`flex w-full flex-col h-full overflow-y-auto custom-scrollbar ${style.panelBg}`}>
            <div className={`flex flex-col min-h-full items-center px-2 pb-2 pt-3 text-white font-inter sm:px-3`}>
            
            {/* Title */}
            <div className="mb-4 w-full max-w-md shrink-0 text-center">
                <div className={`mx-auto w-full max-w-sm rounded-lg ${style.titleBg} py-1.5`}>
                    <h1 className="px-2 text-xs font-bold tracking-widest text-slate-200 sm:text-sm uppercase">
                        Rendimiento Global de IVA
                    </h1>
                </div>
                <p className={`mt-2 line-clamp-2 text-[10px] leading-relaxed font-medium ${style.subtitle}`}>
                    Análisis mensual del monto real recaudado frente a la meta proyectada.
                </p>
            </div>

            {/* KPI Cards */}
            <div className="w-full shrink-0 flex items-stretch justify-center gap-2 mb-3 max-w-4xl px-1">
                {/* Total Recaudado Card */}
                <div className="flex-1 flex flex-col items-center py-2.5 px-2 bg-slate-900/30 border border-slate-700/30 rounded-xl transition-colors hover:bg-slate-900/40">
                    <p className="text-[9px] text-emerald-400/90 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> Total Recaudado
                    </p>
                    <p className="text-lg sm:text-xl font-black text-white">{formatCompact(totalCollected)}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{fmtCurrency(totalCollected)}</p>
                </div>

                {/* Meta Acumulada Card */}
                <div className="flex-1 flex flex-col items-center py-2.5 px-2 bg-slate-900/30 border border-slate-700/30 rounded-xl transition-colors hover:bg-slate-900/40">
                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                        <Target className="w-3 h-3" /> Meta Acumulada
                    </p>
                    <p className="text-lg sm:text-xl font-black text-slate-300">{formatCompact(totalExpected)}</p>
                    <p className={`text-[9px] mt-0.5 font-bold tabular-nums ${gapColorClass}`}>
                        {gap >= 0 ? "+" : ""}{formatCompact(gap)}
                    </p>
                </div>

                {/* Cumplimiento Global Card */}
                <div className={`flex-1 flex flex-col items-center py-2.5 px-2 rounded-xl border transition-colors hover:bg-slate-900/40 ${getPerformanceBgClass(globalCompliance)}`}>
                    <p className="text-[9px] uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                        {globalCompliance >= 100 ? (
                            <Award className="w-3 h-3 text-emerald-400" />
                        ) : globalCompliance >= 80 ? (
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                        ) : (
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                        )}
                        <span className={globalColorClass}>Cumplimiento</span>
                    </p>
                    <p className="text-2xl sm:text-3xl font-black" style={{ color: globalColor }}>
                        {formatNumber(globalCompliance)}%
                    </p>
                    <p className={`text-[9px] mt-0.5 ${gap >= 0 ? "text-emerald-500" : "text-rose-500"} font-medium`}>
                        {gap >= 0 ? "Sobre meta" : "Bajo meta"}
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 w-full min-h-[280px] text-xs mt-1 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 25, right: 10, left: 10, bottom: 5 }}
                        barGap={2}
                    >
                        <defs>
                            <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                            </linearGradient>
                            <linearGradient id="gradientYellow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.6} />
                            </linearGradient>
                            <linearGradient id="gradientRed" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke={style.grid} 
                            vertical={false} 
                        />
                        
                        <XAxis 
                            dataKey="monthLabel" 
                            stroke={style.xTick}
                            tick={{ fontSize: 11, fontWeight: "600", fill: style.xTick }}
                            axisLine={{ stroke: style.grid }}
                            tickLine={false}
                            dy={5}
                        />
                        
                        <YAxis 
                            stroke={style.yTick} 
                            tickFormatter={(val) => formatCompact(Number(val))}
                            tick={{ fontSize: 10, fill: style.yTick }}
                            axisLine={false}
                            tickLine={false}
                            width={45}
                        />

                        {/* Reference line for average target */}
                        {totalExpected > 0 && data.length > 0 && (
                            <ReferenceLine
                                y={totalExpected / data.length}
                                stroke={style.barReal}
                                strokeDasharray="5 5"
                                strokeWidth={1.5}
                                strokeOpacity={0.6}
                                label={{
                                    value: "Meta",
                                    position: "right",
                                    fill: style.barReal,
                                    fontSize: 9,
                                    fontWeight: 600,
                                }}
                            />
                        )}
                        
                        <Tooltip 
                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} 
                            content={<CustomTooltip />} 
                        />

                        {/* Expected Bar (background) */}
                        <Bar 
                            dataKey="expectedAmount" 
                            name="Meta Estimada"
                            fill={style.barExpected} 
                            radius={[4, 4, 0, 0]} 
                            barSize={16}
                        />

                        {/* Real Collected Bar with gradients */}
                        <Bar 
                            dataKey="realAmount" 
                            name="IVA Recaudado"
                            radius={[4, 4, 0, 0]} 
                            barSize={16}
                            label={<BarLabel />}
                        >
                            {data.map((entry, index) => {
                                let gradientId = "gradientRed";
                                if (entry.compliance >= 100) gradientId = "gradientGreen";
                                else if (entry.compliance >= 80) gradientId = "gradientYellow";
                                
                                return (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={`url(#${gradientId})`} 
                                    />
                                );
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Legend and summary row */}
            <div className="mt-2 w-full shrink-0">
                {/* Static legend */}
                <div className="flex items-center justify-center gap-5 text-[10px] mb-3">
                    <div className="flex items-center gap-1.5 text-slate-300">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: style.barExpected }} />
                        <span>Meta Estimada</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                        <div className="flex items-center gap-0.5">
                            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                            <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
                            <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
                        </div>
                        <span>IVA Recaudado (semáforo)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                        <span className="h-0.5 w-4 border-t-2 border-dashed" style={{ borderColor: style.barReal, borderStyle: 'dashed', borderWidth: 0, borderTopWidth: 2 }} />
                        <span>Meta mensual</span>
                    </div>
                </div>

                {/* Performance summary */}
                {data.length > 0 && (
                    <div className="flex items-center justify-between gap-2 px-2 py-2 bg-slate-900/30 rounded-xl border border-slate-700/20">
                        {/* Best month */}
                        {bestMonth && (
                            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-emerald-400/70 uppercase font-bold tracking-wider">Mejor</span>
                                    <span className="text-[11px] text-emerald-400 font-bold">{bestMonth.monthLabel}: {formatNumber(bestMonth.compliance)}%</span>
                                </div>
                            </div>
                        )}

                        {/* Average performance indicator */}
                        <div className="flex-1 flex flex-col items-center">
                            <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider mb-1">Promedio</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ 
                                            width: `${Math.min(avgCompliance, 120)}%`,
                                            backgroundColor: getPerformanceColor(avgCompliance)
                                        }}
                                    />
                                </div>
                                <span className={`text-xs font-bold ${getPerformanceColorClass(avgCompliance)}`}>
                                    {formatNumber(avgCompliance)}%
                                </span>
                            </div>
                        </div>

                        {/* Worst month */}
                        {worstMonth && (
                            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-rose-400/70 uppercase font-bold tracking-wider">Peor</span>
                                    <span className="text-[11px] text-rose-400 font-bold">{worstMonth.monthLabel}: {formatNumber(worstMonth.compliance)}%</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
        </div>
    );
};

export default PageOneStats;