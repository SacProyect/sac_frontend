// import React from 'react'
import EventForm from '../../components/Events/EventForm'
import { useParams } from 'react-router-dom'

function PaymentPage() {
    const { taxpayer } = useParams()
    return (
        <EventForm type='payment' title='Pago' taxpayer={taxpayer} />
    )
}

export default PaymentPage