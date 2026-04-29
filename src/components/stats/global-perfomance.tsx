// comments in English
import React, { useMemo } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
    ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

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

    const totalCollected = useMemo(
        () => data.reduce((sum, item) => sum + Number(item.realAmount || 0), 0),
        [data]
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

    const formatCompact = (n: number) =>
        (n ?? 0).toLocaleString("es-VE", {
            notation: "compact",
            compactDisplay: "short",
            maximumFractionDigits: 1,
        });

    // Custom tooltip to show expected and emitted on hover
    const labels = data.map((d) => d.monthLabel);
    const values = data.map((d) => d.realAmount);
    const expected = data.map((d) => d.expectedAmount);

    const chartDataset = {
        labels,
        datasets: [
            {
                label: "IVA pagado",
                data: values,
                backgroundColor: style.bar,
                borderRadius: 6,
                borderSkipped: false as const,
                barThickness: 14,
            },
        ],
    };

    const options: ChartOptions<"bar"> = {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: (items) => `Mes: ${items[0]?.label ?? ""}`,
                    label: (ctx) => `IVA pagado: ${fmtCurrency(Number(ctx.raw) || 0)}`,
                    afterLabel: (ctx) => {
                        const i = ctx.dataIndex;
                        const paid = Number(values[i] || 0);
                        const exp = Number(expected[i] || 0);
                        const monthlyShare = totalCollected > 0 ? (paid / totalCollected) * 100 : 0;
                        return [`Esperado: ${fmtCurrency(exp)}`, `Participación del total: ${monthlyShare.toFixed(1)}%`];
                    },
                },
            },
        },
        scales: {
            y: {
                grid: {
                    color: style.grid,
                    borderDash: [2, 3],
                },
                ticks: {
                    color: style.yTick,
                    font: { size: 11, weight: "600" },
                },
            },
            x: {
                min: 0,
                max: maxValue,
                grid: {
                    color: style.grid,
                    borderDash: [2, 3],
                },
                ticks: {
                    color: style.xTick,
                    font: { size: 10 },
                    callback: (value) => formatCompact(Number(value)),
                },
            },
        },
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

            {/* Chart — ocupa el resto del bloque, proporción equilibrada */}
            <div className="min-h-0 w-full flex-1 text-xs">
                <Bar data={chartDataset} options={options} />
            </div>
        </div>
    );
};

export default PageOneStats;
