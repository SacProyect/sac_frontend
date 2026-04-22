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

    const formatYAxis = (v: number | string) => {
        const n = Number(v);
        if (n >= 1_000_000) {
            return n.toLocaleString("es-VE", { maximumFractionDigits: 1, notation: "compact", compactDisplay: "short" });
        }
        return formatCurrency(n);
    };

    return (
        <div className="flex h-full min-h-0 w-full flex-col">
            <div className="flex h-full min-h-0 w-full flex-col justify-between bg-slate-900/80 px-2 pb-2 pt-3 sm:px-3">
                {/* Title */}
                <div className="mx-auto w-full max-w-sm shrink-0 rounded-md border border-slate-600 bg-slate-800 py-1">
                    <p className="px-1 text-center text-xs font-semibold text-white sm:text-sm">
                        RECAUDACIÓN MENSUAL · IVA · {stats?.year ?? ""}
                    </p>
                </div>

                {/* Description */}
                <p className="shrink-0 py-1 text-center text-[9px] leading-tight text-slate-500 sm:text-[10px]">
                    Monto total de IVA recaudado por mes.
                </p>

                {/* Chart */}
                <div className="min-h-0 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 6, right: 4, left: 0, bottom: 4 }}>
                            <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="label"
                                tick={{ fill: "#94a3b8", fontSize: 9 }}
                                axisLine={{ stroke: "#475569" }}
                                tickLine={{ stroke: "#475569" }}
                            />
                            <YAxis
                                domain={[0, maxDomain]}
                                tickFormatter={formatYAxis}
                                tick={{ fill: "#94a3b8", fontSize: 9 }}
                                axisLine={{ stroke: "#475569" }}
                                tickLine={{ stroke: "#475569" }}
                                width={52}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            {/* Optional reference line at total */}
                            <ReferenceLine y={maxDomain} stroke="#475569" strokeDasharray="4 4" />
                            <Bar
                                dataKey="value"
                                name="IVA"
                                fill="#5996ff"
                                radius={[4, 4, 0, 0]}
                                barSize={18}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Footer summary */}
                <div className="mt-1 shrink-0 text-center text-[10px] text-slate-400 sm:text-xs">
                    Total IVA {stats?.year ?? ""}:{" "}
                    <span className="font-semibold text-white">
                        {formatCurrency(stats?.totalIvaCollected ?? 0)}
                    </span>
                </div>
            </div>
        </div>
    );
};
