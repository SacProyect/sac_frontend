"use client"
import BestSuperVisor from "@/components/stats/page2/BestSuperVisor"
import TopFiscal from "@/components/stats/page2/TopFiscal"
import TopFiveFiscals from "@/components/stats/page2/TopFiveFiscals"






interface StatisticsPage2Props {
    year?: number;
}

export default function StatisticsPage2({ year }: StatisticsPage2Props) {
    return (
        <div className="w-full lg:w-[82vw] lg:h-[90.2vh] flex flex-col lg:flex-row items-center justify-center bg-[#1c1c1b] text-white p-6">
            <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2 lg:pt-16">
                {/* Columna Izquierda */}
                <div className="flex flex-col gap-6">
                    {/* Estadística 1: Mejor Supervisor por Coordinaciones */}
                    <BestSuperVisor year={year} />

                    {/* Estadística 3: Top 5 Fiscales por Coordinación */}
                    <TopFiveFiscals year={year} />
                </div>

                {/* Columna Derecha - Top Fiscales General - Expandido */}
                <div className="flex flex-col">
                    <TopFiscal year={year} />
                </div>
            </div>
        </div>
    )
}
