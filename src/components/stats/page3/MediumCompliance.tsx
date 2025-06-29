import { AlertTriangle, Download } from 'lucide-react'
import React from 'react'





const contribuyentesMedio = [
    {
        rif: "J-12121212-1",
        nombre: "Empresa Media A C.A.",
        cumplimiento: 78.5,
        iva: 180000,
        islr: 90000,
        multas: 15000,
        totalPagado: 285000,
    },
    {
        rif: "J-23232323-2",
        nombre: "Comercial Media B S.A.",
        cumplimiento: 76.8,
        iva: 160000,
        islr: 80000,
        multas: 18000,
        totalPagado: 258000,
    },
    {
        rif: "J-34343434-3",
        nombre: "Servicios Media C C.A.",
        cumplimiento: 75.2,
        iva: 140000,
        islr: 70000,
        multas: 22000,
        totalPagado: 232000,
    },
    {
        rif: "J-45454545-4",
        nombre: "Industria Media D S.A.",
        cumplimiento: 73.9,
        iva: 120000,
        islr: 60000,
        multas: 25000,
        totalPagado: 205000,
    },
    {
        rif: "J-56565656-5",
        nombre: "Construcción Media E C.A.",
        cumplimiento: 72.1,
        iva: 100000,
        islr: 50000,
        multas: 28000,
        totalPagado: 178000,
    },
    {
        rif: "J-67676767-6",
        nombre: "Tecnología Media F S.A.",
        cumplimiento: 70.5,
        iva: 90000,
        islr: 45000,
        multas: 30000,
        totalPagado: 165000,
    },
    {
        rif: "J-78787878-7",
        nombre: "Alimentos Media G C.A.",
        cumplimiento: 69.2,
        iva: 80000,
        islr: 40000,
        multas: 32000,
        totalPagado: 152000,
    },
    {
        rif: "J-89898989-8",
        nombre: "Textiles Media H S.A.",
        cumplimiento: 67.8,
        iva: 70000,
        islr: 35000,
        multas: 35000,
        totalPagado: 140000,
    },
    {
        rif: "J-90909090-9",
        nombre: "Farmacia Media I C.A.",
        cumplimiento: 66.4,
        iva: 60000,
        islr: 30000,
        multas: 38000,
        totalPagado: 128000,
    },
    {
        rif: "J-01010101-0",
        nombre: "Transporte Media J S.A.",
        cumplimiento: 65.1,
        iva: 50000,
        islr: 25000,
        multas: 40000,
        totalPagado: 115000,
    },
]



function MediumCompliance() {


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








    return (
        <>
            <div className="bg-[#2a2a29] border-[#3a3a39] text-white rounded-xl">
                <div className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-2 text-base font-semibold lg:pl-4 lg:pt-4">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        Contribuyentes - Cumplimiento Medio
                    </div>
                    <div className='lg:pr-4 lg:pt-4'>
                        <button
                            onClick={() => downloadPDF("medio-cumplimiento-table", "contribuyentes-medio-cumplimiento.pdf")}
                            className="flex items-center justify-center px-2 text-white bg-blue-600 border-blue-600 hover:bg-blue-700 h-7"
                        >
                            <Download className="w-3 h-3" />
                        </button>
                    </div>
                </div>
                <div className="pt-0">
                    <div id="medio-cumplimiento-table" className="h-[300px] overflow-y-auto custom-scroll p-4">
                        <div className="space-y-2">
                            {contribuyentesMedio.map((contribuyente, index) => (
                                <div key={index} className="border border-[#3a3a39] bg-[#1a1a19] rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center justify-center w-6 h-6 text-xs font-bold text-black bg-yellow-600 rounded-full">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">{contribuyente.nombre}</div>
                                                <div className="text-xs text-gray-400">{contribuyente.rif}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-yellow-400">{contribuyente.cumplimiento}%</div>
                                            <div className="text-xs text-gray-400">Cumplimiento</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2 text-xs">
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">IVA</div>
                                            <div className="font-bold text-[10px]">{formatCurrency(contribuyente.iva)}</div>
                                        </div>
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">ISLR</div>
                                            <div className="font-bold text-[10px]">{formatCurrency(contribuyente.islr)}</div>
                                        </div>
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">Multas</div>
                                            <div className="font-bold text-orange-400 text-[10px]">
                                                {formatCurrency(contribuyente.multas)}
                                            </div>
                                        </div>
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">Total</div>
                                            <div className="font-bold text-yellow-400 text-[10px]">
                                                {formatCurrency(contribuyente.totalPagado)}
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

export default MediumCompliance