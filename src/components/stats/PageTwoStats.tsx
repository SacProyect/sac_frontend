import React from "react";

export const PageTwoStats = () => {



    
    return (
        <div className="flex justify-center w-[42vw] bg-transparent">
            <div className="w-full h-[510px]">
                <div className="bg-[#1c1c1b] w-full h-[503px]">
                    <div className="relative top-[15px] w-full h-[434px]">

                        <div className="absolute top-[409px] left-0 w-full h-[25px]">
                            {["70", "60", "50", "40", "30", "20", "10", "0"].map((val, i) => (
                                <div
                                    key={val}
                                    className="absolute text-[12.2px] text-center font-inter"
                                    style={{ left: `${599 - i * 59}px`, top: "5px", width: "18px", color: "#808584" }}
                                >
                                    {val}
                                </div>
                            ))}
                        </div>

                        <div className="absolute top-[361px] left-0 w-full h-[46px]">
                            <div className="absolute top-[14px] left-[89px] w-[98px] text-[#909692] text-[12.3px] font-inter">
                                En investigación
                            </div>
                        </div>

                        <div className="absolute top-[325px] left-[146px] text-[#949491] text-[12.2px] w-[41px] font-inter">
                            Multas
                        </div>

                        <div className="absolute top-[207px] left-[195px] w-[118px] h-[48px] border border-[#0c567b] bg-[#0080c1]" />
                        <div className="absolute top-[156px] left-[195px] w-[412px] h-[47px] border border-[#0471a9] bg-[#0080c1]" />

                        <div className="absolute top-[272px] left-[37px] text-[#929490] text-[12.2px] font-inter">
                            Incumplimiento de Pagos
                        </div>

                        <div className="absolute top-[220px] left-[52px] text-[#939795] text-[12.2px] font-inter">
                            Compromiso de pagos
                        </div>

                        <div className="absolute top-[169px] left-[45px] text-[#929693] text-[12.6px] font-inter">
                            Cumplimiento de Pagos
                        </div>

                        <p className="absolute top-[80px] left-[85px] text-[9.4px] leading-[12.9px] text-center text-[#838382] font-inter w-[516px]">
                            A continuación, se puede observar la tasa y total de los contribuyentes registrados que han realizado a tiempo sus <br />
                            pagos, cuáles se han ido a compromiso de pago y cuáles no han cumplido. Asimismo, se presenta el porcentaje de <br />
                            contribuyentes multados y cuántos han sido investigados.
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
