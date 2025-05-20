import React, { useEffect, useRef, useState } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { getContributions } from '../utils/api/reportFunctions'
import { GroupData } from '../contributions/ContributionTypes'
import GroupReportStatistics from './GroupReportStatistics'

const ReportModalGroups = () => {
    const { user } = useAuth()
    const { groupId } = useParams()
    const [groupData, setGroupData] = useState<GroupData[]>([])
    const reportRef = useRef<HTMLDivElement>(null)
    const [pdfMode, setPdfMode] = useState(false)
    const navigate = useNavigate()

    const handleGeneratePdf = async () => {
        if (!reportRef.current) return

        // 1) Pasamos a modo PDF
        setPdfMode(true)
        await new Promise(requestAnimationFrame)

        // 2) Preparar PDF
        const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()

        // 3) Seleccionar cada tabla
        const tables = reportRef.current.querySelectorAll<HTMLDivElement>('.pdfTable')

        for (let i = 0; i < tables.length; i++) {
            const tableEl = tables[i]
            // Capturar solo esa tabla
            const canvas = await html2canvas(tableEl, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#fff',
            })
            const imgData = canvas.toDataURL('image/png')
            const imgProps = pdf.getImageProperties(imgData)
            const imgWidth = pdfWidth
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width

            // Si no es la primera, añadimos una página nueva
            if (i > 0) pdf.addPage()

            // Insertamos la imagen en la página actual, centrada verticalmente si cabe
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
        }

        // 4) Guardar
        pdf.save(`Detalle-Grupo-${groupId}.pdf`)

        // 5) Volver a vista normal
        setPdfMode(false)
    }

    useEffect(() => {
        if (!user) {
            navigate('/login')
            return
        }
        getContributions()
            .then(setGroupData)
            .catch(() => {
                toast.error(
                    'No se pudieron obtener los grupos, por favor recargue la página e intente de nuevo.'
                )
            })
    }, [user, navigate])

    const selectedGroup = groupId ?? ''

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-2 py-4 bg-black bg-opacity-50 lg:px-0 lg:py-0">
            <div className={`w-full max-w-full ${pdfMode ? '' : 'p-4'} bg-white rounded-md overflow-y-auto max-h-[90vh] lg:w-11/12 lg:max-w-6xl`}>

                {/* Encabezado */}
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

                {/* Contenedor del reporte */}
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

                {/* Botón PDF */}
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
