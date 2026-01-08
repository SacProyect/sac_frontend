import { getFiscalMonthlyCollect } from '@/components/utils/api/reportFunctions';
import { useAuth } from '@/hooks/useAuth';
import { FiscalInfo, FiscalMonthlyCollect } from '@/types/reports'
import { DollarSign, Download } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { date } from 'zod';


interface MonthlyCollectProps {
    fiscalInfo: FiscalInfo;
    year: number;
}

function MonthlyCollect({ fiscalInfo, year }: MonthlyCollectProps) {
    const [monthlyStats, setMonthlyStats] = useState<FiscalMonthlyCollect[]>();
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        navigate('/login')
        return;
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getFiscalMonthlyCollect(fiscalInfo.fiscalId, year);

                const months = [
                    "enero", "febrero", "marzo", "abril", "mayo", "junio",
                    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
                ];

                const parsed = months.map((month) => ({
                    month,
                    iva: response[month]?.iva ?? 0,
                    islr: response[month]?.islr ?? 0,
                    fines: response[month]?.fines ?? 0,
                    total: response[month]?.total ?? 0,
                }));

                setMonthlyStats(parsed);

            } catch (e) {
                console.error("Error al obtener pagado mensual:", e);
                toast.error("No se pudo obtener el pagado mensual.", {
                    id: 'monthly-collect-error',
                    duration: 3000
                });
            }
        }
        fetchData();
    }, [year])


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
              <strong>Fiscal:</strong> ${fiscalInfo.fiscalName} | 
              <strong>ID:</strong> ${fiscalInfo.fiscalId} | 
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-VE", {
            style: "currency",
            currency: "VES",
            minimumFractionDigits: 0,
        }).format(amount)
    }



    return (
        <>
            <div className="bg-[#2a2a29] border-[#3a3a39] text-white rounded-xl lg:h-[40vh]">
                <div className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-2 pt-4 pl-4 text-base font-semibold">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        Cobro Mensual
                    </div>
                    {/* <div className="lg:pt-4 lg:pr-4">
                        <button
                            onClick={() => downloadPDF("recaudacion-mensual-table", "recaudacion-mensual.pdf")}
                            className="px-2 text-white bg-blue-600 border-blue-600 hover:bg-blue-700 h-7"
                        >
                            <Download className="w-3 h-3" />
                        </button>
                    </div> */}
                </div>
                <div className="pt-0">
                    <div id="recaudacion-mensual-table" className="h-[40vh] lg:h-[30vh] overflow-y-auto custom-scroll p-4">
                        <div className="space-y-4">
                            {monthlyStats && monthlyStats.map((month, index) => (
                                <div key={month.month} className="border border-[#3a3a39] bg-[#1a1a19] rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-semibold text-blue-400">{month.month} {year}</h3>
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-green-400">{formatCurrency(month.total)}</div>
                                            <div className="text-xs text-gray-400">Total Pagado</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                                        <div className="p-3 text-center border rounded-md bg-blue-900/30 border-blue-700/30">
                                            <div className="mb-1 text-xs text-blue-300">IVA</div>
                                            <div className="text-sm font-bold text-blue-400">{formatCurrency(month.iva)}</div>
                                        </div>
                                        <div className="p-3 text-center border rounded-md bg-purple-900/30 border-purple-700/30">
                                            <div className="mb-1 text-xs text-purple-300">ISLR</div>
                                            <div className="text-sm font-bold text-purple-400">{formatCurrency(month.islr)}</div>
                                        </div>
                                        <div className="p-3 text-center border rounded-md bg-orange-900/30 border-orange-700/30">
                                            <div className="mb-1 text-xs text-orange-300">Multas</div>
                                            <div className="text-sm font-bold text-orange-400">{formatCurrency(month.fines)}</div>
                                        </div>
                                    </div>

                                    {/* Barra de progreso visual */}
                                    <div className="mt-3">
                                        <div className="flex h-2 overflow-hidden bg-gray-700 rounded-full">
                                            <div className="bg-blue-500" style={{ width: `${(month.iva / month.total) * 100}%` }}></div>
                                            <div className="bg-purple-500" style={{ width: `${(month.islr / month.total) * 100}%` }}></div>
                                            <div
                                                className="bg-orange-500"
                                                style={{ width: `${(month.fines / month.total) * 100}%` }}
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

export default MonthlyCollect