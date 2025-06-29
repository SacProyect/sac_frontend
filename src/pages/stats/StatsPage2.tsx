"use client"
import BestSuperVisor from "@/components/stats/page2/BestSuperVisor"
import TopFiscal from "@/components/stats/page2/TopFiscal"
import TopFiveFiscals from "@/components/stats/page2/TopFiveFiscals"
import TopGrowth from "@/components/stats/page2/TopGrowth"
import { Download, Trophy, TrendingUp, Users, Award } from "lucide-react"






export default function StatisticsPage2() {
    return (
        <div className="w-full lg:w-[82vw] lg:h-[90.2vh] flex flex-col lg:flex-row items-center justify-center bg-[#1c1c1b] text-white p-6">
            <div className="grid w-full grid-cols-1 gap-6 lg:h-full lg:grid-cols-2">
                {/* Estadística 1: Mejor Supervisor por Grupos */}
                <BestSuperVisor />


                {/* Estadística 2: Top Fiscales General */}
                <TopFiscal />


                {/* Estadística 3: Top 5 Fiscales por Grupo */}
                <TopFiveFiscals />

                {/* Estadística 4: Coordinador con Mayor Crecimiento */}
                <TopGrowth />
            </div>
        </div>
    )
}
