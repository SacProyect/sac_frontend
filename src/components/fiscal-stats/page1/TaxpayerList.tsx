import { getFiscalTaxpayers } from "@/components/utils/api/reportFunctions";
import { useAuth } from "@/hooks/useAuth";
import { FiscalInfo, TaxpayersList } from "@/types/reports";
import { Building, Calendar, Download, MapPin } from "lucide-react"
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";



interface TaxpayerListProps {
    fiscalInfo: FiscalInfo
}

function TaxpayerList({ fiscalInfo }: TaxpayerListProps) {
    const [taxpayersList, setTaxpayersList] = useState<TaxpayersList[]>();
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        navigate('/login')
        return;
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getFiscalTaxpayers(user.id);

                setTaxpayersList(response);

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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("es-VE")
    }

    const getFaseColor = (fase: string) => {
        switch (fase) {
            case "FASE_1":
                return "bg-red-600"
            case "FASE_2":
                return "bg-yellow-600"
            case "FASE_3":
                return "bg-green-600"
            default:
                return "bg-gray-600"
        }
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


    return (
        <>
            <div className="bg-[#2a2a29] border-[#3a3a39] text-white rounded-xl">
                <div className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-2 text-base font-semibold pl-4 pt-4">
                        <Building className="w-4 h-4 text-blue-500" />
                        Contribuyentes Asignados
                    </div>
                    {/* <div className="lg:pt-4 lg:pr-4">
                        <button
                            onClick={() => downloadPDF("contribuyentes-table", "contribuyentes-asignados.pdf")}
                            className="px-2 text-white bg-blue-600 border-blue-600 hover:bg-blue-700 h-7"
                        >
                            <Download className="w-3 h-3" />
                        </button>
                    </div> */}
                </div>
                <div className="pt-0">
                    <div id="contribuyentes-table" className="lg:h-[280px] h-[39vh]  overflow-y-auto custom-scroll p-4">
                        <div className="space-y-2">
                            {taxpayersList && taxpayersList.map((taxpayer, index) => (
                                <div key={taxpayer.id} className="border border-[#3a3a39] bg-[#1a1a19] rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">{taxpayer.name}</div>
                                                <div className="text-xs text-gray-400">{taxpayer.rif}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-green-400">
                                                {formatCurrency(Number(taxpayer.totalCollected))}
                                            </div>
                                            <div className="text-xs text-gray-400">Total</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mb-2">
                                        {taxpayer.process === "AF" && (
                                            <p className={`${getFaseColor(taxpayer.fase)} text-white text-xs rounded-full px-2`}>{taxpayer.fase.replace("_", " ")}</p>
                                        )}
                                        {taxpayer.culminated && <p className="px-2 text-xs text-white bg-green-600 rounded-full">CULMINADO</p>}
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 text-xs">
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">IVA</div>
                                            <div className="font-bold text-[10px]">{formatCurrency(Number(taxpayer.collectedIva))}</div>
                                        </div>
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">ISLR</div>
                                            <div className="font-bold text-[10px]">{formatCurrency(Number(taxpayer.collectedIslr))}</div>
                                        </div>
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">Multas</div>
                                            <div className="font-bold text-orange-400 text-[10px]">{formatCurrency(Number(taxpayer.collectedFines))}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                        <MapPin className="w-3 h-3" />
                                        <span>{taxpayer.address}</span>
                                        <Calendar className="w-3 h-3 ml-2" />
                                        <span>{formatDate(taxpayer.emition_date.toString())}</span>
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

export default TaxpayerList