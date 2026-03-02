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
    ReferenceLine,
} from "recharts";

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

// Custom tooltip to format currency and show month label
const CustomTooltip = ({ active, payload, label }: any) => {
    // comments in English
    if (active && payload && payload.length) {
        const value = payload[0].value as number;
        const formatted = value.toLocaleString("es-VE", { maximumFractionDigits: 2 });
        return (
            <div className="rounded bg-slate-800 border border-slate-600 px-2 py-1 text-[11px] text-white shadow-xl">
                <div className="font-semibold">{label}</div>
                <div>IVA: {formatted}</div>
            </div>
        );
    }
    return null;
};

export const PageTwoStats: React.FC<{ stats: MonthlyIvaStats }> = ({ stats }) => {
    // comments in English
    // Build chart data: 12 points, using month short name as label
    const data = useMemo(
        () =>
            (stats?.months ?? []).map((m) => ({
                label: m.monthName.slice(0, 3),
                value: m.ivaCollected,
                fullLabel: m.monthName,
            })),
        [stats?.months]
    );

    // If total is zero (edge case), fall back to max month to avoid flat line domain
    const maxDomain =
        stats?.totalIvaCollected && stats.totalIvaCollected > 0
            ? stats.totalIvaCollected
            : Math.max(...data.map((d) => d.value), 1);

    const formatCurrency = (n: number) =>
        n.toLocaleString("es-VE", { maximumFractionDigits: 2 });

    return (
        <div className="w-full h-full pt-16 lg:w-full lg:h-full lg:pt-0">
            <div className="bg-slate-900 w-full h-full lg:p-4 flex flex-col justify-between">
                {/* Title */}
                <div className="bg-slate-800 border border-slate-600 rounded-md py-1">
                    <p className="text-base font-semibold text-center text-white font-inter">
                        RECAUDACIÓN MENSUAL · IVA · {stats?.year ?? ""}
                    </p>
                </div>

                {/* Description */}
                <p className="text-[11px] md:text-xs lg:text-xs text-slate-500 font-inter text-center leading-5 lg:py-1 md:py-8">
                    Monto total recaudado de IVA por mes.
                </p>

                {/* Chart */}
                <div className="flex-1 min-h-[18rem] md:min-h-[22rem] lg:min-h-[18rem]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 8, left: 4, bottom: 10 }}>
                            <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="label"
                                tick={{ fill: "#94a3b8", fontSize: 10 }}
                                axisLine={{ stroke: "#475569" }}
                                tickLine={{ stroke: "#475569" }}
                            />
                            <YAxis
                                domain={[0, maxDomain]}
                                tickFormatter={(v) => formatCurrency(v)}
                                tick={{ fill: "#94a3b8", fontSize: 10 }}
                                axisLine={{ stroke: "#475569" }}
                                tickLine={{ stroke: "#475569" }}
                                width={80}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            {/* Optional reference line at total */}
                            <ReferenceLine y={maxDomain} stroke="#475569" strokeDasharray="4 4" />
                            <Bar
                                dataKey="value"
                                name="IVA"
                                fill="#5996ff"
                                radius={[6, 6, 0, 0]}
                                barSize={24}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Footer summary */}
                <div className="mt-4 text-center text-xs text-slate-400">
                    Total IVA {stats?.year ?? ""}:{" "}
                    <span className="font-semibold text-white">
                        {formatCurrency(stats?.totalIvaCollected ?? 0)}
                    </span>
                </div>
            </div>
        </div>
    );
};
