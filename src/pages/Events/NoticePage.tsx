// import React from 'react'
import EventForm from '../../components/Events/EventForm'
import { useParams } from 'react-router-dom'

function NoticePage() {
    const { taxpayer } = useParams()
    return (
        <EventForm type='warning' title='Aviso' taxpayer={taxpayer} />
    )
}

export default NoticePage