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
import { forwardRef, useEffect, useState } from 'react'
import { Event } from '@/types/event'
import { MdInventory } from "react-icons/md";
import { IoDocumentTextOutline } from "react-icons/io5";
import { IVAReports } from '@/types/IvaReports'
import TaxSummaryTable from '@/components/iva/TaxSummaryTable'
import ISLRSummaryTable from '../ISLR/IslrSummaryTable'
import { ISLRReports } from '@/types/ISLRReports'


interface TaxpayerDetailReportProps {
    pdfMode?: boolean;
    events: Event[];
    taxSummary: IVAReports[];
    islrReports: ISLRReports[];
    statsRef: React.RefObject<HTMLDivElement | null>;  // <-- changed here
    finesRef: React.RefObject<HTMLDivElement | null>;
    ivaRef: React.RefObject<HTMLDivElement | null>;
    islrRef: React.RefObject<HTMLDivElement | null>;
}





// Forward ref so the parent can snapshot this container
const TaxpayerDetailReport = forwardRef<HTMLDivElement, TaxpayerDetailReportProps>(
    ({ pdfMode = false, events, taxSummary, statsRef, ivaRef, finesRef, islrReports, islrRef }, ref) => {
        // const { taxpayer } = useParams()

        useEffect(() => {
            console.log("ivaRef inside TaxpayerDetailReport:", ivaRef);
            if (ivaRef && "current" in ivaRef && ivaRef.current) {
                console.log("ivaRef.current inside TaxpayerDetailReport:", ivaRef.current);
            } else {
                console.log("ivaRef is either null or a callback ref, cannot access current property.");
            }
        }, [ivaRef]);


        const [localEvents, setLocalEvents] = useState<Event[]>(events)
        const [selectedTable, setSelectedTable] = useState("fine")

        console.log(islrReports);


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
                <div ref={statsRef} className="w-full mb-8">
                    <IndividualStats events={localEvents} IVAReports={taxSummary} />
                </div>

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
                        <button
                            onClick={() => setSelectedTable('iva')}
                            className="flex items-center w-full px-2 py-1 border border-gray-200 rounded-md lg:w-auto"
                        >
                            {/* You can add the IoDocumentTextOutline icon here */}
                            Historial de reporte de ISLR
                        </button>
                    </div>
                )}

                {/* Multas Table */}
                {(pdfMode || selectedTable === 'fine') && (
                    <div ref={finesRef} className="w-full h-full mb-8 overflow-x-auto lg:overflow-x-hidden">
                        <EventTable rows={localEvents} setRows={setLocalEvents}  pdfMode={pdfMode}/>
                    </div>
                )}

                {/* Separator only in PDF mode */}
                {pdfMode && <div className="w-full my-8 border-t border-gray-300" />}

                {/* IVA Table */}
                {(pdfMode || selectedTable === 'iva') && (
                    <div ref={ivaRef} className="w-full overflow-x-auto text-center lg:overflow-x-hidden">
                        <TaxSummaryTable rows={taxSummary} pdfMode={pdfMode} />
                    </div>
                )}

                {/* ISLR Table */}
                {(pdfMode || selectedTable === 'islr') && (
                    <div ref={islrRef} className="w-full overflow-x-auto text-center lg:overflow-x-hidden">
                        <ISLRSummaryTable rows={islrReports} pdfMode={pdfMode} />
                    </div>
                )}
            </div>
        )
    }
)

export default TaxpayerDetailReport