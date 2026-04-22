// comments in English
import React, { useMemo } from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";

export type ChartData = {
    month: string;            // "2025-01"
    expectedAmount: number;   // monthly expected
    realAmount: number;       // monthly collected
    taxpayersEmitted: number;   // count of taxpayers with emition_date in that month
};

const PageOneStats = ({ chartData }: { chartData: ChartData[] }) => {
    const getShortMonthName = (monthStr: string) => {
        const monthNum = parseInt(monthStr.split("-")[1], 10);
        const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        return months[monthNum - 1] || monthStr;
    };

    // comments in English
    // Prepare data for horizontal bars: keep extra fields for tooltip
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

    // A sane max domain so short bars don’t look microscopic; base on max between real and expected
    const maxValue = useMemo(
        () => Math.max(1, ...data.map(d => Math.max(d.realAmount, d.expectedAmount))),
        [data]
    );

    const fmtCurrency = (n: number) =>
        (n ?? 0).toLocaleString("es-VE", {
            style: "currency",
            currency: "VES",
            minimumFractionDigits: 2,
        });

    // Custom tooltip to show expected and emitted on hover
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const p = payload[0]?.payload ?? {};
            return (
                <div className="rounded bg-slate-800 border border-slate-600 px-3 py-2 text-[11px] text-white shadow-xl">
                    <div className="mb-1 font-semibold">Mes: {label}</div>
                    <div>Pagado (IVA): {fmtCurrency(p.realAmount)}</div>
                    <div>Esperado: {fmtCurrency(p.expectedAmount)}</div>
                    {/* <div>Contribuyentes Creados: {p.taxpayersEmitted ?? 0}</div> */}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex h-full min-h-0 flex-col items-center bg-slate-900/80 px-2 pb-2 pt-3 text-white font-inter sm:px-3">
            {/* Title and Description */}
            <div className="mb-2 w-full max-w-md shrink-0 text-center">
                <div className="mx-auto w-full max-w-sm rounded-md border border-slate-600 bg-slate-800">
                    <h1 className="px-2 py-1.5 text-xs font-semibold text-white sm:text-sm">
                        RENDIMIENTO GLOBAL DE IVA
                    </h1>
                </div>
                <p className="mt-1.5 line-clamp-2 text-[9px] leading-tight text-slate-500 sm:text-[10px]">
                    IVA mensual (barras horizontales). Pasa el mouse para ver el detalle.
                </p>
            </div>

            {/* Chart — ocupa el resto del bloque, proporción equilibrada */}
            <div className="min-h-0 w-full flex-1 text-xs">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical" // horizontal bars
                        margin={{ top: 4, right: 8, left: 4, bottom: 4 }}
                    >
                        <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                        {/* Y axis: months (categories) */}
                        <YAxis
                            type="category"
                            dataKey="monthLabel"
                            width={28}
                            tick={{ fill: "#94a3b8", fontSize: 9 }}
                            axisLine={{ stroke: "#475569" }}
                            tickLine={{ stroke: "#475569" }}
                        />
                        {/* X axis: amounts (numbers) */}
                        <XAxis
                            type="number"
                            domain={[0, maxValue]}
                            tickFormatter={(v) => {
                                const n = Number(v);
                                if (n >= 1_000_000) {
                                    return n.toLocaleString("es-VE", { maximumFractionDigits: 1, notation: "compact", compactDisplay: "short" });
                                }
                                return n.toLocaleString("es-VE", { maximumFractionDigits: 0 });
                            }}
                            tick={{ fill: "#94a3b8", fontSize: 9 }}
                            axisLine={{ stroke: "#475569" }}
                            tickLine={{ stroke: "#475569" }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                            dataKey="realAmount"
                            name="Pagado"
                            fill="#5996ff"
                            barSize={14}
                            radius={[0, 6, 6, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PageOneStats;
