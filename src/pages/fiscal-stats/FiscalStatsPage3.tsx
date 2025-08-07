"use client"
import { getFiscalTaxpayersForStats } from "@/components/utils/api/taxpayerFunctions"
import { FiscalInfo } from "@/types/reports"
import { FiscalTaxpayer, FiscalTaxpayerStatsResponse } from "@/types/taxpayer"
import { Download, Clock, CheckCircle, AlertTriangle, XCircle, Badge, User } from "lucide-react"
import { useEffect, useState } from "react"


interface FiscalStatsPage3Props {
    fiscalData: FiscalInfo
    fiscalId: string | undefined;
}

export default function FiscalStatsPage3({ fiscalData }: FiscalStatsPage3Props) {

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


    const [vdfOnTime, setVdfOnTime] = useState<FiscalTaxpayer[]>([])
    const [vdfLate, setVdfLate] = useState<FiscalTaxpayer[]>([])
    const [afOnTime, setAfOnTime] = useState<FiscalTaxpayer[]>([])
    const [afLate, setAfLate] = useState<FiscalTaxpayer[]>([])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getFiscalTaxpayersForStats(fiscalData.fiscalId)
                const data: FiscalTaxpayerStatsResponse = response.data
                setVdfOnTime(data.vdfOnTime)
                setVdfLate(data.vdfLate)
                setAfOnTime(data.afOnTime)
                setAfLate(data.afLate)
            } catch (error) {
                console.error("Error fetching data:", error)
            }
        }

        fetchData()
    }, [])

    const downloadPDF = (title: string, fileName: string, taxpayers: any[], showDelay = false) => {
        const printWindow = window.open("", "_blank")
        if (printWindow) {
            const tableRows = taxpayers.map((taxpayer, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${taxpayer.name}</td>
                    <td>${taxpayer.rif}</td>
                    <td>${formatCurrency(Number(taxpayer.collectedIva || 0))}</td>
                    <td>${formatCurrency(Number(taxpayer.collectedIslr || 0))}</td>
                    <td>${formatCurrency(Number(taxpayer.collectedFines || 0))}</td>
                    <td>${formatCurrency(Number(taxpayer.totalCollected || 0))}</td>
                    <td>${taxpayer.deadline} días</td>
                    ${showDelay ? `<td>${taxpayer.delayDays ?? 0} días</td>` : ""}
                    <td>${formatDate(taxpayer.date)}</td>
                </tr>
            `).join("")

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
                        <div class="header">${title.toUpperCase()}</div>
                        <div class="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Nombre</th>
                                        <th>RIF</th>
                                        <th>IVA</th>
                                        <th>ISLR</th>
                                        <th>Multas</th>
                                        <th>Total Pagado</th>
                                        <th>Plazo</th>
                                        ${showDelay ? "<th>Retraso</th>" : ""}
                                        <th>Fecha</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tableRows}
                                </tbody>
                            </table>
                        </div>
                    </body>
                </html>
            `)
            printWindow.document.close()
            printWindow.print()
        }
    }




    return (
        <div className="flex flex-col w-full h-full gap-6 p-4 overflow-hidden">
            {/* Encabezado para pantallas grandes */}
            <div className="hidden w-full p-6 border rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 lg:block">
                <div className="flex flex-col gap-6 md:flex-row md:justify-between md:items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{fiscalData.fiscalName}</h1>
                            <p className="text-sm text-blue-300">ID: {fiscalData.fiscalId}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-green-400">{fiscalData.totalTaxpayers}</div>
                            <div className="text-sm text-gray-400">Contribuyentes</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-yellow-400">{fiscalData.totalProcess}</div>
                            <div className="text-sm text-gray-400">Procesos Activos</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-400">{fiscalData.totalCompleted}</div>
                            <div className="text-sm text-gray-400">Completados</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grilla general */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {[ // Listado de secciones
                    { id: "VDF-EN-PLAZO", title: "VDF en Plazo (≤10 días)", data: vdfOnTime, icon: <CheckCircle className="w-4 h-4 text-green-500" />, badgeColor: "bg-green-600", borderColor: "border-green-500", headerColor: "text-green-400" },
                    { id: "AF-EN-PLAZO", title: "AF en Plazo (≤120 días)", data: afOnTime, icon: <CheckCircle className="w-4 h-4 text-blue-500" />, badgeColor: "bg-blue-600", borderColor: "border-blue-500", headerColor: "text-blue-400" },
                    { id: "VDF-PLAZO-VENCIDO", title: "VDF Fuera de Plazo (>10 días)", data: vdfLate, icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />, badgeColor: "bg-yellow-600", borderColor: "border-yellow-500", headerColor: "text-yellow-400", extraBadge: true },
                    { id: "AF-PLAZO-VENCIDO", title: "AF Fuera de Plazo (>120 días)", data: afLate, icon: <XCircle className="w-4 h-4 text-red-500" />, badgeColor: "bg-red-600", borderColor: "border-red-500", headerColor: "text-red-400", extraBadge: true },
                ].map(({ id, title, data, icon, badgeColor, borderColor, headerColor, extraBadge = false }) => (
                    <div key={id} className="bg-[#2a2a29] border border-[#3a3a39] rounded-2xl p-4 text-white flex flex-col max-h-[35vh] overflow-auto custom-scroll">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-sm font-semibold">{icon}{title}</div>
                            <button onClick={() => downloadPDF(id, `${id.toLowerCase()}.pdf`, data, extraBadge)} className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-blue-600 border border-blue-600 rounded hover:bg-blue-700">
                                <Download className="w-4 h-4" />
                                PDF
                            </button>
                        </div>
                        <div className="flex flex-col gap-3">
                            {data.map((c, index) => (
                                <div
                                    key={c.id}
                                    className={`rounded-xl border p-3 ${index === 0 ? `${borderColor} bg-opacity-10` : "border-[#3a3a39] bg-[#1a1a19]"}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center flex-1 min-w-0 gap-2">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${index === 0 ? `${badgeColor} text-black` : "bg-gray-600 text-white"}`}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate">{c.name}</div>
                                                <div className="text-xs text-gray-400">{c.rif}</div>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            <div className={`text-sm font-bold ${headerColor}`}>{formatCurrency(Number(c.totalCollected))}</div>
                                            <div className="text-xs text-gray-400">Total</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {/* <div className={`px-2 py-1 text-xs text-white rounded-md ${badgeColor}`}>{c.deadline} días</div> */}
                                            {extraBadge && (
                                                <div className="px-2 py-1 text-xs text-white bg-red-600 rounded-md">+{c.delayDays ?? 0} días de retraso</div>
                                            )}
                                            <Clock className="w-3 h-3 text-gray-400" />
                                        </div>
                                        <div className="text-xs text-gray-400 whitespace-nowrap">Creado el {formatDate(c.emition_date || c.date)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

}
