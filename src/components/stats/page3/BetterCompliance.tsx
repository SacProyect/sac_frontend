import { usePresentation } from '@/components/context/PresentationContext';
import { exportComplianceExcel } from '@/components/utils/stats/exportComplianceExcel';
import { formatCurrency } from '@/components/utils/formatCurrency';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { High } from '@/types/stats'
import { Download, Users } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'


interface BetterComplianceProps {
    data: High[]
}

function BetterCompliance({ data }: BetterComplianceProps) {
    const { currentPage } = usePresentation();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollReady, setScrollReady] = useState(false);


    useEffect(() => {
        if (data.length > 0) {
            setScrollReady(true);
        }
    }, [data.length]);



    const downloadPDF = (tableId: string, fileName: string) => {
        const element = document.getElementById(tableId)
        if (element) {
            // Crear una nueva ventana para imprimir solo la tabla específica
            const printWindow = window.open("", "_blank")
            if (printWindow) {
                const tableContent = element.innerHTML
                const tableRows = data.map((contribuyente, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${contribuyente.name}</td>
                        <td>${contribuyente.rif}</td>
                        <td>${contribuyente.compliance}%</td>
                        <td>${formatCurrency(contribuyente.totalIVA)}</td>
                        <td>${formatCurrency(contribuyente.totalISLR)}</td>
                        <td>${formatCurrency(contribuyente.totalFines)}</td>
                        <td>${formatCurrency(contribuyente.totalCollected)}</td>
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
                    </body>
                    </html>
                    `);
                printWindow.document.close()
                printWindow.print()
            }
        }
    }
    const shouldScroll = scrollReady && currentPage === 3;
    useAutoScroll(scrollRef, "alto-cumplimiento-table", shouldScroll);


    return (
        <>
            <div className="bg-[#2a2a29] border-[#3a3a39] text-white rounded-xl lg:h-[40vh] h-[65vh]">
                <div className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-2 pt-4 pl-4 text-base font-semibold">
                        <Users className="w-4 h-4 text-green-500" />
                        Cumplimiento Alto ({data.length})
                    </div>
                    <div className='flex pt-4 pr-4 space-x-2'>
                        <button
                            onClick={() => downloadPDF("alto-cumplimiento-table", "contribuyentes-alto-cumplimiento.pdf")}
                            className="flex items-center justify-center px-2 text-white bg-blue-600 border-blue-600 hover:bg-blue-700 h-7"
                        >
                            <Download className="w-3 h-3" />
                        </button>
                        {/* Excel */}
                        <button
                            onClick={() =>
                                exportComplianceExcel(data, "contribuyentes-alto-cumplimiento")
                            }
                            className="flex items-center justify-center px-2 text-white bg-green-600 border-green-600 hover:bg-green-700 h-7"
                        >
                            <Download className="w-3 h-3" />
                        </button>
                    </div>
                </div>
                <div className="pt-0">
                    <div id="alto-cumplimiento-table" className="lg:h-[30vh] h-[53vh] overflow-y-auto custom-scroll p-4" ref={scrollRef}>
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

                                    <div className="grid grid-cols-2 gap-2 text-xs lg:grid-cols-4">
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">IVA</div>
                                            <div className="font-bold text-[10px]">{formatCurrency(contribuyente.totalIVA)}</div>
                                        </div>
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">ISLR</div>
                                            <div className="font-bold text-[10px]">{formatCurrency(contribuyente.totalISLR)}</div>
                                        </div>
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">Multas</div>
                                            <div className="font-bold text-[10px]">{formatCurrency(contribuyente.totalFines)}</div>
                                        </div>
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">Total</div>
                                            <div className="font-bold text-green-400 text-[10px]">
                                                {formatCurrency(contribuyente.totalCollected)}
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