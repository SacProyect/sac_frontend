import React from 'react'
import EventForm from '../../components/Events/EventForm'
import { useParams } from 'react-router-dom'

function NoticePage() {
    const { contribuyente } = useParams()
    return (
        <EventForm type='aviso' title='Aviso' contribuyente={contribuyente} />
    )
}

export default NoticePage