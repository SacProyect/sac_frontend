import React from 'react'
import EventForm from '../../components/Events/EventForm'
import { useParams } from 'react-router-dom'

function ComitmentPage() {
    const { taxpayerId } = useParams()
    return (
        <EventForm type='payment_compromise' title='compromiso de pago' taxpayerId={taxpayerId} />
    )
}

export default ComitmentPage