import EventTable from '../../components/Events/EventTable'
import { Group } from 'react-aria-components'
import { useLoaderData, useParams } from 'react-router-dom'
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


interface TaxpayerDetailReportProps {
    /** When true, PDF mode is active and both tables should render */
    pdfMode?: boolean;
    events: Event[]
    taxSummary: IVAReports[]
}



// Forward ref so the parent can snapshot this container
const TaxpayerDetailReport = forwardRef<HTMLDivElement, TaxpayerDetailReportProps>(
    ({ pdfMode = false, events, taxSummary }, ref) => {
        // const { taxpayer } = useParams()


        const [localEvents, setLocalEvents] = useState<Event[]>(events)
        const [selectedTable, setSelectedTable] = useState("fine")


        console.log("EVENTS FROM TAXPAYERDETAILREPORT: " + JSON.stringify(events))
        console.log("TAX SUMMARY FROM TAXPAYERDETAILREPORT: " + JSON.stringify(taxSummary))
        // console.log("FINES FROM TAXPAYERDETAIL: " + JSON.stringify(fines))
        // console.log("PAYMENTS FROM TAXPAYERDETAIL: " + JSON.stringify(payments))

        return (
            <div
                ref={ref}
                className="flex flex-col max-w-[46rem] lg:max-w-full  justify-center items-center w-full"
            >
                {/* Summary stats always at top */}
                <IndividualStats events={localEvents} IVAReports={taxSummary} />

                {/* In preview mode, show toggle buttons */}
                {!pdfMode && (
                    <div className="flex flex-col w-full pt-4 pb-4 pl-4 space-y-2 lg:flex-row lg:space-x-2 lg:space-y-0">
                        <button
                            onClick={() => setSelectedTable('fine')}
                            className="flex items-center w-full px-2 py-1 border border-gray-200 rounded-md lg:w-auto"
                        >
                            {/* You can add the MdInventory icon here */}
                            Historial de multas
                        </button>
                        <button
                            onClick={() => setSelectedTable('iva')}
                            className="flex items-center w-full px-2 py-1 border border-gray-200 rounded-md lg:w-auto"
                        >
                            {/* You can add the IoDocumentTextOutline icon here */}
                            Historial de reporte de IVA
                        </button>
                    </div>
                )}

                {/* Render the fines table if in PDF mode always, or in preview when selected */}
                {(pdfMode || selectedTable === 'fine') && (
                    <div className="w-full overflow-x-auto lg:overflow-x-hidden">
                        <EventTable rows={localEvents} setRows={setLocalEvents} />
                    </div>
                )}

                {/* Separator only in PDF mode */}
                {pdfMode && <div className="w-full my-8 border-t border-gray-300" />}

                {/* Render the IVA table if in PDF mode always, or in preview when selected */}
                {(pdfMode || selectedTable === 'iva') && (
                    <div className="flex items-center justify-center w-full overflow-x-auto text-center lg:overflow-x-hidden">
                        <TaxSummaryTable rows={taxSummary} />
                    </div>
                )}
            </div>
        )
    }
)

export default TaxpayerDetailReport