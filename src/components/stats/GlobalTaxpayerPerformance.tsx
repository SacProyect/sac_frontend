import React from "react";


export interface CollectionStats {
    ivaCollected: number;
    islrCollected: number;
    finesCollected: number;
    totalCollected: number;
}


export const PageTwoStats = ({ stats }: { stats: CollectionStats }) => {
    const getBarWidthPercent = (value: number) =>
        `${stats.totalCollected ? (value / stats.totalCollected) * 100 : 0}%`;

    const getPercentage = (value: number) =>
        `${stats.totalCollected ? Math.round((value / stats.totalCollected) * 100) : 0}%`;

    const bars = [
        { label: "IVA", value: stats.ivaCollected },
        { label: "ISLR", value: stats.islrCollected },
        { label: "Multas", value: stats.finesCollected },
        { label: "Total", value: stats.totalCollected }
    ];

    return (
        <div className="w-full lg:w-[41vw] h-full lg:h-[40vh] pt-16 lg:pt-0">
            <div className="bg-[#1c1c1b] w-full h-full p-4 flex flex-col justify-between">
                {/* Title */}
                <div className="bg-[#292d33] border border-[#b7c0cd] rounded-md py-2">
                    <p className="text-lg font-semibold text-center text-white font-inter">
                        CUMPLIMIENTO DE OBLIGACIONES
                    </p>
                </div>

                {/* Description */}
                <p className="text-[11px] md:text-xs text-[#838382] font-inter text-center leading-5 pt-8">
                    A continuación, se puede observar la tasa y total de los contribuyentes registrados que han realizado a tiempo sus pagos, cuáles se han ido a compromiso de pago y cuáles no han cumplido. Asimismo, se presenta el porcentaje de contribuyentes multados.
                </p>

                {/* Bars + Percentage Scale */}
                <div className="relative flex flex-col justify-center flex-1">
                    {/* Bars */}
                    <div className="space-y-8">
                        {bars.map((bar, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <span className="text-[#949491] text-xs w-[28%]">{bar.label}</span>
                                <div className="w-full bg-[#333] rounded-full overflow-hidden h-[20px] relative">
                                    <div className="w-full bg-[#333] rounded-full overflow-hidden h-[20px] relative">
                                        {/* Background bar with width */}
                                        <div
                                            className="bg-[#5996ff] h-full"
                                            style={{ width: getBarWidthPercent(bar.value) }}
                                        />
                                        {/* Centered value, always visible */}
                                        <span className="absolute inset-0 flex items-center justify-center text-xs text-white">
                                            {bar.value}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-[#949491] text-xs w-[12%] text-right">
                                    {getPercentage(bar.value)}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Percentage Scale */}
                    <div className="absolute bottom-0 lg:-bottom-4 left-[20%] right-[14%] lg:left-[22%] lg:right-[16%] flex justify-between text-[#808584] text-[11px] font-inter">
                        {[...Array(11)].map((_, i) => (
                            <span key={i} className="w-[1px] text-center">
                                {i * 10}%
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
