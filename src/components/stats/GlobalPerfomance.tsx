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
    // Map "YYYY-MM" -> "Ene", "Feb", ...
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
                <div className="rounded bg-black/80 px-3 py-2 text-[11px] text-white">
                    <div className="mb-1 font-semibold">Mes: {label}</div>
                    <div>Pagado (IVA): {fmtCurrency(p.realAmount)}</div>
                    <div>Esperado: {fmtCurrency(p.expectedAmount)}</div>
                    <div>Contribuyentes Creados: {p.taxpayersEmitted ?? 0}</div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col items-center w-full lg:w-full h-[50vh] lg:h-full bg-[#1c1c1b] pt-8 lg:pb-12 lg:pt-4 text-white font-inter">
            {/* Title and Description */}
            <div className="w-full mb-4 text-center">
                <div className="w-full border border-[#b7c0cd] bg-[#292d33] rounded-md">
                    <h1 className="px-4 py-2 text-sm font-semibold text-white lg:text-sm font-inter whitespace-nowrap">
                        RENDIMIENTO GLOBAL DE IVA
                    </h1>
                </div>
                <p className="mt-2 text-[9.4px] leading-[12.9px] text-[#838382] font-inter">
                    Recaudación mensual de IVA en barras horizontales. Pasa el mouse para ver esperado y contribuyentes emitidos.
                </p>
            </div>

            {/* Chart */}
            <div className="w-full h-[60vh] lg:h-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical" // horizontal bars
                        margin={{ top: 10, right: 24, left: 16, bottom: 10 }}
                    >
                        <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                        {/* Y axis: months (categories) */}
                        <YAxis
                            type="category"
                            dataKey="monthLabel"
                            width={32}
                            tick={{ fill: "#cfd3da", fontSize: 10 }}
                            axisLine={{ stroke: "#555" }}
                            tickLine={{ stroke: "#555" }}
                        />
                        {/* X axis: amounts (numbers) */}
                        <XAxis
                            type="number"
                            domain={[0, maxValue]}
                            tickFormatter={(v) =>
                                Number(v).toLocaleString("es-VE", { maximumFractionDigits: 0 })
                            }
                            tick={{ fill: "#cfd3da", fontSize: 10 }}
                            axisLine={{ stroke: "#555" }}
                            tickLine={{ stroke: "#555" }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                            dataKey="realAmount"
                            name="Pagado"
                            fill="#5996ff"
                            barSize={18}
                            radius={[0, 6, 6, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PageOneStats;
