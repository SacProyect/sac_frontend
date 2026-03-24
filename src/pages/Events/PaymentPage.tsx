// import React from 'react'
import EventForm from '../../components/Events/EventForm'
import { useParams } from 'react-router-dom'

function PaymentPage() {
    const { taxpayerId } = useParams()
    return (
        <EventForm type='payment' title='Pago' taxpayerId={taxpayerId} />
    )
}

export default PaymentPage