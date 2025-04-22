import React from "react";

export interface GroupStat {
    groupName: string;
    totalPaidFines: number;
    totalPaidAmount: number;
}

interface Props {
    groupStats: GroupStat[];
}

export const GroupPerformanceStats = ({ groupStats }: Props) => {
    const totalPaid = groupStats.reduce((sum, group) => sum + group.totalPaidFines, 0);
    const totalCollected = groupStats.reduce((sum, group) => sum + group.totalPaidAmount, 0);

    const maxPaid = Math.max(...groupStats.map(g => g.totalPaidFines));
    const minPaid = Math.min(...groupStats.map(g => g.totalPaidFines));
    const maxCollected = Math.max(...groupStats.map(g => g.totalPaidAmount));
    const minCollected = Math.min(...groupStats.map(g => g.totalPaidAmount));

    const spreadPaid = (maxPaid - minPaid) / (maxPaid || 1);
    const spreadCollected = (maxCollected - minCollected) / (maxCollected || 1);

    const totalSpread = spreadPaid + spreadCollected || 1;
    const paidWeight = spreadPaid / totalSpread;
    const collectedWeight = spreadCollected / totalSpread;

    const sortedStats = [...groupStats].sort((a, b) => {
        const aScore = (a.totalPaidFines / maxPaid) * paidWeight + (a.totalPaidAmount / maxCollected) * collectedWeight;
        const bScore = (b.totalPaidFines / maxPaid) * paidWeight + (b.totalPaidAmount / maxCollected) * collectedWeight;
        return bScore - aScore;
    });

    const getBarWidth = (value: number, total: number) =>
        `${Math.round((value / total) * 100)}%`;

    return (
        <div className="w-full lg:w-[41vw] h-full lg:h-[50vh] pt-16 lg:pt-0 ">
            <div className="bg-[#1c1c1b] p-4 w-full h-[50vh] flex flex-col">
                <div className="text-white text-xl font-semibold font-inter text-center mb-2">
                    <div className="flex justify-center">
                        <p className="w-full lg:w-96 bg-[#292d33] border border-[#b7c0cd] py-1 rounded-md text-[14px]">
                            RENDIMIENTO POR GRUPO
                        </p>
                    </div>
                </div>

                <p className="text-[11px] md:text-xs text-[#838382] mb-2 font-inter text-center leading-5 px-2">
                    Esta gráfica muestra el rendimiento total de cada grupo. Se mide con base en la cantidad de multas pagadas y el monto total recaudado durante el año.
                </p>

                {/* Scrollable area fills remaining space */}
                <div className="flex-1 overflow-y-auto custom-scroll pr-1 pt-4">
                    {sortedStats.map((group, i) => (
                        <div key={i} className="mb-6">
                            <div className="text-[#d2d2d2] text-sm mb-1 text-center lg:text-left">
                                {group.groupName}
                            </div>

                            <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-3 mb-1">
                                <div className="text-[#7ca7ff] text-xs w-full lg:w-[100px] text-center lg:text-left">Multas pagadas</div>
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

                            <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-3">
                                <div className="text-[#7cffcc] text-xs w-full lg:w-[100px] text-center lg:text-left">Recaudado</div>
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
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
