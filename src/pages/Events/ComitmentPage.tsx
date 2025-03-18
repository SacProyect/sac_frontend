import React from 'react'
import EventForm from '../../components/Events/EventForm'
import { useParams } from 'react-router-dom'

function ComitmentPage() {
<<<<<<< HEAD
    const { taxpayerId } = useParams()
    return (
        <EventForm type='payment_compromise' title='compromiso de pago' taxpayerId={taxpayerId} />
=======
    const { taxpayer } = useParams()
    return (
        <EventForm type='payment_compromise' title='compromiso de pago' taxpayer={taxpayer} />
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
    )
}

export default ComitmentPage