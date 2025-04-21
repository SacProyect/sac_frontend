import React from "react";

export interface GroupStat {
    groupName: string;
    totalPaidFines: number;       // number of fines paid
    totalPaidAmount: number;  // amount of money collected
}

interface Props {
    groupStats: GroupStat[];
}

export const GroupPerformanceStats = ({ groupStats }: Props) => {
    // Calculate total sums for bar width normalization
    const totalPaid = groupStats.reduce((sum, group) => sum + group.totalPaidFines, 0);
    const totalCollected = groupStats.reduce((sum, group) => sum + group.totalPaidAmount, 0);

    // Get min and max for adaptive weight calculation
    const maxPaid = Math.max(...groupStats.map(g => g.totalPaidFines));
    const minPaid = Math.min(...groupStats.map(g => g.totalPaidFines));
    const maxCollected = Math.max(...groupStats.map(g => g.totalPaidAmount));
    const minCollected = Math.min(...groupStats.map(g => g.totalPaidAmount));

    // Spread (how much each stat varies across groups)
    const spreadPaid = (maxPaid - minPaid) / (maxPaid || 1);
    const spreadCollected = (maxCollected - minCollected) / (maxCollected || 1);

    // Normalize weights
    const totalSpread = spreadPaid + spreadCollected || 1;
    const paidWeight = spreadPaid / totalSpread;
    const collectedWeight = spreadCollected / totalSpread;

    // Sort using performance score weighted by spread dominance
    const sortedStats = [...groupStats].sort((a, b) => {
        const aScore =
            (a.totalPaidFines / maxPaid) * paidWeight +
            (a.totalPaidAmount / maxCollected) * collectedWeight;
        const bScore =
            (b.totalPaidFines / maxPaid) * paidWeight +
            (b.totalPaidAmount / maxCollected) * collectedWeight;

        return bScore - aScore;
    });

    // Helper to get bar width (max = 250px per metric)
    const getBarWidth = (value: number, total: number) =>
        `${Math.round((value / total) * 250)}px`;

    return (
        <div className="flex justify-center w-1/2 ">
            <div className="w-full bg-[#1c1c1b] pt-4">
                <div className="w-full text-white text-xl font-semibold font-inter text-center">
                    <div className="flex items-center justify-center">
                        <p className="w-96 bg-[#292d33] border border-[#b7c0cd] py-1 rounded-md">
                            RENDIMIENTO POR GRUPO
                        </p>
                    </div>
                </div>

                <p className="  mt-4 text-center px-16 mb-8  text-[9.4px] leading-[12.9px] text-[#838382] font-inter">
                    Esta gráfica muestra el rendimiento total de cada grupo. Se mide con base en la cantidad de multas pagadas y el monto total recaudado durante el año.
                </p>

                {/* Scrollable container for group stats */}
                <div className="max-h-[400px] overflow-y-auto custom-scroll">
                    {sortedStats.map((group, i) => (
                        <div key={i} className="mb-6 flex flex-col pl-28">
                            <div className="text-[#d2d2d2] text-sm mb-1">{group.groupName}</div>

                            {/* Multas pagadas */}
                            <div className="flex items-center space-x-3 mb-1">
                                <div className="w-[80px] text-[#7ca7ff] text-xs">Multas pagadas</div>
                                <div className="relative h-[18px] bg-[#2a2e34] w-[250px] rounded-full">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-[#5996ff] rounded-full"
                                        style={{ width: getBarWidth(group.totalPaidFines, totalPaid) }}
                                    />
                                </div>
                                <div className="text-[#7ca7ff] text-xs min-w-[40px]">{group.totalPaidFines}</div>
                            </div>

                            {/* Monto recaudado */}
                            <div className="flex items-center space-x-3">
                                <div className="w-[80px] text-[#7cffcc] text-xs">Recaudado</div>
                                <div className="relative h-[18px] bg-[#2a2e34] w-[250px] rounded-full">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-[#42f5c5] rounded-full"
                                        style={{ width: getBarWidth(group.totalPaidAmount, totalCollected) }}
                                    />
                                </div>
                                <div className="text-[#7cffcc] text-xs min-w-[40px]">
                                    {group.totalPaidAmount} BS
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
