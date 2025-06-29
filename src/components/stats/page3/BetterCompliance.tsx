import { Download, Users } from 'lucide-react'
import React from 'react'



// Datos de ejemplo
const contribuyentesAlto = [
    {
        rif: "J-12345678-9",
        nombre: "Empresa ABC C.A.",
        cumplimiento: 98.5,
        iva: 450000,
        islr: 280000,
        multas: 0,
        totalPagado: 730000,
    },
    {
        rif: "J-87654321-0",
        nombre: "Corporación XYZ S.A.",
        cumplimiento: 97.2,
        iva: 420000,
        islr: 260000,
        multas: 0,
        totalPagado: 680000,
    },
    {
        rif: "J-11223344-5",
        nombre: "Industrias DEF C.A.",
        cumplimiento: 96.8,
        iva: 380000,
        islr: 240000,
        multas: 0,
        totalPagado: 620000,
    },
    {
        rif: "J-55667788-1",
        nombre: "Comercial GHI S.A.",
        cumplimiento: 95.5,
        iva: 350000,
        islr: 220000,
        multas: 0,
        totalPagado: 570000,
    },
    {
        rif: "J-99887766-3",
        nombre: "Servicios JKL C.A.",
        cumplimiento: 94.8,
        iva: 320000,
        islr: 200000,
        multas: 0,
        totalPagado: 520000,
    },
    {
        rif: "J-44556677-8",
        nombre: "Tecnología MNO S.A.",
        cumplimiento: 94.2,
        iva: 300000,
        islr: 180000,
        multas: 0,
        totalPagado: 480000,
    },
    {
        rif: "J-33445566-2",
        nombre: "Construcción PQR C.A.",
        cumplimiento: 93.7,
        iva: 280000,
        islr: 160000,
        multas: 0,
        totalPagado: 440000,
    },
    {
        rif: "J-22334455-6",
        nombre: "Alimentos STU S.A.",
        cumplimiento: 93.1,
        iva: 260000,
        islr: 140000,
        multas: 0,
        totalPagado: 400000,
    },
    {
        rif: "J-66778899-4",
        nombre: "Textiles VWX C.A.",
        cumplimiento: 92.5,
        iva: 240000,
        islr: 120000,
        multas: 0,
        totalPagado: 360000,
    },
    {
        rif: "J-77889900-7",
        nombre: "Farmacéutica YZ S.A.",
        cumplimiento: 91.8,
        iva: 220000,
        islr: 100000,
        multas: 0,
        totalPagado: 320000,
    },
]



function BetterCompliance() {





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
                            {contribuyentesAlto.map((contribuyente, index) => (
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
                                                <div className="text-sm font-medium">{contribuyente.nombre}</div>
                                                <div className="text-xs text-gray-400">{contribuyente.rif}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-green-400">{contribuyente.cumplimiento}%</div>
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
                                            <div className="font-bold text-[10px]">{formatCurrency(contribuyente.multas)}</div>
                                        </div>
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">Total</div>
                                            <div className="font-bold text-green-400 text-[10px]">
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

export default BetterCompliance