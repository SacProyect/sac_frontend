import { getFiscalTaxpayerCompliance } from '@/components/utils/api/reportFunctions';
import { exportExcel } from '@/components/utils/exportReports';
import { useAuth } from '@/hooks/useAuth';
import { ComplianceInterface, FiscalInfo } from '@/types/reports'
import { Download, TrendingDown } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';


interface LowComplianceProps {
    fiscalData: FiscalInfo;
}

function LowCompliance({ fiscalData }: LowComplianceProps) {
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
                const response = await getFiscalTaxpayerCompliance(fiscalData.fiscalId);

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
            // Crear una nueva ventana para imprimir solo la tabla específica
            const printWindow = window.open("", fiscalData.fiscalName + "Contribuyentes bajo cumplimiento")
            if (printWindow) {
                const tableRows = compliance?.map((taxpayer, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${taxpayer.name}</td>
                        <td>${taxpayer.rif}</td>
                        <td>${taxpayer.complianceRate}%</td>
                        <td>${formatCurrency(Number(taxpayer.totalIva))}</td>
                        <td>${formatCurrency(Number(taxpayer.totalIslr))}</td>
                        <td>${formatCurrency(Number(taxpayer.totalFines))}</td>
                        <td>${formatCurrency(Number(taxpayer.totalCollected))}</td>
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
                printWindow.document.title = fiscalData.fiscalName + " Contribuyentes bajo cumplimiento";
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
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        Contribuyentes con Bajo Cumplimiento (&lt;33%)
                    </div>
                    <div className="flex pt-4 pr-4 space-x-2">
                        <button
                            onClick={() => downloadPDF("bajo-cumplimiento-fiscal-table", "bajo-cumplimiento-fiscal.pdf")}
                            className="flex items-center justify-center px-2 text-white bg-blue-600 border-blue-600 hover:bg-blue-700 h-7"
                        >
                            <Download className="w-3 h-3" />
                        </button>
                        <button
                            onClick={() =>
                                compliance &&
                                exportExcel(compliance, "bajo-cumplimiento-fiscal", fiscalData.fiscalName)
                            }
                            className="flex items-center justify-center px-2 text-white bg-green-600 hover:bg-green-700 h-7"
                        >
                            <Download className="w-3 h-3" />
                        </button>
                    </div>
                </div>
                <div className="pt-0">
                    <div id="bajo-cumplimiento-fiscal-table" className="h-[280px] lg:h-[25vh] overflow-y-auto custom-scroll p-4">
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
                                        <div className="mb-1 text-xs text-gray-400">Total Cobrado</div>
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