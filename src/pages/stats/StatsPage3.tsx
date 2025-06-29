"use client"
import BetterCompliance from "@/components/stats/page3/BetterCompliance"
import Goal from "@/components/stats/page3/Goal"
import LowCompliance from "@/components/stats/page3/LowCompliance"
import MediumCompliance from "@/components/stats/page3/MediumCompliance"
import { Download, Users, AlertTriangle, TrendingDown, BarChart3, TrendingUp } from "lucide-react"








export default function StatisticsPage3() {
    return (
        <div className="flex flex-col w-full h-full gap-4 p-4">
            {/* Fila superior - 2 estadísticas */}
            <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Estadística 1: Contribuyentes con Mayor Cumplimiento */}
                <BetterCompliance />

                {/* Estadística 2: Contribuyentes con Cumplimiento Medio */}
                <MediumCompliance />
            </div>

            {/* Fila inferior - 2 estadísticas */}
            <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Estadística 3: Contribuyentes con Cumplimiento Bajo */}
                <LowCompliance />

                {/* Estadística 4: Comparación Recaudación Real vs Esperada */}
                <Goal />
            </div>
        </div>
    )
}
