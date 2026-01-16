"use client"
import BetterCompliance from "@/components/stats/page3/BetterCompliance"
import Goal from "@/components/stats/page3/Goal"
import LowCompliance from "@/components/stats/page3/LowCompliance"
import MediumCompliance from "@/components/stats/page3/MediumCompliance"
import { getTaxpayersCompliance } from "@/components/utils/api/reportFunctions"
import { ComplianceData } from "@/types/stats"
import { Download, Users, AlertTriangle, TrendingDown, BarChart3, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"








interface StatisticsPage3Props {
    year?: number;
}

export default function StatisticsPage3({ year }: StatisticsPage3Props) {
    const [complianceData, setComplianceData] = useState<ComplianceData | null>(null);

    useEffect(() => {
        const fetchCompliance = async () => {
            try {
                const response = await getTaxpayersCompliance(year)
                setComplianceData(response.data)
            } catch (e) {
                toast.error("Error al obtener el cumplimiento.")
            }
        }

        fetchCompliance()
    }, [year])

    const highCompliance = complianceData?.high ?? []
    const mediumCompliance = complianceData?.medium ?? []
    const lowCompliance = complianceData?.low ?? []



    return (
        <div className="flex flex-col  gap-4 p-4 lg:w-[82vw] lg:h-[90.2vh]">
            {/* Fila superior - 2 estadísticas */}
            <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2 ">
                {/* Estadística 1: Contribuyentes con Mayor Cumplimiento */}
                <BetterCompliance data={highCompliance} />

                {/* Estadística 2: Contribuyentes con Cumplimiento Medio */}
                <MediumCompliance data={mediumCompliance} />
            </div>

            {/* Fila inferior - 2 estadísticas */}
            <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Estadística 3: Contribuyentes con Cumplimiento Bajo */}
                <LowCompliance data={lowCompliance} />

                {/* Estadística 4: Comparación Recaudación Real vs Esperada */}
                <Goal year={year} />
            </div>
        </div>
    )
}
