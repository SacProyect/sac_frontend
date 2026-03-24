import EventTable from '../../components/Events/EventTable'
import { Group } from 'react-aria-components'
import { useNavigate, useParams, useLocation, Navigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useLoaderData } from 'react-router-dom'
import { Fines } from '@/pages/router'
import { Payment } from '../../types/payment'
import { Taxpayer } from '@/types/taxpayer'
import { IndividualStats } from '@/components/stats/IndividualStats'
import { Decimal } from "decimal.js"
import { useState } from 'react'
import { Event } from '@/types/event'
import { MdInventory } from "react-icons/md";
import { IoDocumentTextOutline } from "react-icons/io5";
import { IVAReports } from '@/types/IvaReports'
import TaxSummaryTable from '@/components/iva/TaxSummaryTable'
import { ISLRReports } from '@/types/ISLRReports'
import ISLRSummaryTable from '@/components/ISLR/IslrSummaryTable'
import { TbReportSearch } from "react-icons/tb";
import { useAuth } from '@/hooks/useAuth'






const TaxpayerDetail = () => {
	const { taxpayer } = useParams()
	const { events: initialEvents, fines, payments, taxSummary: initialTaxSummary, islrReports: initialIslrReports } = useLoaderData() as { events: Event[], fines: Fines, payments: Payment, taxSummary: IVAReports[], islrReports: ISLRReports[] }

	const [events, setEvents] = useState<Event[]>(initialEvents);
	const [taxSummary, setTaxSummary] = useState<IVAReports[]>(initialTaxSummary);
	const [islrReports, setIslrReports] = useState<ISLRReports[]>(initialIslrReports);
	const [selectedTable, setSelectedTable] = useState("fine");
	const { user } = useAuth();
	const location = useLocation();

	if (!user) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}


	// console.log("EVENTS FROM TAXPAYERDETAIL: " + JSON.stringify(events))
	// console.log("TAX SUMMARY FROM TAXPAYERDETAIL: " + JSON.stringify(taxSummary))
	// console.log("FINES FROM TAXPAYERDETAIL: " + JSON.stringify(fines))
	// console.log("PAYMENTS FROM TAXPAYERDETAIL: " + JSON.stringify(payments))

	const options = [{
		name: 'Aviso', path: `/warning/${taxpayer}`
	}, {
		name: 'Multa', path: `/fine/${taxpayer}`
	}, {
		name: 'Pago', path: `/payment/${taxpayer}`
	}, {
		name: 'Compromiso de pago', path: `/payment_compromise/${taxpayer}`
	}, {
		name: 'Observaciones', path: `/observations/${taxpayer}`
	}
	]

	return (
		<div className='flex flex-col max-w-[46rem] md:max-w-full lg:max-w-full h-full justify-center items-center w-full overflow-hidden'>
			<IndividualStats events={events} IVAReports={taxSummary} />
			<Group className="flex flex-col items-center justify-center w-full pt-4 mb-4 space-y-2 lg:pt-4 lg:flex-row lg:space-x-20 lg:space-y-0">
				{(() => {
					// Encuentra el contribuyente con el ID de la URL
					const matchedTaxpayer = user?.taxpayer?.find(t => t.id === taxpayer);

					// Verifica si el officerId coincide con el user.id
					const canSeeAllOptions =
						user.role === "ADMIN" || (matchedTaxpayer && matchedTaxpayer.officerId === user.id);

					// Si puede ver todo, muestra todas las opciones
					const filteredOptions = canSeeAllOptions
						? options
						: options.filter(opt => opt.name === 'Observaciones');

					return filteredOptions.map(opt => (
						<Link
							to={opt.path}
							key={opt.name}
							className="bg-[#3498db] border-none px-4 lg:px-5 py-1 font-light text-center no-underline my-1 cursor-pointer rounded w-auto transition hover:bg-green-500 hover:-translate-y-1"
						>
							<span className="text-xs text-white whitespace-nowrap lg:text-base">
								+{opt.name}
							</span>
						</Link>
					));
				})()}
			</Group>
			<div className="flex flex-col w-full pb-2 pl-4 pr-4 space-y-2 lg:pr-0 lg:flex-row lg:space-x-2 lg:space-y-0">
				<div className="flex items-center w-full pl-2 border border-gray-200 rounded-md lg:w-48 lg:pr-0">
					<MdInventory size={15} />
					<button className="w-full px-2 py-1 text-left" onClick={() => setSelectedTable("fine")}>
						Historial de multas
					</button>
				</div>
				<div className="flex items-center w-full pl-2 border border-gray-200 rounded-md lg:w-64 lg:pr-0">
					<IoDocumentTextOutline size={15} />
					<button className="w-full px-2 py-1 text-left" onClick={() => setSelectedTable("iva")}>
						Historial de reporte de IVA
					</button>
				</div>
				<div className="flex items-center w-full pl-2 border border-gray-200 rounded-md lg:w-64 lg:pr-0">
					<TbReportSearch size={15} />
					<button className="w-full px-2 py-1 text-left" onClick={() => setSelectedTable("islr")}>
						Historial de reporte de ISLR
					</button>
				</div>
			</div>
			{selectedTable == "fine" ? (
				<div className='flex text-center items-center justify-center w-full h-full lg:h-[25vh] pb-24 overflow-x-auto lg:pb-0 lg:overflow-x-hidden lg:pl-0'>
					{events.length > 0 ? (
						<EventTable rows={events} setRows={setEvents} />
					) : "No hay datos para mostrar. Por favor agregue multas a este contribuyente para poder ver esta tabla."}
				</div>
			) : selectedTable === "iva" ? (
				<div className='flex text-center items-start justify-center w-full h-full lg:h-[25vh] pb-24 overflow-x-auto lg:pb-0 lg:overflow-x-hidden lg:pl-0'>
					{taxSummary.length > 0 ? (
						<TaxSummaryTable rows={taxSummary} setRows={setTaxSummary} />
					) :
						<div className='flex items-center justify-center w-full h-full text-center'>
							<p className=''>No hay datos para mostrar. Por favor agregue reportes de IVA a este contribuyente para poder ver esta tabla.</p>
						</div>
					}

				</div>
			) : <div className='flex text-center items-center justify-center w-full h-full lg:h-[25vh] pb-24 overflow-x-auto lg:pb-0 lg:overflow-x-hidden lg:pl-0'>
				{islrReports.length > 0 ? (
					<ISLRSummaryTable rows={islrReports} setRows={setIslrReports} />
				) : "No hay datos para mostrar. Por favor agregue declaraciones de ISLR a este contribuyente para poder ver esta tabla."}

			</div>
			}
		</div>
	)
}

export default TaxpayerDetail