import EventTable from '../../components/Events/EventTable'
import { Group } from 'react-aria-components'
<<<<<<< HEAD
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



=======
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useLoaderData } from 'react-router-dom'
import { Event } from '../../types/event'
import { Fines } from '../../App'
import { Payment } from '../../types/payment'
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)



const TaxpayerDetail = () => {
	const { taxpayer } = useParams()
<<<<<<< HEAD
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
=======
	const { event, fines, payments } = useLoaderData() as {event: Event, fines: Fines, payments: Payment}
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)

	const options = [{
		name: 'Aviso', path: `/warning/${taxpayer}`
	}, {
		name: 'Multa', path: `/fine/${taxpayer}`
	}, {
		name: 'Pago', path: `/payment/${taxpayer}`
	}, {
<<<<<<< HEAD
		name: 'Compromiso de pago', path: `/payment_compromise/${taxpayer}`
	}, {
		name: 'Observaciones', path: `/observations/${taxpayer}`
=======
		name: 'Compromiso de pago', path: `/compromiso_pago/${taxpayer}`
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
	}
	]

	return (
<<<<<<< HEAD
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
=======
		<div
			className='flex justify-center w-4/5 mt-20'>
			<div className='flex-col'>
				{
					(fines && payments) &&
					<div className='flex w-full mb-4 text-center'>

						<div className="w-1/2">
							<h2 className="w-full text-2xl font-bold text-center text-black mb-11">Multas</h2>
							<div className='flex flex-col text-left'>
								<span>Número total de multas: {fines.quantity}</span>
								<span>Monto total adeudado: Bs{fines.total_amount}</span>

							</div>
						</div>

						<div className="w-1/2">
							<h2 className="w-full text-2xl font-bold text-center text-black mb-11">Pagos</h2>
							<div className='flex flex-col text-left'>
								<span>Pagos Totales: {payments.payments_number}</span>
								<span>Monto total de Pagos: Bs{payments.total_amount}</span>
								<span>Tasa de cumplimiento: {payments.compliance_rate}%</span>
								<span>Demora promedio: {payments.average_delay} día(s)</span>
							</div>
						</div>

					</div>
				}

				<Group className={"mb-8 justify-between w-full flex"}>
					{options.map((opt) => (
						<Link
							to={opt.path}
							className={`bg-[#3498db] border-none  px-5 py-1 font-light text-center  no-underline   my-1  cursor-pointer  rounded  w- transition  hover:bg-green-500  hover:-translate-y-1`}
							key={opt.name}
						>
							<span className='text-white'>
								+{opt.name}
							</span>
						</Link>
					))}
				</Group>
				<EventTable propRows={event} />
			</div>
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
		</div>
	)
}

export default TaxpayerDetail