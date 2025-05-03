import ObservationsHeader from '@/components/observations/ObservationsHeader'
import ObservationsSection from '@/components/observations/ObservationsSection'
import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'

function ObservationsPage() {
    const { taxpayerId } = useParams()

    



    return (
        <div className='bg-white'>
            <ObservationsHeader taxpayerId={taxpayerId}/>
            <ObservationsSection taxpayerId={taxpayerId}/>
        </div>
    )
}

export default ObservationsPage