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




const ReportModal = () => {
    const { taxpayer } = useParams();
    const { events, fines, payments, taxSummary } = useLoaderData() as { events: Event[], fines: Fines, payments: Payment, taxSummary: IVAReports[] }

    // Reference to the DOM node we will snapshot
    const reportRef = useRef<HTMLDivElement>(null)

    // Toggle between normal preview and PDF-ready A4 mode
    const [pdfMode, setPdfMode] = useState(false)
    const navigate = useNavigate();

    const handleGeneratePdf = async () => {
        if (!reportRef.current) return

        // 1) Enable PDF mode (renders both tables at A4 dimensions)
        setPdfMode(true)
        // Wait one paint cycle so CSS '210mm' takes effect
        await new Promise(requestAnimationFrame)

        // 2) Capture the element as a high-resolution canvas
        const canvas = await html2canvas(reportRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#fff',
        })

        // 3) Convert canvas to PNG
        const imgData = canvas.toDataURL('image/png')

        // 4) Create an A4 PDF (points: 1/72in)
        const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const imgProps = pdf.getImageProperties(imgData)
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

        // 5) Add the image and save
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
        pdf.save(`Detalle-Contribuyente-${taxpayer}.pdf`)

        // 6) Return to normal preview
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
                <div className="flex flex-col items-end mt-4 space-y-2 lg:hidden lg:flex-row lg:justify-end lg:space-y-0 lg:space-x-2">
                    <button
                        onClick={handleGeneratePdf}
                        className="w-full px-4 py-2 text-white bg-blue-500 rounded lg:w-auto"
                    >
                        Generar PDF
                    </button>
                </div>

                {/* Wrapper para borde y contenido del reporte */}
                <div className="w-full rounded-md lg:border lg:border-gray-400">
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
                        <TaxpayerDetailReport pdfMode={pdfMode} events={events} taxSummary={taxSummary} />
                    </div>
                </div>

                {/* Generate PDF button - siempre debajo de todo */}
                <div className="flex-col items-end hidden mt-4 space-y-2 lg:flex lg:flex-row lg:justify-end lg:space-y-0 lg:space-x-2">
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

export default ReportModal
