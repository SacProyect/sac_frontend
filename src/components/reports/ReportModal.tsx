import React, { useRef, useState } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import TaxpayerDetailReport from './TaxpayerDetailReport'

interface ReportModalProps {
    taxpayer: string
    onClose: () => void
}

const ReportModal = ({ taxpayer, onClose }: ReportModalProps) => {
    // Reference to the DOM node we will snapshot
    const reportRef = useRef<HTMLDivElement>(null)
    // Toggle between normal preview and PDF-ready A4 mode
    const [pdfMode, setPdfMode] = useState(false)

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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-md w-11/12 max-w-6xl p-4">
                {/* Modal header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">
                        Detalle del Contribuyente: {taxpayer}
                    </h2>
                    <button onClick={onClose} className="px-4 py-2 bg-red-500 text-white rounded">
                        Cerrar
                    </button>
                </div>

                {/* Preview / snapshot container */}
                <div
                    ref={reportRef}
                    className="border border-gray-300 rounded-md p-4 bg-white"
                    style={{
                        // In PDF mode, force A4 dimensions; otherwise fill parent width
                        width: pdfMode ? '210mm' : '100%',
                        minHeight: pdfMode ? '297mm' : undefined,
                    }}
                >
                    {/* Global style overrides for the snapshot */}
                    <style>
                        {`
              /* Reset any custom line-height */
              * { line-height: initial !important; }
              /* Center button text vertically & horizontally */
              button {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
              }
            `}
                    </style>

                    {/* Pass pdfMode prop so the report shows both tables when needed */}
                    <TaxpayerDetailReport pdfMode={pdfMode} />
                </div>

                {/* Generate PDF button */}
                <div className="flex justify-end mt-4">
                    <button
                        onClick={handleGeneratePdf}
                        className="px-4 py-2 bg-blue-500 text-white rounded"
                    >
                        Generar PDF
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ReportModal
