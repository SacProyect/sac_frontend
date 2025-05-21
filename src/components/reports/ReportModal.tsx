import React, { useRef, useState } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import TaxpayerDetailReport from './TaxpayerDetailReport'
import { IVAReports } from '@/types/IvaReports'
import { Event } from '@/types/event'
import { Taxpayer } from '@/types/taxpayer'
import { Navigate, useLoaderData, useNavigate, useParams } from 'react-router-dom'
import { Fines } from '@/App'
import { Payment } from '@/types/payment'
import { ISLRReports } from '@/types/ISLRReports'




const ReportModal = () => {
    const { taxpayer } = useParams();
    const { events, fines, payments, taxSummary, islrReports } = useLoaderData() as { events: Event[], fines: Fines, payments: Payment, taxSummary: IVAReports[], islrReports: ISLRReports[] }


    console.log(islrReports);

    // Reference to the DOM node we will snapshot
    const reportRef = useRef<HTMLDivElement>(null)
    const statsRef = useRef<HTMLDivElement>(null)
    const finesTableRef = useRef<HTMLDivElement>(null)
    const ivaRef = useRef<HTMLDivElement>(null)
    const islrRef = useRef<HTMLDivElement>(null)

    // Toggle between normal preview and PDF-ready A4 mode
    const [pdfMode, setPdfMode] = useState(false)
    const navigate = useNavigate();

    const handleGeneratePdf = async () => {
        // 1) Activa pdfMode para que React renderice las 3 secciones
        setPdfMode(true)
        // 2) Espera un par de frames para que el DOM se actualice
        await new Promise<void>(resolve =>
            requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve())
            )
        )

        // 3) Ahora sí recogemos los refs
        if (!statsRef.current || !finesTableRef.current || !ivaRef.current || !islrRef.current) {
            console.error('Alguna sección no está disponible aún:', {
                stats: statsRef.current,
                fines: finesTableRef.current,
                iva: ivaRef.current,
                islr: islrRef.current,
            })
            return
        }

        const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()

        // Función que captura un elemento y lo añade al PDF, partiendo en páginas si hace falta
        const captureMultiPage = async (el: HTMLElement) => {
            const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#fff' })
            const imgData = canvas.toDataURL('image/png')
            const { width: imgW, height: imgH } = pdf.getImageProperties(imgData)
            const renderedHeight = (imgH * pdfWidth) / imgW

            let remainingHeight = renderedHeight
            let positionY = 0

            // Coloca tantas páginas como haga falta
            while (remainingHeight > 0) {
                pdf.addImage(imgData, 'PNG', 0, positionY, pdfWidth, renderedHeight)
                remainingHeight -= pageHeight
                positionY -= pageHeight
                if (remainingHeight > 0) pdf.addPage()
            }
        }

        // 4) Captura cada sección en su propia "serie de páginas"
        await captureMultiPage(statsRef.current)
        pdf.addPage()
        await captureMultiPage(finesTableRef.current)
        pdf.addPage()
        await captureMultiPage(ivaRef.current)
        pdf.addPage()
        await captureMultiPage(islrRef.current)

        // 5) Guarda el PDF
        pdf.save(`Detalle-Contribuyente-${taxpayer}.pdf`)
        setPdfMode(false)
    }

    console.log("EVENTS FROM REPORTMODAL: " + JSON.stringify(events))
    console.log("TAXSUMMARY FROM REPORTMODAL: " + JSON.stringify(taxSummary))

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-2 bg-black bg-opacity-50 lg:px-0">
            <div className="w-full max-w-full p-4 bg-white rounded-md max-h-full overflow-auto lg:w-11/12 lg:max-w-6xl lg:max-h-[90vh]">

                {/* Modal header */}
                <div className="flex flex-col items-start justify-between gap-2 mb-4 lg:flex-row lg:items-center lg:gap-0">
                    <h2 className="text-lg font-semibold lg:text-xl">
                        Detalle del Contribuyente con id: {taxpayer || "No se ha podido obtener el contribuyente"}
                    </h2>
                    <button
                        className="w-full px-4 py-2 text-white bg-red-500 rounded lg:w-auto"
                        onClick={() => navigate("/gen-reports")}
                    >
                        Cerrar
                    </button>
                </div>
                {/* Generate PDF button - siempre debajo de todo */}
                <div className="flex flex-col items-end mt-4 space-y-2 lg:flex-row lg:justify-end lg:space-y-0 lg:space-x-2">
                    <button
                        onClick={handleGeneratePdf}
                        className="w-full px-4 py-2 text-white bg-blue-500 rounded lg:w-auto"
                    >
                        Generar PDF
                    </button>
                </div>

                {/* Wrapper para borde y contenido del reporte */}
                <div className="w-full rounded-md">
                    <div
                        ref={reportRef}
                        className="p-4 bg-white rounded-md"
                        style={{
                            width: pdfMode ? '210mm' : '100%',
                            minHeight: pdfMode ? '297mm' : undefined,
                            maxHeight: pdfMode ? undefined : '70vh',
                        }}
                    >
                        <style>
                            {`
                            * { line-height: initial !important; }
                            button {
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                            }
                            `}
                        </style>

                        {/* Report component */}
                        <TaxpayerDetailReport
                            islrRef={islrRef}
                            pdfMode={pdfMode}
                            events={events}
                            taxSummary={taxSummary}
                            statsRef={statsRef}
                            islrReports={islrReports}
                            finesRef={finesTableRef}
                            ivaRef={ivaRef}
                        />
                    </div>
                </div>
            </div>
        </div>
    )

}

export default ReportModal
