import { getFiscalTaxpayerCompliance } from '@/components/utils/api/reportFunctions';
import { useAuth } from '@/hooks/useAuth';
import { ComplianceInterface } from '@/types/reports'
import { Download, TrendingDown } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';





function LowCompliance() {
    const [compliance, setCompliance] = useState<ComplianceInterface[]>();
    const { user } = useAuth();
    const navigate = useNavigate();



    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                navigate('/login')
                return;
            }
            try {
                const response = await getFiscalTaxpayerCompliance(user.id);

                setCompliance(response.low);

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

            <div className="bg-[#2a2a29] border-[#3a3a39] text-white rounded-xl">
                <div className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-2 text-base font-semibold lg:pl-4 lg:pt-4">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        Contribuyentes con Bajo Cumplimiento (&lt;33%)
                    </div>
                    <div className="lg:pr-4 lg:pt-4">
                        <button
                            onClick={() => downloadPDF("bajo-cumplimiento-fiscal-table", "bajo-cumplimiento-fiscal.pdf")}
                            className="px-2 text-white bg-blue-600 border-blue-600 hover:bg-blue-700 h-7"
                        >
                            <Download className="w-3 h-3" />
                        </button>
                    </div>
                </div>
                <div className="pt-0">
                    <div id="bajo-cumplimiento-fiscal-table" className="h-[280px] overflow-y-auto custom-scroll lg:p-4">
                        <div className="space-y-2">
                            {compliance && compliance.map((taxpayer, index) => (
                                <div
                                    key={index}
                                    className={`border rounded-lg p-3 ${index === 0 ? "border-red-500 bg-red-900/20" : "border-[#3a3a39] bg-[#1a1a19]"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${index === 0 ? "bg-red-500 text-white" : "bg-gray-600 text-white"
                                                    }`}
                                            >
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">{taxpayer.name}</div>
                                                <div className="text-xs text-gray-400">{taxpayer.rif}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-red-400">{taxpayer.complianceRate}%</div>
                                            <div className="text-xs text-gray-400">Cumplimiento</div>
                                        </div>
                                    </div>
                                    <div className="bg-[#2a2a29] rounded-md p-2">
                                        <div className="mb-1 text-xs text-gray-400">Total totalCollected</div>
                                        <div className="font-bold text-red-400">{formatCurrency(taxpayer.totalCollected)}</div>
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