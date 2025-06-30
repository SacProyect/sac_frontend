import ComplianceByProcess from "@/components/fiscal-stats/page1/ComplianceByProcess"
import MonthlyCollect from "@/components/fiscal-stats/page1/MonthlyCollect"
import MonthlyPerformance from "@/components/fiscal-stats/page1/MonthlyPerformance"
import TaxpayerList from "@/components/fiscal-stats/page1/TaxpayerList"
import { FiscalInfo } from "@/types/reports"
import { Download, User, DollarSign, FileText, Calendar, Building, MapPin, AlertCircle, Badge } from "lucide-react"



interface FiscalStatsPage1Props {
  fiscalData: FiscalInfo
}


export default function FiscalStatsPage1({ fiscalData }: FiscalStatsPage1Props) {

  return (
    <div className="flex flex-col w-full  gap-4 p-4 overflow-hidden h-full lg:h-[90.2vh]">
      {/* Header del Fiscal */}
      <div className="p-4 mb-2 border bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 rounded-xl">
        <div className="flex flex-col lg:flex-row items-center justify-center text-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{fiscalData.fiscalName}</h1>
              <p className="text-blue-300">ID: {fiscalData.fiscalId}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">{fiscalData.totalTaxpayers}</div>
              <div className="text-xs text-gray-400">Contribuyentes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">{fiscalData.totalProcess}</div>
              <div className="text-xs text-gray-400">Procesos Activos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{fiscalData.totalCompleted}</div>
              <div className="text-xs text-gray-400">Completados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Fila superior - 2 estadísticas */}
      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Estadística 1: Lista de Contribuyentes */}
        <TaxpayerList fiscalInfo={fiscalData} />

        {/* Estadística 2: Recaudación Mensual */}
        <MonthlyCollect fiscalInfo={fiscalData} />
      </div>

      {/* Fila inferior - 2 estadísticas */}
      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Estadística 3: Evolución Mensual del Rendimiento */}
        <MonthlyPerformance fiscalInfo={fiscalData} />


        {/* Estadística 4: Cumplimiento por Tipo de Procedimiento */}
        <ComplianceByProcess fiscalInfo={fiscalData} />

      </div>
    </div>
  )
}
