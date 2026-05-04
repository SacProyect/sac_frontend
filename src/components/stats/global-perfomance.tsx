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
    Cell
} from "recharts";
import { TrendingUp, Target, DollarSign } from "lucide-react";

export type ChartData = {
    month: string;            // "2025-01"
    expectedAmount: number;   // monthly expected
    realAmount: number;       // monthly collected
    taxpayersEmitted: number; // count of taxpayers with emition_date in that month
};

export type StatsDesignVariant = "classic" | "contrast" | "minimal";

const DESIGN_STYLES: Record<StatsDesignVariant, {
    panelBg: string;
    titleBorder: string;
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
        titleBorder: "border-slate-500",
        titleBg: "bg-slate-800/90",
        subtitle: "text-slate-400",
        grid: "#334155",
        yTick: "#cbd5e1",
        xTick: "#94a3b8",
        tooltipBg: "bg-slate-900/95",
        barReal: "#3b82f6",     // bright blue
        barExpected: "#334155", // dark slate
    },
    contrast: {
        panelBg: "bg-slate-950",
        titleBorder: "border-blue-400/60",
        titleBg: "bg-blue-950/60",
        subtitle: "text-slate-200",
        grid: "#3b82f6",
        yTick: "#ffffff",
        xTick: "#e2e8f0",
        tooltipBg: "bg-blue-950/95",
        barReal: "#0ea5e9",
        barExpected: "#1e3a8a",
    },
    minimal: {
        panelBg: "bg-slate-900/40",
        titleBorder: "border-slate-700",
        titleBg: "bg-slate-900/30",
        subtitle: "text-slate-500",
        grid: "#1e293b",
        yTick: "#94a3b8",
        xTick: "#64748b",
        tooltipBg: "bg-slate-900/90",
        barReal: "#60a5fa",
        barExpected: "#1e293b",
    },
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
            (chartData ?? []).map(d => {
                const paid = Number(d.realAmount) || 0;
                const exp = Number(d.expectedAmount) || 0;
                const compliance = exp > 0 ? (paid / exp) * 100 : (paid > 0 ? 100 : 0);

                // Semáforo dinámico opcional: para resaltar si se logró la meta
                let color = style.barReal;
                if (exp > 0) {
                    if (compliance >= 100) color = "#10b981"; // Verde
                    else if (compliance >= 80) color = "#f59e0b"; // Amarillo
                    else color = "#ef4444"; // Rojo
                }

                return {
                    monthLabel: getShortMonthName(d.month),
                    realAmount: paid,
                    expectedAmount: exp,
                    taxpayersEmitted: d.taxpayersEmitted ?? 0,
                    rawMonth: d.month,
                    compliance,
                    color,
                };
            }),
        [chartData, style.barReal]
    );

    const totalCollected = useMemo(() => data.reduce((sum, item) => sum + item.realAmount, 0), [data]);
    const totalExpected = useMemo(() => data.reduce((sum, item) => sum + item.expectedAmount, 0), [data]);
    const globalCompliance = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : (totalCollected > 0 ? 100 : 0);

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

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            // Recharts tooltip sends both bars in payload. Let's grab the actual data from the first one.
            const d = payload[0].payload;
            const monthlyShare = totalCollected > 0 ? (d.realAmount / totalCollected) * 100 : 0;

            return (
                <div className={`p-3 border border-slate-700 rounded-xl text-xs shadow-2xl ${style.tooltipBg}`}>
                    <p className="font-bold text-white mb-2 pb-1 border-b border-slate-700/50 uppercase tracking-wider">
                        Recaudación: {d.monthLabel}
                    </p>
                    
                    <div className="space-y-2 mb-3">
                        <div>
                            <p className="text-slate-400 text-[10px] uppercase font-semibold">IVA Recaudado</p>
                            <p className="text-lg font-black text-white leading-none mt-0.5" style={{ color: d.color }}>
                                {fmtCurrency(d.realAmount)}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-[10px] uppercase font-semibold">Meta Estimada</p>
                            <p className="text-sm font-semibold text-slate-300 leading-none mt-0.5">
                                {fmtCurrency(d.expectedAmount)}
                            </p>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-700/50 space-y-1">
                        <p className="flex justify-between gap-4 text-slate-300">
                            <span className="text-slate-500 text-[9px] uppercase font-bold">Cumplimiento:</span>
                            <span className="font-bold" style={{ color: d.color }}>{d.compliance.toFixed(1)}%</span>
                        </p>
                        <p className="flex justify-between gap-4 text-slate-300">
                            <span className="text-slate-500 text-[9px] uppercase font-bold">Aporte Anual:</span>
                            <span className="font-bold text-blue-300">{monthlyShare.toFixed(1)}%</span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={`flex h-full min-h-0 flex-col items-center ${style.panelBg} px-2 pb-2 pt-3 text-white font-inter sm:px-3`}>
            
            {/* Title */}
            <div className="mb-3 w-full max-w-md shrink-0 text-center">
                <div className={`mx-auto w-full max-w-sm rounded-md border ${style.titleBorder} ${style.titleBg}`}>
                    <h1 className="px-2 py-1.5 text-xs font-semibold tracking-wide text-white sm:text-sm uppercase">
                        Rendimiento Global de IVA
                    </h1>
                </div>
                <p className={`mt-1.5 line-clamp-2 text-[10px] leading-tight ${style.subtitle}`}>
                    Análisis mensual del monto real recaudado frente a la meta proyectada.
                </p>
            </div>

            {/* KPI Cards */}
            <div className="w-full shrink-0 flex items-center justify-center gap-3 mb-2 max-w-4xl px-1">
                <div className="flex-1 flex flex-col items-center py-2 bg-slate-900/50 border border-slate-700 rounded-lg">
                    <p className="text-[10px] text-emerald-400/80 uppercase font-bold tracking-widest mb-0.5 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> Total Recaudado
                    </p>
                    <p className="text-lg sm:text-xl font-black text-white">{formatCompact(totalCollected)}</p>
                </div>
                <div className="flex-1 flex flex-col items-center py-2 bg-slate-900/50 border border-slate-700 rounded-lg">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-0.5 flex items-center gap-1">
                        <Target className="w-3 h-3" /> Meta Acumulada
                    </p>
                    <p className="text-lg sm:text-xl font-black text-slate-300">{formatCompact(totalExpected)}</p>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[250px] sm:h-[280px] w-full shrink-0 text-xs mt-1 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                        barGap={0}
                    >
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
                        
                        <Tooltip 
                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} 
                            content={<CustomTooltip />} 
                        />

                        {/* Expected Bar */}
                        <Bar 
                            dataKey="expectedAmount" 
                            name="Meta Estimada"
                            fill={style.barExpected} 
                            radius={[4, 4, 0, 0]} 
                            barSize={18}
                        />

                        {/* Real Collected Bar */}
                        <Bar 
                            dataKey="realAmount" 
                            name="IVA Recaudado"
                            radius={[4, 4, 0, 0]} 
                            barSize={18}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Static legend (always visible) */}
            <div className="mt-2 flex w-full shrink-0 items-center justify-center gap-5 text-[10px]">
                <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: style.barExpected }} />
                    <span>Meta Estimada</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                    <div className="flex items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                        <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
                        <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
                    </div>
                    <span>IVA Recaudado (cumplimiento)</span>
                </div>
            </div>
        </div>
    );
};

export default PageOneStats;
