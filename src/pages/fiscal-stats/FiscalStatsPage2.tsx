"use client"
import HighCompliance from "@/components/fiscal-stats/page2/HighCompliance"
import LowCompliance from "@/components/fiscal-stats/page2/LowCompliance"
import MediumCompliance from "@/components/fiscal-stats/page2/MediumCompliance"
import { FiscalInfo } from "@/types/reports"
import { Download, TrendingUp, TrendingDown, Users, BarChart3, User } from "lucide-react"


// Datos simulados para la página 2
// const altoCumplimiento = [
//     { name: "Empresa ABC C.A.", rif: "J-12345678-9", cumplimiento: 98.5, recaudado: 730000 },
//     { name: "Corporación XYZ S.A.", rif: "J-87654321-0", cumplimiento: 97.2, recaudado: 615000 },
//     { name: "Industrias DEF C.A.", rif: "J-11223344-5", cumplimiento: 96.8, recaudado: 525000 },
//     { name: "Tecnología MNO S.A.", rif: "J-44556677-8", cumplimiento: 95.2, recaudado: 310000 },
//     { name: "Construcción PQR C.A.", rif: "J-33445566-2", cumplimiento: 94.8, recaudado: 290000 },
// ]

// const medioCumplimiento = [
//     { name: "Comercial GHI S.A.", rif: "J-55667788-1", cumplimiento: 78.5, recaudado: 475000 },
//     { name: "Servicios JKL C.A.", rif: "J-99887766-3", cumplimiento: 76.2, recaudado: 400000 },
//     { name: "Alimentos STU S.A.", rif: "J-22334455-6", cumplimiento: 74.8, recaudado: 275000 },
//     { name: "Textiles VWX C.A.", rif: "J-66778899-4", cumplimiento: 72.1, recaudado: 220000 },
//     { name: "Farmacia YZ S.A.", rif: "J-77889900-7", cumplimiento: 70.5, recaudado: 180000 },
// ]

// const bajoCumplimiento = [
//     { name: "Empresa Baja A C.A.", rif: "J-11111111-1", cumplimiento: 45.2, recaudado: 150000 },
//     { name: "Comercial Baja B S.A.", rif: "J-22222222-2", cumplimiento: 42.8, recaudado: 120000 },
//     { name: "Servicios Baja C C.A.", rif: "J-33333333-3", cumplimiento: 40.5, recaudado: 95000 },
//     { name: "Industria Baja D S.A.", rif: "J-44444444-4", cumplimiento: 38.1, recaudado: 80000 },
//     { name: "Construcción Baja E C.A.", rif: "J-55555555-5", cumplimiento: 35.7, recaudado: 65000 },
// ]

const analisisRecaudacion = {
    totalIVA: 2450000,
    totalISLR: 1580000,
    totalMultas: 285000,
    totalGeneral: 4315000,
    promedioIVA: 306250,
    promedioISLR: 197500,
    promedioMultas: 35625,
    taxpayersConMultas: 5,
    mayorRecaudador: "Empresa ABC C.A.",
    menorRecaudador: "Construcción Baja E C.A.",
}

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
        <div className="flex flex-col w-full h-full gap-4 p-4 overflow-hidden">
            {/* Fila superior - 2 estadísticas */}

            <div className="p-4 mb-2 border bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 rounded-xl">
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
                            <div className="text-xs text-gray-400">Total taxpayers</div>
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
                <div className="bg-[#2a2a29] border-[#3a3a39] text-white rounded-xl">
                    <div className="flex flex-row items-center justify-between pb-3">
                        <div className="flex items-center gap-2 text-base font-semibold lg:pl-4 lg:pt-4">
                            <BarChart3 className="w-4 h-4 text-purple-500" />
                            Análisis de Recaudación
                        </div>
                        <div className="lg:pr-4 lg:pt-4">
                            <button
                                onClick={() => downloadPDF("eficiencia-fiscal-table", "eficiencia-fiscal.pdf")}
                                className="px-2 text-white bg-blue-600 border-blue-600 hover:bg-blue-700 h-7"
                            >
                                <Download className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                    <div className="pt-0">
                        <div
                            id="eficiencia-fiscal-table"
                            className="h-[280px] flex flex-col justify-center space-y-2 overflow-hidden p-4"
                        >
                            {/* Total General */}
                            <div className="p-3 border rounded-lg bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/50">
                                <div className="text-center">
                                    <div className="mb-1 text-xl font-bold text-purple-400">
                                        {formatCurrency(analisisRecaudacion.totalGeneral)}
                                    </div>
                                    <div className="text-xs text-purple-300">Total Recaudado</div>
                                </div>
                            </div>

                            {/* Desglose por Tipo */}
                            <div className="grid grid-cols-3 gap-2 ">
                                <div className="bg-[#1a1a19] border border-blue-600/30 rounded-md p-2 text-center">
                                    <div className="text-sm font-bold text-blue-400">{formatCurrency(analisisRecaudacion.totalIVA)}</div>
                                    <div className="text-xs text-blue-300">Total IVA</div>
                                </div>
                                <div className="bg-[#1a1a19] border border-purple-600/30 rounded-md p-2 text-center">
                                    <div className="text-sm font-bold text-purple-400">
                                        {formatCurrency(analisisRecaudacion.totalISLR)}
                                    </div>
                                    <div className="text-xs text-purple-300">Total ISLR</div>
                                </div>
                                <div className="bg-[#1a1a19] border border-orange-600/30 rounded-md p-2 text-center">
                                    <div className="text-sm font-bold text-orange-400">
                                        {formatCurrency(analisisRecaudacion.totalMultas)}
                                    </div>
                                    <div className="text-xs text-orange-300">Total Multas</div>
                                </div>
                            </div>

                            {/* Promedios */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-[#1a1a19] border border-blue-600/30 rounded-md p-2 text-center">
                                    <div className="text-xs font-bold text-blue-400">
                                        {formatCurrency(analisisRecaudacion.promedioIVA)}
                                    </div>
                                    <div className="text-xs text-blue-300">Prom. IVA</div>
                                </div>
                                <div className="bg-[#1a1a19] border border-purple-600/30 rounded-md p-2 text-center">
                                    <div className="text-xs font-bold text-purple-400">
                                        {formatCurrency(analisisRecaudacion.promedioISLR)}
                                    </div>
                                    <div className="text-xs text-purple-300">Prom. ISLR</div>
                                </div>
                                <div className="bg-[#1a1a19] border border-orange-600/30 rounded-md p-2 text-center">
                                    <div className="text-xs font-bold text-orange-400">
                                        {formatCurrency(analisisRecaudacion.promedioMultas)}
                                    </div>
                                    <div className="text-xs text-orange-300">Prom. Multas</div>
                                </div>
                            </div>

                            {/* Información Adicional */}
                            <div className="bg-[#1a1a19] rounded-md p-2 border border-gray-600/30">
                                <div className="grid grid-cols-2 gap-3 text-xs text-center">
                                    <div>
                                        <div className="text-xs font-medium text-red-400">taxpayers con Multas</div>
                                        <div className="text-lg font-bold text-white">{analisisRecaudacion.taxpayersConMultas}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-green-400">Mayor Recaudador</div>
                                        <div className="text-xs font-bold text-white truncate">{analisisRecaudacion.mayorRecaudador}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
