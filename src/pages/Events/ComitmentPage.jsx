import React from 'react'
import EventForm from '../../components/Events/EventForm'
import { useParams } from 'react-router-dom'

function ComitmentPage() {
    const { contribuyente } = useParams()
    return (
        <EventForm type='compromiso_pago' title='Compromiso de pago' contribuyente={contribuyente} />
    )
}

export default ComitmentPage