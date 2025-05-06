import EventTable from '../../components/Events/EventTable'
import { Group } from 'react-aria-components'
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useLoaderData } from 'react-router-dom'
import { Fines } from '../../App'
import { Payment } from '../../types/payment'
import { Taxpayer } from '@/types/taxpayer'
import { IndividualStats } from '@/components/stats/IndividualStats'
import { Decimal } from "decimal.js"
import { useState } from 'react'
import { Event } from '@/types/event'



const TaxpayerDetail = () => {
	const { taxpayer } = useParams()
	const { events: initialEvents, fines, payments } = useLoaderData() as { events: Event[], fines: Fines, payments: Payment }

	const [events, setEvents] = useState<Event[]>(initialEvents)


	console.log("EVENTS FROM TAXPAYERDETAIL: " + JSON.stringify(events))
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
		<div className='flex flex-col max-w-[46rem] lg:max-w-full h-full justify-center items-center w-full overflow-hidden'>
			<IndividualStats events={events} />
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
				<EventTable rows={events} setRows={setEvents} />
			</div>
		</div>
	)
}

export default TaxpayerDetail