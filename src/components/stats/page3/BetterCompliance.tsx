import { High } from '@/types/stats'
import { Download, Users } from 'lucide-react'
import React from 'react'


interface BetterComplianceProps {
    data: High[]
}

function BetterCompliance({ data }: BetterComplianceProps) {





    const downloadPDF = (tableId: string, fileName: string) => {
        const element = document.getElementById(tableId)
        if (element) {
            // Crear una nueva ventana para imprimir solo la tabla específica
            const printWindow = window.open("", "_blank")
            if (printWindow) {
                const tableContent = element.innerHTML
                printWindow.document.write(`
                    <html>
                    <head>
                    <title>${fileName}</title>
                    <style>
                    body { font-family: Arial, sans-serif; margin: 20px; background: white; color: black; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .header { margin-bottom: 20px; font-size: 18px; font-weight: bold; }
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


    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-VE", {
            style: "currency",
            currency: "VES",
            minimumFractionDigits: 0,
        }).format(amount)
    }



    return (
        <>
            <div className="bg-[#2a2a29] border-[#3a3a39] text-white rounded-xl">
                <div className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-2 text-base font-semibold lg:pl-4 lg:pt-4">
                        <Users className="w-4 h-4 text-green-500" />
                        Contribuyentes - Mayor Cumplimiento
                    </div>
                    <div className='lg:pr-4 lg:pt-4'>
                        <button
                            onClick={() => downloadPDF("alto-cumplimiento-table", "contribuyentes-alto-cumplimiento.pdf")}
                            className="flex items-center justify-center px-2 text-white bg-blue-600 border-blue-600 hover:bg-blue-700 h-7"
                        >
                            <Download className="w-3 h-3" />
                        </button>
                    </div>
                </div>
                <div className="pt-0">
                    <div id="alto-cumplimiento-table" className="h-[280px] overflow-y-auto custom-scroll p-4">
                        <div className="space-y-2">
                            {data.map((contribuyente, index) => (
                                <div
                                    key={index}
                                    className={`border rounded-lg p-3 ${index < 3 ? "border-green-500 bg-green-900/20" : "border-[#3a3a39] bg-[#1a1a19]"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${index < 3 ? "bg-green-500 text-black" : "bg-blue-600 text-white"
                                                    }`}
                                            >
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">{contribuyente.name}</div>
                                                <div className="text-xs text-gray-400">{contribuyente.rif}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-green-400">{contribuyente.compliance}%</div>
                                            <div className="text-xs text-gray-400">Cumplimiento</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2 text-xs">
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">IVA</div>
                                            <div className="font-bold text-[10px]">{formatCurrency(Number(contribuyente.totalIVA))}</div>
                                        </div>
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">ISLR</div>
                                            <div className="font-bold text-[10px]">{formatCurrency(Number(contribuyente.totalISLR))}</div>
                                        </div>
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">Multas</div>
                                            <div className="font-bold text-[10px]">{formatCurrency(Number(contribuyente.totalFines))}</div>
                                        </div>
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">Total</div>
                                            <div className="font-bold text-green-400 text-[10px]">
                                                {formatCurrency(Number(contribuyente.totalCollected))}
                                            </div>
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

export default BetterCompliance