import React from 'react'
import EventForm from '../../components/Events/EventForm'
import { useParams } from 'react-router-dom'

function ComitmentPage() {
    const { taxpayer } = useParams()
    return (
        <EventForm type='payment_compromise' title='compromiso de pago' taxpayer={taxpayer} />
    )
}

export default ComitmentPage