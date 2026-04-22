import React from "react";

export interface GroupStat {
    groupName: string;
    totalPaidFines: number;
    totalPaidAmount: number;
    totalIvaCollected: number;
    totalIslrCollected: number;
}

interface Props {
    groupStats: GroupStat[];
}

export const GroupPerformanceStats = ({ groupStats }: Props) => {
    const totalPaid = groupStats.reduce((sum, g) => sum + Number(g.totalPaidFines), 0);
    const totalCollected = groupStats.reduce((sum, g) => sum + Number(g.totalPaidAmount), 0);

    const totalIva = groupStats.reduce((sum, g) => sum + Number(g.totalIvaCollected), 0);
    const totalIslr = groupStats.reduce((sum, g) => sum + Number(g.totalIslrCollected), 0);

    const maxIva = Math.max(...groupStats.map(g => g.totalIvaCollected), 1);
    const maxIslr = Math.max(...groupStats.map(g => g.totalIslrCollected), 1);

    const sortedStats = [...groupStats].sort((a, b) => {
        const aScore =
            (a.totalIvaCollected / maxIva) * 0.5 +
            (a.totalIslrCollected / maxIslr) * 0.5;

        const bScore =
            (b.totalIvaCollected / maxIva) * 0.5 +
            (b.totalIslrCollected / maxIslr) * 0.5;

        return bScore - aScore;
    });

    const getBarWidth = (value: number, categoryTotal: number) => {
        const percentage = (value / (categoryTotal || 1)) * 100;
        return `${percentage.toFixed(1)}%`;
    };

    const fmtBs = (n: number) =>
        n.toLocaleString("es-VE", { maximumFractionDigits: 0 });

    const MetricRow = ({
        label,
        colorClass,
        barClass,
        pct,
        value,
        valueTitle,
    }: {
        label: string;
        colorClass: string;
        barClass: string;
        pct: string;
        value: React.ReactNode;
        valueTitle?: string;
    }) => (
        <div
            className="grid w-full min-w-0 grid-cols-1 items-center gap-x-1 gap-y-0.5 sm:grid-cols-[minmax(0,4.5rem)_1fr_minmax(0,3.5rem)] sm:gap-x-2"
        >
            <div className={`min-w-0 text-[8px] font-medium sm:text-[10px] ${colorClass} sm:pr-0.5`}>{label}</div>
            <div className="relative h-2.5 min-w-0 rounded-full bg-slate-700 sm:h-[12px]">
                <div className={`absolute left-0 top-0 h-full rounded-full ${barClass}`} style={{ width: pct, minWidth: "2px" }} />
            </div>
            <div
                className={`min-w-0 text-right text-[7px] tabular-nums sm:text-[10px] ${colorClass} truncate`}
                title={valueTitle}
            >
                {value}
            </div>
        </div>
    );

    return (
        <div className="flex h-full min-h-0 w-full flex-col">
            <div className="flex h-full min-h-0 w-full flex-col bg-slate-900/80 px-2 pb-2 pt-3 sm:px-3">
                <div className="shrink-0 text-center text-white">
                    <p className="mx-auto max-w-sm rounded-md border border-slate-600 bg-slate-800 py-0.5 text-[10px] font-semibold sm:py-1 sm:text-xs">
                        RENDIMIENTO POR GRUPO
                    </p>
                </div>

                <p className="mb-1 line-clamp-1 text-center text-[8px] leading-tight text-slate-500 sm:text-[9px]">
                    Multas, IVA, ISLR.
                </p>

                <div className="custom-scrollbar min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
                    {sortedStats.map((group, i) => (
                        <div key={i} className="border-b border-slate-800/80 pb-1.5 last:border-0 last:pb-0">
                            <div className="mb-1 line-clamp-1 text-left text-[10px] font-semibold text-slate-200 sm:text-xs" title={group.groupName}>
                                {group.groupName}
                            </div>

                            <div className="space-y-1">
                                <MetricRow
                                    label="Multas asign."
                                    colorClass="text-sky-400"
                                    barClass="bg-sky-500"
                                    pct={getBarWidth(group.totalPaidFines, totalPaid)}
                                    value={group.totalPaidFines}
                                />
                                <MetricRow
                                    label="Pagado multas"
                                    colorClass="text-emerald-400"
                                    barClass="bg-emerald-500"
                                    pct={getBarWidth(group.totalPaidAmount, totalCollected)}
                                    value={<span>Bs. {fmtBs(Number(group.totalPaidAmount))}</span>}
                                    valueTitle={String(group.totalPaidAmount)}
                                />
                                <MetricRow
                                    label="IVA pagado"
                                    colorClass="text-amber-400"
                                    barClass="bg-amber-500"
                                    pct={getBarWidth(group.totalIvaCollected, totalIva)}
                                    value={<span>Bs. {fmtBs(Number(group.totalIvaCollected))}</span>}
                                />
                                <MetricRow
                                    label="ISLR pagado"
                                    colorClass="text-rose-400"
                                    barClass="bg-rose-500"
                                    pct={getBarWidth(group.totalIslrCollected, totalIslr)}
                                    value={<span>Bs. {fmtBs(Number(group.totalIslrCollected))}</span>}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
