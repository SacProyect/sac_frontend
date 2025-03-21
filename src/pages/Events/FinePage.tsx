import React from 'react'
import EventForm from '../../components/Events/EventForm'
import { useParams } from 'react-router-dom'
import { getTaxpayerEvents } from '../../components/utils/api/taxpayerFunctions'
import { useEffect } from 'react'

function FinePage() {
    const { taxpayerId } = useParams()

    console.log("USE PARAMS OUTPUT: " + taxpayerId)

    // const loadEvents = async (taxpayerId: string) => {
    //     const eventArray = await getTaxpayerEvents(taxpayerId, "FINE")
    //     console.log(eventArray)
    // }
    // useEffect(() => { if (taxpayer) { loadEvents(taxpayer) } }, [taxpayer])

    return (
        <EventForm title='Multa' type='fine' taxpayerId={taxpayerId} />
    )
}

export default FinePage