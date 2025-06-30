import { Download, FileText } from 'lucide-react'
import React from 'react'


// Datos simulados basados en el modelo taxpayer
const fiscalInfo = {
    name: "Carlos Mendoza",
    id: "FISC-001",
    totalTaxpayers: 45,
    activeProcesses: 12,
    completedProcesses: 33,
}


const evolucionMensual = [
    {
        mes: "Enero",
        rendimiento: 1455000,
        rendimientoAnterior: 1320000,
        cambio: 10.23,
        tendencia: "positiva",
    },
    {
        mes: "Febrero",
        rendimiento: 1595000,
        rendimientoAnterior: 1455000,
        cambio: 9.62,
        tendencia: "positiva",
    },
    {
        mes: "Marzo",
        rendimiento: 1380000,
        rendimientoAnterior: 1595000,
        cambio: -13.48,
        tendencia: "negativa",
    },
]



function MonthlyPerformance() {

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
              .fiscal-info {
                margin-bottom: 15px;
                padding: 10px;
                background: #f5f5f5;
                border-radius: 5px;
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
                font-size: 10px;
              }
              th { 
                background-color: #f2f2f2; 
                font-weight: bold;
              }
              .space-y-2 > * + * { margin-top: 0.5rem; }
              .grid { display: grid; }
              .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
              .gap-2 { gap: 0.5rem; }
              .p-3 { padding: 0.75rem; }
              .mb-2 { margin-bottom: 0.5rem; }
              .font-medium { font-weight: 500; }
              .font-bold { font-weight: 700; }
              .text-sm { font-size: 0.875rem; }
              .text-xs { font-size: 0.75rem; }
              .badge { 
                display: inline-block; 
                padding: 2px 6px; 
                border-radius: 3px; 
                font-size: 10px; 
                font-weight: bold;
              }
              .badge-blue { background: #3b82f6; color: white; }
              .badge-green { background: #10b981; color: white; }
              .badge-yellow { background: #f59e0b; color: white; }
              .badge-red { background: #ef4444; color: white; }
              .badge-gray { background: #6b7280; color: white; }
            </style>
          </head>
          <body>
            <div class="header">${fileName.replace(".pdf", "").replace(/-/g, " ").toUpperCase()}</div>
            <div class="fiscal-info">
              <strong>Fiscal:</strong> ${fiscalInfo.name} | 
              <strong>ID:</strong> ${fiscalInfo.id} | 
              <strong>Total Contribuyentes:</strong> ${fiscalInfo.totalTaxpayers}
            </div>
            ${tableContent}
          </body>
        </html>
      `)
                printWindow.document.close()
                printWindow.print()
            }
        }
    }


    return (
        <>
            <div className="bg-[#2a2a29] border-[#3a3a39] text-white rounded-xl">
                <div className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-2 text-base font-semibold lg:pl-4 lg:pt-4">
                        <FileText className="w-4 h-4 text-purple-500" />
                        Evolución Mensual del Rendimiento
                    </div>
                    <div className="lg:pt-4 lg:pr-4">
                        <button
                            onClick={() => downloadPDF("evolucion-table", "evolucion-mensual-rendimiento.pdf")}
                            className="px-2 text-white bg-blue-600 border-blue-600 hover:bg-blue-700 h-7"
                        >
                            <Download className="w-3 h-3" />
                        </button>
                    </div>
                </div>
                <div className="pt-0">
                    <div id="evolucion-table" className="h-[280px] overflow-y-auto custom-scroll lg:p-4">
                        <div className="space-y-3">
                            {evolucionMensual.map((mes, index) => (
                                <div
                                    key={mes.mes}
                                    className={`border rounded-lg p-3 ${mes.tendencia === "positiva" ? "border-green-500 bg-green-900/20" : "border-red-500 bg-red-900/20"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-6 h-6 rounded-full flex items-center justify-center ${mes.tendencia === "positiva" ? "bg-green-500" : "bg-red-500"
                                                    }`}
                                            >
                                                <span className="text-xs font-bold text-white">
                                                    {mes.tendencia === "positiva" ? "↑" : "↓"}
                                                </span>
                                            </div>
                                            <span className="text-sm font-medium">{mes.mes}</span>
                                        </div>
                                        <div className="text-right">
                                            <div
                                                className={`text-lg font-bold ${mes.tendencia === "positiva" ? "text-green-400" : "text-red-400"
                                                    }`}
                                            >
                                                {mes.cambio > 0 ? "+" : ""}
                                                {mes.cambio.toFixed(1)}%
                                            </div>
                                            <div className="text-xs text-gray-400">Cambio</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">Anterior</div>
                                            <div className="text-xs font-bold">{formatCurrency(mes.rendimientoAnterior)}</div>
                                        </div>
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">Actual</div>
                                            <div
                                                className={`font-bold text-xs ${mes.tendencia === "positiva" ? "text-green-400" : "text-red-400"
                                                    }`}
                                            >
                                                {formatCurrency(mes.rendimiento)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Barra de progreso del cambio */}
                                    <div className="mt-2">
                                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                                            <div
                                                className={`h-1.5 rounded-full transition-all duration-300 ${mes.tendencia === "positiva" ? "bg-green-500" : "bg-red-500"
                                                    }`}
                                                style={{ width: `${Math.min(Math.abs(mes.cambio) * 3, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default MonthlyPerformance