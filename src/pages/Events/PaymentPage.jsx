import React from 'react'
import EventForm from '../../components/Events/EventForm'
import { useParams } from 'react-router-dom'

function PaymentPage() {
    const { contribuyente } = useParams()
    return (
        <EventForm type='pago' title='Pago' contribuyente={contribuyente} />
    )
}

export default PaymentPage