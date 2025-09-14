import { getFiscalCollectAnalisis } from '@/components/utils/api/reportFunctions';
import { useAuth } from '@/hooks/useAuth';
import { FiscalAnalisis, FiscalInfo } from '@/types/reports';
import { BarChart3, Download } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';


interface CollectAnalisisProps {
    fiscalData: FiscalInfo
}

function CollectAnalisis({ fiscalData }: CollectAnalisisProps) {
    const [analisis, setAnalisis] = useState<FiscalAnalisis>();

    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        navigate('/login')
        return;
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getFiscalCollectAnalisis(fiscalData.fiscalId);

                setAnalisis(response);

            } catch (e) {
                console.error(e);
                toast.error("No se pudo obtener la información del fiscal.")
            }
        }
        fetchData();
    }, [])



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

    return (
        <>
            <div className="bg-[#2a2a29] border-[#3a3a39] text-white rounded-xl lg:h-[35vh]">
                <div className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-2 pt-4 pl-4 text-base font-semibold">
                        <BarChart3 className="w-4 h-4 text-purple-500" />
                        Análisis de Cobro
                    </div>
                    {/* <div className="lg:pr-4 lg:pt-4">
                        <button
                            onClick={() => downloadPDF("eficiencia-fiscal-table", "eficiencia-fiscal.pdf")}
                            className="px-2 text-white bg-blue-600 border-blue-600 hover:bg-blue-700 h-7"
                        >
                            <Download className="w-3 h-3" />
                        </button>
                    </div> */}
                </div>
                <div className="pt-0">
                    <div id="eficiencia-fiscal-table" className="h-[280px] lg:h-[25vh] flex flex-col justify-center space-y-2 overflow-hidden p-4 overflow-y-auto">
                        {/* Total General */}
                        <div className="p-3 border rounded-lg bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/50 lg:mt-24">
                            <div className="text-center ">
                                <div className="mb-1 text-xl font-bold text-purple-400">
                                    {formatCurrency(Number(analisis?.totalCollected))}
                                </div>
                                <div className="text-xs text-purple-300">Total Pagado</div>
                            </div>
                        </div>

                        {/* Desglose por Tipo */}
                        <div className="grid grid-cols-3 gap-2 ">
                            <div className="bg-[#1a1a19] border border-blue-600/30 rounded-md p-2 text-center">
                                <div className="text-sm font-bold text-blue-400">{formatCurrency(Number(analisis?.totalIva))}</div>
                                <div className="text-xs text-blue-300">Total IVA</div>
                            </div>
                            <div className="bg-[#1a1a19] border border-purple-600/30 rounded-md p-2 text-center">
                                <div className="text-sm font-bold text-purple-400">
                                    {formatCurrency(Number(analisis?.totalIslr))}
                                </div>
                                <div className="text-xs text-purple-300">Total ISLR</div>
                            </div>
                            <div className="bg-[#1a1a19] border border-orange-600/30 rounded-md p-2 text-center">
                                <div className="text-sm font-bold text-orange-400">
                                    {formatCurrency(Number(analisis?.totalFines))}
                                </div>
                                <div className="text-xs text-orange-300">Total Multas</div>
                            </div>
                        </div>

                        {/* Promedios */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-[#1a1a19] border border-blue-600/30 rounded-md p-2 text-center">
                                <div className="text-xs font-bold text-blue-400">
                                    {formatCurrency(Number(analisis?.avgIva))}
                                </div>
                                <div className="text-xs text-blue-300">Prom. IVA</div>
                            </div>
                            <div className="bg-[#1a1a19] border border-purple-600/30 rounded-md p-2 text-center">
                                <div className="text-xs font-bold text-purple-400">
                                    {formatCurrency(Number(analisis?.avgIslr))}
                                </div>
                                <div className="text-xs text-purple-300">Prom. ISLR</div>
                            </div>
                            <div className="bg-[#1a1a19] border border-orange-600/30 rounded-md p-2 text-center">
                                <div className="text-xs font-bold text-orange-400">
                                    {formatCurrency(Number(analisis?.avgFines))}
                                </div>
                                <div className="text-xs text-orange-300">Prom. Multas</div>
                            </div>
                        </div>

                        {/* Información Adicional */}
                        <div className="bg-[#1a1a19] rounded-md p-2 border border-gray-600/30">
                            <div className="grid grid-cols-2 gap-0 text-xs text-center">
                                <div className=''>
                                    <div className="text-xs font-medium text-red-400">Contribuyentes con Multas</div>
                                    <div className="text-lg font-bold text-white">{analisis?.taxpayersWithFines}</div>
                                </div>
                                <div className=''>
                                    <div className="text-xs font-medium text-green-400">Mayor Pagador</div>
                                    <p className="text-xs font-bold text-white ">{analisis?.taxpayerWithMostCollected?.name ? analisis?.taxpayerWithMostCollected?.name : "No se encontró"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </>
    )
}

export default CollectAnalisis