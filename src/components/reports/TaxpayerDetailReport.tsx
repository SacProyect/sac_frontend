import EventTable from '../../components/Events/EventTable'
import { Group } from 'react-aria-components'
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
// import { useLoaderData } from 'react-router-dom'
import { Fines } from '../../App'
import { Payment } from '../../types/payment'
import { event_type, Taxpayer } from '@/types/taxpayer'
import { IndividualStats } from '@/components/stats/IndividualStats'
import { Decimal } from "decimal.js"
import { forwardRef, useState } from 'react'
import { Event } from '@/types/event'
import { MdInventory } from "react-icons/md";
import { IoDocumentTextOutline } from "react-icons/io5";
import { IVAReports } from '@/types/IvaReports'
import TaxSummaryTable from '@/components/iva/TaxSummaryTable'

// Mocking useLoaderData
const useLoaderData = () => ({
    events: [
        {
            id: "1",
            name: "Evento 1",
            date: "2025-05-08",
            description: "Descripción del evento 1",
            amount: 100,
            type: "FINE" as event_type,
            status: true,
            taxpayerId: "123",
            taxpayer: [],
            payment: undefined,
            expires_at: "2025-06-08"
        },
        {
            id: "2",
            name: "Evento 2",
            date: "2025-05-07",
            description: "Descripción del evento 2",
            amount: 200,
            type: "FINE" as event_type,
            status: false,
            taxpayerId: "124",
            taxpayer: [],
            payment: undefined,
            expires_at: "2025-06-07"
        },
    ],
    fines: { total: 2, amount: 500 },
    payments: { total: 1, amount: 300 },
    taxSummary: [
        { id: "1", description: "IVA Reporte 1", amount: 100, iva: 10, excess: 5, date: "2025-05-01", purchases: 50, sells: 60 },
        { id: "2", description: "IVA Reporte 2", amount: 200, iva: 20, excess: 10, date: "2025-06-01", purchases: 100, sells: 120 },
    ],
});

interface TaxpayerDetailReportProps {
    /** When true, PDF mode is active and both tables should render */
    pdfMode?: boolean
}



// Forward ref so the parent can snapshot this container
const TaxpayerDetailReport = forwardRef<HTMLDivElement, TaxpayerDetailReportProps>(
    ({ pdfMode = false }, ref) => {
        const { taxpayer } = useParams<{ taxpayer: string }>()
        // Mocked loader data for events and IVA summary
        const { events: initialEvents, taxSummary } = useLoaderData()
        const [events, setEvents] = useState<Event[]>(initialEvents)
        const [selectedTable, setSelectedTable] = useState<'fine' | 'iva'>('fine')

        return (
            <div
                ref={ref}
                className="flex flex-col max-w-[46rem] lg:max-w-full h-full justify-center items-center w-full"
            >
                {/* Summary stats always at top */}
                <IndividualStats events={events} />

                {/* In preview mode, show toggle buttons */}
                {!pdfMode && (
                    <div className="w-full flex space-x-2 pb-4 pl-4 pt-4">
                        <button
                            onClick={() => setSelectedTable('fine')}
                            className="flex items-center border border-gray-200 rounded-md py-1 px-2"
                        >
                            {/* You can add the MdInventory icon here */}
                            Historial de multas
                        </button>
                        <button
                            onClick={() => setSelectedTable('iva')}
                            className="flex items-center border border-gray-200 rounded-md py-1 px-2"
                        >
                            {/* You can add the IoDocumentTextOutline icon here */}
                            Historial de reporte de IVA
                        </button>
                    </div>
                )}

                {/* Render the fines table if in PDF mode always, or in preview when selected */}
                {(pdfMode || selectedTable === 'fine') && (
                    <div className="w-full overflow-x-auto lg:overflow-x-hidden">
                        <EventTable rows={events} setRows={setEvents} />
                    </div>
                )}

                {/* Separator only in PDF mode */}
                {pdfMode && <div className="my-8 border-t border-gray-300 w-full" />}

                {/* Render the IVA table if in PDF mode always, or in preview when selected */}
                {(pdfMode || selectedTable === 'iva') && (
                    <div className="w-full overflow-x-auto lg:overflow-x-hidden flex items-center text-center justify-center">
                        <TaxSummaryTable rows={taxSummary} />
                    </div>
                )}
            </div>
        )
    }
)

export default TaxpayerDetailReport