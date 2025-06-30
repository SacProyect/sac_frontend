import { getFiscalTaxpayerCompliance } from '@/components/utils/api/reportFunctions';
import { useAuth } from '@/hooks/useAuth';
import { ComplianceInterface } from '@/types/reports';
import { Download, Users } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

function MediumCompliance() {
    const [compliance, setCompliance] = useState<ComplianceInterface[]>();
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        navigate('/login')
        return;
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getFiscalTaxpayerCompliance(user.id);

                setCompliance(response.medium);

            } catch (e) {
                console.error(e);
                toast.error("No se pudo obtener la información del fiscal.")
            }
        }
        fetchData();
    }, [])

    console.log(compliance);


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
                        <Users className="w-4 h-4 text-yellow-500" />
                        Contribuyentes con Cumplimiento Medio (34-66%)
                    </div>
                    <div className="pr-4 pt-4">
                        <button
                            onClick={() => downloadPDF("medio-cumplimiento-fiscal-table", "medio-cumplimiento-fiscal.pdf")}
                            className="px-2 text-white bg-blue-600 border-blue-600 hover:bg-blue-700 h-7"
                        >
                            <Download className="w-3 h-3" />
                        </button>
                    </div>
                </div>
                <div className="pt-0">
                    <div id="medio-cumplimiento-fiscal-table" className="h-[280px] overflow-y-auto custom-scroll p-4">
                        <div className="space-y-2">
                            {compliance && compliance.map((taxpayer, index) => (
                                <div key={index} className="border border-[#3a3a39] bg-[#1a1a19] rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center justify-center w-6 h-6 text-xs font-bold text-black bg-yellow-600 rounded-full">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">{taxpayer.name}</div>
                                                <div className="text-xs text-gray-400">{taxpayer.rif}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-yellow-400">{taxpayer.complianceRate}%</div>
                                            <div className="text-xs text-gray-400">Cumplimiento</div>
                                        </div>
                                    </div>
                                    <div className="bg-[#2a2a29] rounded-md p-2">
                                        <div className="mb-1 text-xs text-gray-400">Total Recaudado</div>
                                        <div className="font-bold text-yellow-400">{formatCurrency(taxpayer.totalCollected)}</div>
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