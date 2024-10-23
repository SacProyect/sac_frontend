import React from 'react'
import { getTaxpayerEvents } from '../../components/utils/api/taxpayerFunctions'
import EventTable from '../../components/Events/EventTable'
import { Group } from 'react-aria-components'
import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getFineHistory, getPaymentHistory } from '../../components/utils/api/reportFunctions'
import { useLoaderData } from 'react-router-dom'

const TaxpayerDetail = () => {
	const { contribuyente } = useParams()
	const { events, fines, payments } = useLoaderData()

	const options = [{
		name: 'Aviso', path: `/aviso/${contribuyente}`
	}, {
		name: 'Multa', path: `/multa/${contribuyente}`
	}, {
		name: 'Pago', path: `/pago/${contribuyente}`
	}, {
		name: 'Compromiso de pago', path: `/compromiso_pago/${contribuyente}`
	}
	]

	return (
		<div
			className='flex justify-center w-4/5 mt-20'>
			<div className='flex-col'>

				{
					(fines && payments) &&
					<div className='flex w-full text-center mb-4'>

						<div className="w-1/2">
							<h2 className="text-black text-2xl font-bold w-full text-center mb-11">Multas</h2>
							<div className='flex flex-col text-left'>
								<span>Número total de multas: {fines.numeroMultas}</span>
								<span>Monto total adeudado: Bs{fines.montoTotal}</span>

							</div>
						</div>

						<div className="w-1/2">
							<h2 className="text-black text-2xl font-bold w-full text-center mb-11">Pagos</h2>
							<div className='flex flex-col text-left'>
								<span>Pagos Totales: {payments.numeroPagos}</span>
								<span>Monto total de Pagos: Bs{payments.montoTotal}</span>
								<span>Tasa de cumplimiento: {payments.tasaCumplimiento}%</span>
								<span>Demora promedio: {payments.demoraPromedio} día(s)</span>
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
				<EventTable propRows={events} />
			</div>
		</div>
	)
}

export default TaxpayerDetail