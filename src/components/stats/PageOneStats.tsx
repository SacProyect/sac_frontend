import React from "react";

export const PageOneStats = () => {


    
    return (
        <div className="flex justify-start w-[42vw]">
            <div className="h-[502px] w-[682px]">
                <div className="h-[502px] bg-cover bg-center relative bg-[#1c1c1b]" >
                    <div className="absolute top-[420px] left-[357px] w-[271px] h-[53px]">
                        <div className="relative top-[5px] left-[4px] bg-[#1c1c1b] border border-[#878d96] rounded-tl-sm h-[43px] w-[264px]">
                            <p className="absolute top-[11px] left-[34px] text-xs text-[#a0a7b1] font-normal font-inter">
                                +40% En relación al año pasado
                            </p>
                        </div>
                    </div>

                    <div className="absolute top-[420px] left-[17px] w-[325px] h-[53px]">
                        <div className="relative top-[5px] left-[4px] bg-[#1c1c1b] border border-[#8b919a] h-[44px] w-[318px]">
                            <p className="absolute top-[10px] left-[19px] text-xs text-[#a1aab4] font-medium font-inter">
                                Octubre ha sido el mes con mejor rendimiento
                            </p>
                        </div>
                    </div>

                    <div className="absolute top-[42px] left-0 w-[682px] h-[354px]">
                        <div className="absolute top-[330px] left-0 w-[658px] h-[24px]">
                            {/* Aquí vendrían los 12 meses renderizados manualmente */}
                            {["Dec", "Nov", "Oct", "Sep", "Aug", "Jul", "Jun", "May", "Apr", "Mar", "Feb", "Jan"].map((month, index) => (
                                <div
                                    key={index}
                                    className="absolute text-[9.5px] text-[#104e7d] text-center font-inter"
                                    style={{ left: `${570 - index * 42}px`, top: "3px", width: "23px" }}
                                >
                                    {month}
                                </div>
                            ))}
                        </div>

                        <div className="absolute top-[28px] left-0 w-[682px] h-[299px]">
                            <div className="absolute top-[92px] left-0 w-[682px] h-[208px]">
                                <div className="absolute top-[3px] left-0 w-[682px] h-[205px]">
                                    {["5", "10", "15", "20", "25"].map((value, i) => (
                                        <div
                                            key={i}
                                            className="absolute text-[#13416c] text-[10px] font-inter text-center"
                                            style={{ top: `${164 - i * 37}px`, left: "74px", width: "14px" }}
                                        >
                                            {value}
                                        </div>
                                    ))}
                                    {/* <img src={image} alt="grafica" className="absolute top-[21px] left-[89px] object-cover h-[187px] w-[521px]" /> */}
                                </div>
                                <div className="absolute top-0 left-[340px] text-[#12446d] text-[10px] text-center font-inter leading-[5.2px]">
                                    2025
                                </div>
                                {/* <img src={image2} alt="icono" className="absolute top-[3px] left-[325px] h-[11px] w-[12px] object-cover" /> */}
                            </div>
                            <p className="absolute top-[25px] left-[61px] text-center text-[#104c74] text-base font-inter leading-[21.1px] w-[557px] pt-4">
                                A continuación, se presenta una estadística del rendimiento global anual <br />
                                de los contribuyentes registrados en la plataforma
                            </p>
                        </div>

                        <div className="absolute top-[325px] left-[79px] text-[#124879] text-[10.7px] font-inter text-center">
                            0
                        </div>

                        <button className="absolute top-0 left-[48px] w-[581px] h-[44px]">
                            <div className="relative top-[7px] left-[5px] bg-[#34383e] rounded-md h-[42px] w-[532px]">
                                <div className="absolute top-[1px] left-[10px] text-white font-semibold text-[24.5px] whitespace-nowrap font-inter">
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
