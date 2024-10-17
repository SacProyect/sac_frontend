import React from 'react'
import EventForm from '../../components/Events/EventForm'
import { useParams } from 'react-router-dom'
import { getTaxpayerEvents } from '../../components/utils/api/taxpayerFunctions'
import { useEffect } from 'react'

function FinePage() {
    const { contribuyente } = useParams()
    const loadEvents = async (contribuyente) => {
        const eventArray = await getTaxpayerEvents(contribuyente, "MULTA")
        console.log(eventArray)
    }
    useEffect(() => { if (contribuyente) { loadEvents(contribuyente) } }, [contribuyente])
    return (
        <EventForm title='Multa' type='multa' contribuyente={contribuyente} />
    )
}

export default FinePage