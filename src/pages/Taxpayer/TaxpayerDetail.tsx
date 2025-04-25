import EventTable from '../../components/Events/EventTable'
import { Group } from 'react-aria-components'
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useLoaderData } from 'react-router-dom'
import { Fines } from '../../App'
import { Payment } from '../../types/payment'
import { Taxpayer } from '@/types/taxpayer'
import { IndividualStats } from '@/components/stats/IndividualStats'
import {Decimal} from "decimal.js"


export interface Event {
	id: string,
	date: string,
	type: string,
	amount: string,
	taxpayerId: string,
	taxpayer: Taxpayer,
	debt: number;
}



const TaxpayerDetail = () => {
	const { taxpayer } = useParams()
	const { events, fines, payments } = useLoaderData() as { events: Event[], fines: Fines, payments: Payment }


	// console.log("EVENTS FROM TAXPAYERDETAIL: " + JSON.stringify(events))
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
	}
	]

	return (
		<div className='flex flex-col max-w-[46rem] lg:max-w-full h-full justify-center items-center w-full overflow-hidden'>
			{/* {
				(fines && payments) &&
				<div className='flex w-full max-w-[46rem] lg:max-w-full flex-wrap justify-center text-center'>

					<div className="w-1/2">
						<h2 className="w-full mb-6 text-2xl font-bold text-center text-black">Multas</h2>
						<div className='flex flex-col items-center text-left'>
							<span className='text-black'>Número total de multas: {fines.fines_quantity}</span>
							<span className='text-black'>Monto total adeudado: {fines.total_amount} Bs</span>
						</div>
					</div>

					<div className="w-1/2">
						<h2 className="w-full mb-6 text-2xl font-bold text-center text-black">Pagos</h2>
						<div className='flex flex-col items-center text-left'>
							<span className='text-black'>Pagos Totales: {payments.total_payments}</span>
							<span className='text-black'>Pagos Parciales: {payments.payments_number}</span>
							<span className='text-black'>Monto total de Pagos: {payments.total_amount} Bs</span>
							<span className='text-black'>Tasa de cumplimiento: {payments.compliance_rate}%</span>
							<span className='text-black'>Demora promedio: {payments.average_delay} día(s)</span>
						</div>
					</div>

				</div>
			} */}
			<IndividualStats  events={events} />
			<Group className={"mb-8 w-full flex items-center justify-center space-x-1 lg:space-x-20 pt-10"}>
				{options.map((opt) => (
					<Link
						to={opt.path}
						className={`bg-[#3498db] border-none px-4  lg:px-5 py-1 font-light text-center  no-underline   my-1  cursor-pointer  rounded  w- transition  hover:bg-green-500  hover:-translate-y-1`}
						key={opt.name}
					>
						<span className='text-xs text-white whitespace-nowrap lg:text-base'>
							+{opt.name}
						</span>
					</Link>
				))}
			</Group>
			<div className='flex items-center justify-center w-full overflow-x-auto lg:overflow-x-hidden lg:pl-0'>
				<EventTable propRows={events} />
			</div>
		</div>
	)
}

export default TaxpayerDetail