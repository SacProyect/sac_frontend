import React from "react";

export interface FinesStat {
    paid: number,
    unpaid: number,
    compromises: number,
    fines: number,
}


export const PageTwoStats = ({ finesStats }: { finesStats: FinesStat }) => {

    console.log(finesStats)

    // Function to get bar width proportional to the total fines (max = 412px)
    const getBarWidth = (value: number) => ` ${( finesStats? value / finesStats.fines : 0) * 412}px`;

    // Function to get percentage label
    const getPercentage = (value: number) => ` ${ finesStats? Math.round((value / finesStats.fines) * 100): 0}%`;

    return (
        <div className="flex justify-center w-[42vw] bg-transparent">
            <div className="w-full h-[510px]">
                <div className="bg-[#1c1c1b] w-full h-[503px]">
                    <div className="relative top-[15px] w-full h-[434px]">

                        {/* Percentage Scale from 0% to 100% under the bars */}
                        <div className="absolute top-[409px] left-[192px] w-[412px] h-[25px] flex justify-between text-[#808584] text-[12.2px] font-inter">
                            {[...Array(11)].map((_, i) => (
                                <div key={i} className="text-center" style={{ width: "1px" }}>
                                    {i * 10}%
                                </div>
                            ))}
                        </div>

                        {/* Labels */}
                        <div className="absolute top-[325px] left-[146px] text-[#949491] text-[12.2px] w-[41px] font-inter">
                            Multas
                        </div>

                        <div className="absolute top-[272px] left-[37px] text-[#929490] text-[12.2px] font-inter">
                            Incumplimiento de Pagos
                        </div>

                        <div className="absolute top-[220px] left-[52px] text-[#939795] text-[12.2px] font-inter">
                            Compromiso de pagos
                        </div>

                        <div className="absolute top-[169px] left-[45px] text-[#929693] text-[12.6px] font-inter">
                            Cumplimiento de Pagos
                        </div>

                        {/* Bars */}
                        <div className="absolute top-[325px] left-[195px] h-[20px] bg-[#5996ff] rounded-full" style={{ width: getBarWidth(finesStats? finesStats.fines : 0) }} />
                        <div className="absolute top-[273px] left-[195px] h-[20px] bg-[#5996ff] rounded-full" style={{ width: getBarWidth(finesStats? finesStats.unpaid : 0) }} />
                        <div className="absolute top-[222px] left-[195px] h-[20px] bg-[#5996ff] rounded-full" style={{ width: getBarWidth(finesStats? finesStats.compromises : 0) }} />
                        <div className="absolute top-[170px] left-[195px] h-[20px] bg-[#5996ff] rounded-full" style={{ width: getBarWidth(finesStats? finesStats.paid : 0) }} />

                        {/* Percentages at the end of each bar */}
                        <div className="absolute top-[325px] left-[calc(195px+412px+10px)] text-[#949491] text-[12.2px] font-inter">
                            {finesStats ? getPercentage(finesStats.fines) : 0}
                        </div>

                        <div className="absolute top-[273px] left-[calc(195px+412px+10px)] text-[#929490] text-[12.2px] font-inter">
                            {finesStats ? getPercentage(finesStats.unpaid) : 0}
                        </div>

                        <div className="absolute top-[222px] left-[calc(195px+412px+10px)] text-[#939795] text-[12.2px] font-inter">
                            {finesStats ? getPercentage(finesStats.compromises) : 0}
                        </div>

                        <div className="absolute top-[170px] left-[calc(195px+412px+10px)] text-[#929693] text-[12.6px] font-inter">
                            {finesStats ? getPercentage(finesStats.paid) : 0}
                        </div>

                        <p className="absolute top-[80px] left-[85px] text-[9.4px] leading-[12.9px] text-center text-[#838382] font-inter w-[516px]">
                            A continuación, se puede observar la tasa y total de los contribuyentes registrados que han realizado a tiempo sus <br />
                            pagos, cuáles se han ido a compromiso de pago y cuáles no han cumplido. Asimismo, se presenta el porcentaje de <br />
                            contribuyentes multados.
                        </p>

                        <button className="absolute top-[11px] left-[50px] w-[36rem] h-[50px]">
                            <div className="relative top-[5px] left-[5px] h-[42px] w-full bg-[#292d33] border border-[#b7c0cd] rounded-md">
                                <div className="absolute top-[1px] left-[9px] text-white text-[24.2px] font-semibold font-inter whitespace-nowrap">
                                    RENDIMIENTO GLOBAL DE CONTRIBUYENTES
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
