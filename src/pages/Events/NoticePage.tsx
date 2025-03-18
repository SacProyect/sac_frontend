// import React from 'react'
import EventForm from '../../components/Events/EventForm'
import { useParams } from 'react-router-dom'

function NoticePage() {
    const { taxpayer } = useParams()
    return (
<<<<<<< HEAD
        <EventForm type='warning' title='Aviso' taxpayerId={taxpayer} />
=======
        <EventForm type='warning' title='Aviso' taxpayer={taxpayer} />
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
    )
}

export default NoticePage