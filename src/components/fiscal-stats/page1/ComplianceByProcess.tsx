import { getFiscalComplianceByProcess } from '@/components/utils/api/reportFunctions'
import { useAuth } from '@/hooks/useAuth'
import { FiscalInfo, ProcessCompliance } from '@/types/reports'
import { AlertCircle, Download } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'



interface ComplianceByProcessProps {
    fiscalInfo: FiscalInfo;
    year: number;
}


function ComplianceByProcess({ fiscalInfo, year }: ComplianceByProcessProps) {


    const [compliance, setCompliance] = useState<ProcessCompliance[]>([]);
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        navigate('/login')
        return;
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getFiscalComplianceByProcess(fiscalInfo.fiscalId, year);

                const newStats = [
                    {
                        tipo: "FP",
                        nombre: "Fiscal de Punto",
                        descripcion: "Revisión específica de tributos",
                        esperado: parseFloat(response.expectedFP),
                        recaudado: parseFloat(response.collectedFP),
                        cumplimiento:
                            parseFloat(response.expectedFP) === 0
                                ? 0
                                : (parseFloat(response.collectedFP) / parseFloat(response.expectedFP)) * 100,
                    },
                    {
                        tipo: "AF",
                        nombre: "Auditoría Fiscal",
                        descripcion: "Revisión integral de contribuyente",
                        esperado: parseFloat(response.expectedAF),
                        recaudado: parseFloat(response.collectedAF),
                        cumplimiento:
                            parseFloat(response.expectedAF) === 0
                                ? 0
                                : (parseFloat(response.collectedAF) / parseFloat(response.expectedAF)) * 100,
                    },
                    {
                        tipo: "VDF",
                        nombre: "Verificación de Deberes Formales",
                        descripcion: "Validación de información tributaria",
                        esperado: parseFloat(response.expectedVDF),
                        recaudado: parseFloat(response.collectedVDF),
                        cumplimiento:
                            parseFloat(response.expectedVDF) === 0
                                ? 0
                                : (parseFloat(response.collectedVDF) / parseFloat(response.expectedVDF)) * 100,
                    },
                ];

                setCompliance(newStats);
            } catch (e) {
                console.error("Error al obtener cumplimiento por proceso:", e);
                toast.error("No se pudo obtener el cumplimiento por proceso.", {
                    id: 'compliance-process-error',
                    duration: 3000
                });
            }
        };
        fetchData();
    }, [year]);








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
            <div className="bg-[#2a2a29] border-[#3a3a39] text-white rounded-xl lg:h-[40vh]">
                <div className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-2 pt-4 pl-4 text-base font-semibold">
                        <AlertCircle className="w-4 h-4 text-yellow-500" />% Cumplimiento por Procedimiento
                    </div>
                    {/* <div className="lg:pt-4 lg:pr-4">
                        <button
                            onClick={() => downloadPDF("cumplimiento-table", "cumplimiento-procedimientos.pdf")}
                            className="px-2 text-white bg-blue-600 border-blue-600 hover:bg-blue-700 h-7"
                        >
                            <Download className="w-3 h-3" />
                        </button>
                    </div> */}
                </div>
                <div className="pt-0">
                    <div id="cumplimiento-table" className="h-[280px] lg:h-[30vh] overflow-y-auto custom-scroll p-4 ">
                        <div className="space-y-3 lg:pb-14">
                            {compliance && compliance.map((proc, index) => (
                                <div
                                    key={proc.tipo}
                                    className={`border rounded-lg p-3 ${proc.cumplimiento >= 90
                                        ? "border-green-500 bg-green-900/20"
                                        : proc.cumplimiento >= 70
                                            ? "border-yellow-500 bg-yellow-900/20"
                                            : "border-red-500 bg-red-900/20"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${proc.cumplimiento >= 90
                                                    ? "bg-green-500 text-black"
                                                    : proc.cumplimiento >= 70
                                                        ? "bg-yellow-500 text-black"
                                                        : "bg-red-500 text-white"
                                                    }`}
                                            >
                                                {proc.tipo}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">{proc.nombre}</div>
                                                <div className="text-xs text-gray-400">{proc.descripcion}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div
                                                className={`text-xl font-bold ${proc.cumplimiento >= 90
                                                    ? "text-green-400"
                                                    : proc.cumplimiento >= 70
                                                        ? "text-yellow-400"
                                                        : "text-red-400"
                                                    }`}
                                            >
                                                {proc.cumplimiento.toFixed(1)}%
                                            </div>
                                            <div className="text-xs text-gray-400">Cumplimiento</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">Esperado</div>
                                            <div className="font-bold text-blue-400">{formatCurrency(proc.esperado)}</div>
                                        </div>
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">Pagado</div>
                                            <div
                                                className={`font-bold ${proc.cumplimiento >= 90
                                                    ? "text-green-400"
                                                    : proc.cumplimiento >= 70
                                                        ? "text-yellow-400"
                                                        : "text-red-400"
                                                    }`}
                                            >
                                                {formatCurrency(proc.recaudado)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Barra de progreso */}
                                    <div className="w-full h-2 bg-gray-700 rounded-full">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${proc.cumplimiento >= 90
                                                ? "bg-green-500"
                                                : proc.cumplimiento >= 70
                                                    ? "bg-yellow-500"
                                                    : "bg-red-500"
                                                }`}
                                            style={{ width: `${Math.min(proc.cumplimiento, 100)}%` }}
                                        ></div>
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

export default ComplianceByProcess