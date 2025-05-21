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
    // Totales globales para normalizar y calcular porcentajes
    const totalPaid = groupStats.reduce((sum, g) => sum + g.totalPaidFines, 0);
    const totalCollected = groupStats.reduce((sum, g) => sum + g.totalPaidAmount, 0);
    const totalIva = groupStats.reduce((sum, g) => sum + g.totalIvaCollected, 0);
    const totalIslr = groupStats.reduce((sum, g) => sum + g.totalIslrCollected, 0);

    // Máximos para normalizar scores
    const maxPaid = Math.max(...groupStats.map(g => g.totalPaidFines), 1);
    const maxCollected = Math.max(...groupStats.map(g => g.totalPaidAmount), 1);
    const maxIva = Math.max(...groupStats.map(g => g.totalIvaCollected), 1);
    const maxIslr = Math.max(...groupStats.map(g => g.totalIslrCollected), 1);

    const sortedStats = [...groupStats].sort((a, b) => {
        const aScore =
            (a.totalIvaCollected / maxIva) * 0.4 +
            (a.totalIslrCollected / maxIslr) * 0.4 +
            (a.totalPaidFines / maxPaid) * 0.1 +
            (a.totalPaidAmount / maxCollected) * 0.1;

        const bScore =
            (b.totalIvaCollected / maxIva) * 0.4 +
            (b.totalIslrCollected / maxIslr) * 0.4 +
            (b.totalPaidFines / maxPaid) * 0.1 +
            (b.totalPaidAmount / maxCollected) * 0.1;

        return bScore - aScore;
    });

    const getBarWidth = (value: number, total: number) =>
        `${Math.round((value / (total || 1)) * 100)}%`;

    return (
        <div className="w-full lg:w-[41vw] h-full lg:h-[50vh] pt-16 lg:pt-0">
            <div className="bg-[#1c1c1b] p-4 w-full h-[50vh] flex flex-col">
                <div className="mb-2 text-xl font-semibold text-center text-white font-inter">
                    <div className="flex justify-center">
                        <p className="w-full lg:w-96 bg-[#292d33] border border-[#b7c0cd] py-1 rounded-md text-[14px]">
                            RENDIMIENTO POR GRUPO
                        </p>
                    </div>
                </div>

                <p className="text-[11px] md:text-xs text-[#838382] mb-2 font-inter text-center leading-5 px-2">
                    Esta gráfica muestra el rendimiento total de cada grupo. Se mide con base en IVA, ISLR, multas pagadas y monto recaudado.
                </p>

                <div className="flex-1 pt-4 pr-1 overflow-y-auto custom-scroll">
                    {sortedStats.map((group, i) => (
                        <div key={i} className="mb-6">
                            <div className="text-[#d2d2d2] text-sm mb-1 text-center lg:text-left">
                                {group.groupName}
                            </div>

                            {/* Multas pagadas */}
                            <div className="flex flex-col mb-1 lg:flex-row lg:items-center lg:space-x-3">
                                <div className="text-[#7ca7ff] text-xs w-full lg:w-[100px] text-center lg:text-left">
                                    Multas pagadas
                                </div>
                                <div className="relative h-[18px] bg-[#2a2e34] w-full rounded-full mt-1 lg:mt-0">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-[#5996ff] rounded-full"
                                        style={{ width: getBarWidth(group.totalPaidFines, totalPaid) }}
                                    />
                                </div>
                                <div className="text-[#7ca7ff] text-xs min-w-[40px] text-center mt-1 lg:mt-0 lg:text-left">
                                    {group.totalPaidFines}
                                </div>
                            </div>

                            {/* Monto recaudado por multas */}
                            <div className="flex flex-col mb-1 lg:flex-row lg:items-center lg:space-x-3">
                                <div className="text-[#7cffcc] text-xs w-full lg:w-[100px] text-center lg:text-left">
                                    Recaudado Multas
                                </div>
                                <div className="relative h-[18px] bg-[#2a2e34] w-full rounded-full mt-1 lg:mt-0">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-[#42f5c5] rounded-full"
                                        style={{ width: getBarWidth(group.totalPaidAmount, totalCollected) }}
                                    />
                                </div>
                                <div className="text-[#7cffcc] text-xs min-w-[40px] text-center mt-1 lg:mt-0 lg:text-left">
                                    {group.totalPaidAmount} BS
                                </div>
                            </div>

                            {/* IVA */}
                            <div className="flex flex-col mb-1 lg:flex-row lg:items-center lg:space-x-3">
                                <div className="text-[#ffd27f] text-xs w-full lg:w-[100px] text-center lg:text-left">
                                    IVA recaudado
                                </div>
                                <div className="relative h-[18px] bg-[#2a2e34] w-full rounded-full mt-1 lg:mt-0">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-[#ffc74d] rounded-full"
                                        style={{ width: getBarWidth(group.totalIvaCollected, totalIva) }}
                                    />
                                </div>
                                <div className="text-[#ffd27f] text-xs min-w-[40px] text-center mt-1 lg:mt-0 lg:text-left">
                                    {group.totalIvaCollected} BS
                                </div>
                            </div>

                            {/* ISLR */}
                            <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-3">
                                <div className="text-[#ff8d8d] text-xs w-full lg:w-[100px] text-center lg:text-left">
                                    ISLR recaudado
                                </div>
                                <div className="relative h-[18px] bg-[#2a2e34] w-full rounded-full mt-1 lg:mt-0">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-[#ff6b6b] rounded-full"
                                        style={{ width: getBarWidth(group.totalIslrCollected, totalIslr) }}
                                    />
                                </div>
                                <div className="text-[#ff8d8d] text-xs min-w-[40px] text-center mt-1 lg:mt-0 lg:text-left">
                                    {group.totalIslrCollected} BS
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};