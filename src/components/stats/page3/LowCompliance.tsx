import { High } from '@/types/stats'
import { Download, TrendingDown } from 'lucide-react'
import React from 'react'





const contribuyentesBajo = [
    {
        rif: "J-11111111-1",
        nombre: "Empresa Baja A C.A.",
        cumplimiento: 45.2,
        iva: 80000,
        islr: 30000,
        multas: 85000,
        totalPagado: 195000,
    },
    {
        rif: "J-22222222-2",
        nombre: "Comercial Baja B S.A.",
        cumplimiento: 42.8,
        iva: 70000,
        islr: 25000,
        multas: 90000,
        totalPagado: 185000,
    },
    {
        rif: "J-33333333-3",
        nombre: "Servicios Baja C C.A.",
        cumplimiento: 40.5,
        iva: 60000,
        islr: 20000,
        multas: 95000,
        totalPagado: 175000,
    },
    {
        rif: "J-44444444-4",
        nombre: "Industria Baja D S.A.",
        cumplimiento: 38.1,
        iva: 50000,
        islr: 15000,
        multas: 100000,
        totalPagado: 165000,
    },
    {
        rif: "J-55555555-5",
        nombre: "Construcción Baja E C.A.",
        cumplimiento: 35.7,
        iva: 40000,
        islr: 10000,
        multas: 105000,
        totalPagado: 155000,
    },
    {
        rif: "J-66666666-6",
        nombre: "Tecnología Baja F S.A.",
        cumplimiento: 33.4,
        iva: 35000,
        islr: 8000,
        multas: 110000,
        totalPagado: 153000,
    },
    {
        rif: "J-77777777-7",
        nombre: "Alimentos Baja G C.A.",
        cumplimiento: 31.0,
        iva: 30000,
        islr: 6000,
        multas: 115000,
        totalPagado: 151000,
    },
    {
        rif: "J-88888888-8",
        nombre: "Textiles Baja H S.A.",
        cumplimiento: 28.6,
        iva: 25000,
        islr: 4000,
        multas: 120000,
        totalPagado: 149000,
    },
    {
        rif: "J-99999999-9",
        nombre: "Farmacia Baja I C.A.",
        cumplimiento: 26.3,
        iva: 20000,
        islr: 2000,
        multas: 125000,
        totalPagado: 147000,
    },
    {
        rif: "J-00000000-0",
        nombre: "Transporte Baja J S.A.",
        cumplimiento: 23.9,
        iva: 15000,
        islr: 1000,
        multas: 130000,
        totalPagado: 146000,
    },
]



interface LowComplianceProps {
    data: High[]
}


function LowCompliance({ data }: LowComplianceProps) {




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
                const tableRows = data.map((contribuyente, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${contribuyente.name}</td>
                        <td>${contribuyente.rif}</td>
                        <td>${contribuyente.compliance}%</td>
                        <td>${formatCurrency(Number(contribuyente.totalIVA))}</td>
                        <td>${formatCurrency(Number(contribuyente.totalISLR))}</td>
                        <td>${formatCurrency(Number(contribuyente.totalFines))}</td>
                        <td>${formatCurrency(Number(contribuyente.totalCollected))}</td>
                    </tr>
                    `).join('');

                printWindow.document.write(`
                    <html>
                    <head>
                        <title>${fileName}</title>
                        <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            margin: 40px;
                            background: #fff;
                            color: #111;
                        }
                        .header {
                            margin-bottom: 30px;
                            font-size: 22px;
                            font-weight: 700;
                            text-align: center;
                            text-transform: uppercase;
                            color: #2b6cb0;
                        }
                        .table-wrapper {
                            padding: 0 20px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            font-size: 14px;
                        }
                        th, td {
                            padding: 10px;
                            border: 1px solid #ccc;
                            text-align: center;
                        }
                        th {
                            background-color: #f5f5f5;
                            color: #333;
                            font-weight: 600;
                        }
                        tr:nth-child(even) {
                            background-color: #fafafa;
                        }
                        </style>
                    </head>
                    <body>
                        <div class="header">${fileName.replace(".pdf", "").replace(/-/g, " ").toUpperCase()}</div>
                        <div class="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Nombre</th>
                                        <th>RIF</th>
                                        <th>% Cumplimiento</th>
                                        <th>IVA</th>
                                        <th>ISLR</th>
                                        <th>Multas</th>
                                        <th>Total Pagado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tableRows}
                                </tbody>
                            </table>
                        </div>
                    </body>
                    </html>
                `);
                printWindow.document.close()
                printWindow.print()
            }
        }
    }


    return (

        <>
            <div className="bg-[#2a2a29] border-[#3a3a39] text-white rounded-xl lg:h-[50vh]">
                <div className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-2 text-base font-semibold pl-4 pt-4">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        Contribuyentes - Cumplimiento Bajo
                    </div>
                    <div className=' pr-4 pt-4'>
                        <button
                            onClick={() => downloadPDF("bajo-cumplimiento-table", "contribuyentes-bajo-cumplimiento.pdf")}
                            className="flex items-center justify-center px-2 text-center text-white bg-blue-600 border-blue-600 hover:bg-blue-700 h-7"
                        >
                            <Download className="w-3 h-3" />
                        </button>
                    </div>
                </div>
                <div className="pt-0">
                    <div id="bajo-cumplimiento-table" className="h-[380px] lg:h-[40vh] overflow-y-auto custom-scroll p-4">
                        <div className="space-y-2">
                            {data.map((contribuyente, index) => (
                                <div
                                    key={index}
                                    className={`border rounded-lg p-3 ${index < 3 ? "border-red-500 bg-red-900/20" : "border-[#3a3a39] bg-[#1a1a19]"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${index < 3 ? "bg-red-500 text-white" : "bg-gray-600 text-white"
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
                                            <div className="text-lg font-bold text-red-400">{contribuyente.compliance}%</div>
                                            <div className="text-xs text-gray-400">Cumplimiento</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
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
                                            <div className="font-bold text-red-400 text-[10px]">{formatCurrency(Number(contribuyente.totalFines))}</div>
                                        </div>
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">Total</div>
                                            <div className="font-bold text-red-400 text-[10px]">
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

export default LowCompliance