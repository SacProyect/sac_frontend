"use client"
import CollectAnalisis from "@/components/fiscal-stats/page2/CollectAnalisis"
import HighCompliance from "@/components/fiscal-stats/page2/HighCompliance"
import LowCompliance from "@/components/fiscal-stats/page2/LowCompliance"
import MediumCompliance from "@/components/fiscal-stats/page2/MediumCompliance"
import { FiscalInfo } from "@/types/reports"
import { Download, TrendingUp, TrendingDown, Users, BarChart3, User } from "lucide-react"


const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-VE", {
        style: "currency",
        currency: "VES",
        minimumFractionDigits: 0,
    }).format(amount)
}

const downloadPDF = (tableId: string, fileName: string) => {
    const element = document.getElementById(tableId)
    if (element) {
        const printWindow = window.open("", "_blank")
        if (printWindow) {
            const tableContent = element.innerHTML
            printWindow.document.write(`
                <html>
                <head>
                    <title>${fileName}</title>
                    <style>
                    @page { size: A4; margin: 0.5in; }
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 0; 
                        background: white; 
                        color: black; 
                        font-size: 12px;
                    }
                    .header { 
                        margin-bottom: 20px; 
                        font-size: 18px; 
                        font-weight: bold; 
                        text-align: center;
                        border-bottom: 2px solid #333;
                        padding-bottom: 10px;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-top: 10px;
                    }
                    th, td { 
                        border: 1px solid #ddd; 
                        padding: 8px; 
                        text-align: left; 
                        font-size: 11px;
                    }
                    th { 
                        background-color: #f2f2f2; 
                        font-weight: bold;
                    }
                    .space-y-2 > * + * { margin-top: 0.5rem; }
                    .p-3 { padding: 0.75rem; }
                    .mb-2 { margin-bottom: 0.5rem; }
                    .font-medium { font-weight: 500; }
                    .font-bold { font-weight: 700; }
                    .text-sm { font-size: 0.875rem; }
                    .text-xs { font-size: 0.75rem; }
                    </style>
                </head>
                <body>
                    <div class="header">${fileName.replace(".pdf", "").replace(/-/g, " ").toUpperCase()}</div>
                    ${tableContent}
                </body>
                </html>
            `)
            printWindow.document.close()
            printWindow.print()
        }
    }
}

interface FiscalStatsPage2Props {
    fiscalData: FiscalInfo
}

export default function FiscalStatsPage2({ fiscalData }: FiscalStatsPage2Props) {
    return (
        <div className="lg:flex flex-col w-full gap-4 p-4 overflow-hidden lg:h-[92vh]">
            {/* Fila superior - 2 estadísticas */}

            <div className="hidden p-4 mb-2 border bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 rounded-xl lg:block">
                <div className="flex items-center justify-between">
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
            <div className="flex flex-col gap-4">
                <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
                    {/* Estadística 1: Alto Cumplimiento */}
                    <HighCompliance />

                    {/* Estadística 2: Medio Cumplimiento */}
                    <MediumCompliance />
                </div>

                {/* Fila inferior - 2 estadísticas */}
                <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
                    {/* Estadística 3: Bajo Cumplimiento */}
                    <LowCompliance />

                    {/* Estadística 4: Eficiencia del Fiscal */}
                    <CollectAnalisis />
                </div>
            </div>
        </div>
    )
}
