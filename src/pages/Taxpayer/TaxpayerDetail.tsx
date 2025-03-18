import EventTable from '../../components/Events/EventTable'
import { Group } from 'react-aria-components'
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useLoaderData } from 'react-router-dom'
import { Event } from '../../types/event'
import { Fines } from '../../App'
import { Payment } from '../../types/payment'



const TaxpayerDetail = () => {
	const { taxpayer } = useParams()
	const { event, fines, payments } = useLoaderData() as {event: Event, fines: Fines, payments: Payment}

	const options = [{
		name: 'Aviso', path: `/warning/${taxpayer}`
	}, {
		name: 'Multa', path: `/fine/${taxpayer}`
	}, {
		name: 'Pago', path: `/payment/${taxpayer}`
	}, {
		name: 'Compromiso de pago', path: `/compromiso_pago/${taxpayer}`
	}
	]

	return (
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
		</div>
	)
}

export default TaxpayerDetail