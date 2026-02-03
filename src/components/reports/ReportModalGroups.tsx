import React, { useEffect, useRef, useState } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { getGroupRecords } from '../utils/api/reportFunctions'
import GroupReportStatistics from './GroupReportStatistics'
import { GroupRecordsApiResponse, normalizeGroupRecordsApiResponse } from '@/types/groupRecords'

const ReportModalGroups = () => {
    const { user } = useAuth()
    const { groupId } = useParams()
    const [groupData, setGroupData] = useState<GroupRecordsApiResponse | null>(null)
    const reportRef = useRef<HTMLDivElement>(null)
    const [pdfMode, setPdfMode] = useState(false)
    const navigate = useNavigate()
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [reportType, setReportType] = useState<'month' | 'year'>('month')

    const monthOptions = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    const yearOptions = Array.from({ length: 10 }, (_, i) => 2024 + i)

    const handleGeneratePdf = async () => {
        if (!reportRef.current) return

        setPdfMode(true)
        await new Promise(requestAnimationFrame)

        const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })
        const pdfWidth = pdf.internal.pageSize.getWidth()

        const tables = reportRef.current.querySelectorAll<HTMLDivElement>('.pdfTable')

        for (let i = 0; i < tables.length; i++) {
            const tableEl = tables[i]
            const canvas = await html2canvas(tableEl, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#fff',
            })
            const imgData = canvas.toDataURL('image/png')
            const imgProps = pdf.getImageProperties(imgData)
            const imgWidth = pdfWidth
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width

            if (i > 0) pdf.addPage()
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
        }

        pdf.save(`Detalle-Grupo-${groupId}.pdf`)
        setPdfMode(false)
    }

    useEffect(() => {
        if (!user || !groupId) {
            navigate('/login')
            return
        }

        const input = {
            id: groupId,
            year: selectedYear,
            ...(reportType === 'month' && { month: selectedMonth })
        }

        getGroupRecords(input)
            .then((data) => setGroupData(normalizeGroupRecordsApiResponse(data)))
            .catch(() => {
                toast.error(
                    'No se pudieron obtener los datos del grupo, por favor recargue la página.'
                )
            })
    }, [user, groupId, selectedMonth, selectedYear, reportType, navigate])

    const selectedGroup = groupId ?? '';


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-2 py-4 bg-black bg-opacity-50 lg:px-0 lg:py-0">
            <div className={`w-full max-w-full ${pdfMode ? '' : 'p-4'} bg-white rounded-md overflow-y-auto max-h-[90vh] lg:w-11/12 lg:max-w-6xl`}>
                {!pdfMode && (
                    <div className="flex flex-wrap items-center justify-start gap-6 px-4 py-3 mb-6 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
                        <div className="flex flex-col">
                            <label className="mb-1 text-sm font-semibold text-gray-700">Tipo de reporte</label>
                            <select
                                className="p-2 transition-all border border-gray-300 rounded-lg shadow-sm hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value as 'month' | 'year')}
                            >
                                <option value="month">Mes específico</option>
                                <option value="year">Todo el año</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="mb-1 text-sm font-semibold text-gray-700">Año</label>
                            <select
                                className="p-2 transition-all border border-gray-300 rounded-lg shadow-sm hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            >
                                {yearOptions.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {reportType === 'month' && (
                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-semibold text-gray-700">Mes</label>
                                <select
                                    className="p-2 transition-all border border-gray-300 rounded-lg shadow-sm hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                >
                                    {monthOptions.map((month, index) => (
                                        <option key={month} value={index + 1}>
                                            {month}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                )}
                <div className="flex flex-col items-start justify-between gap-2 mt-2 mb-4 lg:flex-row lg:items-center lg:gap-0 lg:mt-0">
                    <h2 className="text-lg font-semibold lg:text-xl">
                        Detalle del Grupo con id: {selectedGroup || 'No se ha podido obtener el grupo'}
                    </h2>
                    <button
                        className="w-full px-4 py-2 text-white bg-red-500 rounded lg:w-auto"
                        onClick={() => navigate('/gen-reports')}
                    >
                        Cerrar
                    </button>
                </div>
                <div
                    ref={reportRef}
                    className={`${pdfMode ? '' : 'p-4'} bg-white border border-gray-300 rounded-md`}
                    style={{
                        width: pdfMode ? '210mm' : '100%',
                        minHeight: pdfMode ? '297mm' : undefined,
                    }}
                >
                    {pdfMode ? (
                        <>
                            <div className="pdfTable">
                                <GroupReportStatistics
                                    groupData={groupData}
                                    selectedGroup={selectedGroup}
                                    pdfMode={true}
                                    forceType="FP"
                                />
                            </div>
                            <div className="pdfTable">
                                <GroupReportStatistics
                                    groupData={groupData}
                                    selectedGroup={selectedGroup}
                                    pdfMode={true}
                                    forceType="AF"
                                />
                            </div>
                            <div className="pdfTable">
                                <GroupReportStatistics
                                    groupData={groupData}
                                    selectedGroup={selectedGroup}
                                    pdfMode={true}
                                    forceType="VDF"
                                />
                            </div>
                        </>
                    ) : (
                        <GroupReportStatistics
                            groupData={groupData}
                            selectedGroup={selectedGroup}
                            pdfMode={false}
                        />
                    )}
                </div>
                <div className="flex flex-col items-end mt-4 space-y-2 lg:flex-row lg:justify-end lg:space-y-0 lg:space-x-2">
                    <button
                        onClick={handleGeneratePdf}
                        className="w-full px-4 py-2 text-white bg-blue-500 rounded lg:w-auto"
                    >
                        Generar PDF
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ReportModalGroups
