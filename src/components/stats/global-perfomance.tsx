// comments in English
import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

export type ChartData = {
    month: string;            // "2025-01"
    expectedAmount: number;   // monthly expected
    realAmount: number;       // monthly collected
    taxpayersEmitted: number;   // count of taxpayers with emition_date in that month
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
    bar: string;
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
        bar: "#4f8cff",
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
        bar: "#38bdf8",
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
        bar: "#60a5fa",
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
            (chartData ?? []).map(d => ({
                monthLabel: getShortMonthName(d.month),
                realAmount: d.realAmount ?? 0,
                expectedAmount: d.expectedAmount ?? 0,
                taxpayersEmitted: d.taxpayersEmitted ?? 0,
                rawMonth: d.month,
            })),
        [chartData]
    );

    const totalCollected = useMemo(
        () => data.reduce((sum, item) => sum + Number(item.realAmount || 0), 0),
        [data]
    );

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
            const d = payload[0].payload;
            const paid = Number(d.realAmount) || 0;
            const exp = Number(d.expectedAmount) || 0;
            const monthlyShare = totalCollected > 0 ? (paid / totalCollected) * 100 : 0;

            return (
                <div className={`p-2 border border-slate-700 rounded-md text-xs shadow-xl ${style.tooltipBg}`}>
                    <p className="font-bold text-white mb-1">Mes: {d.monthLabel}</p>
                    <p className="text-white">IVA pagado: {fmtCurrency(paid)}</p>
                    <p className="text-slate-300">Esperado: {fmtCurrency(exp)}</p>
                    <p className="text-slate-300">Participación del total: {monthlyShare.toFixed(1)}%</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={`flex h-full min-h-0 flex-col items-center ${style.panelBg} px-2 pb-2 pt-3 text-white font-inter sm:px-3`}>
            {/* Title and Description */}
            <div className="mb-2 w-full max-w-md shrink-0 text-center">
                <div className={`mx-auto w-full max-w-sm rounded-md border ${style.titleBorder} ${style.titleBg}`}>
                    <h1 className="px-2 py-1.5 text-xs font-semibold tracking-wide text-white sm:text-sm">
                        RENDIMIENTO GLOBAL DE IVA
                    </h1>
                </div>
                <p className={`mt-1.5 line-clamp-2 text-[10px] leading-tight ${style.subtitle}`}>
                    IVA mensual (barras horizontales). Pasa el mouse para ver el detalle.
                </p>
            </div>

            {/* Chart */}
            <div className="min-h-0 w-full flex-1 text-xs mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="2 3" stroke={style.grid} horizontal={false} />
                        <XAxis 
                            type="number" 
                            stroke={style.xTick} 
                            tickFormatter={(val) => formatCompact(Number(val))}
                            tick={{ fontSize: 10 }}
                        />
                        <YAxis 
                            dataKey="monthLabel" 
                            type="category" 
                            stroke={style.yTick}
                            tick={{ fontSize: 11, fontWeight: "600" }}
                            width={40}
                        />
                        <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} content={<CustomTooltip />} />
                        <Bar dataKey="realAmount" radius={[0, 6, 6, 0]} barSize={14}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={style.bar} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PageOneStats;
