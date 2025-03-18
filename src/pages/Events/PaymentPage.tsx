// import React from 'react'
import EventForm from '../../components/Events/EventForm'
import { useParams } from 'react-router-dom'

function PaymentPage() {
<<<<<<< HEAD
    const { taxpayerId } = useParams()
    return (
        <EventForm type='payment' title='Pago' taxpayerId={taxpayerId} />
=======
    const { taxpayer } = useParams()
    return (
        <EventForm type='payment' title='Pago' taxpayer={taxpayer} />
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
    )
}

export default PaymentPage