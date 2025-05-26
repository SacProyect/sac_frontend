import ObservationsHeader from '@/components/observations/ObservationsHeader'
import ObservationsSection from '@/components/observations/ObservationsSection'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

function ObservationsPage() {
    const { taxpayerId } = useParams()
    const [refreshKey, setRefreshKey] = useState(0); // this key will trigger re-fetch

    const handleObservationCreated = () => {
        setRefreshKey(prev => prev + 1); // increment to force update
        console.log("Se activa")
    }
    



    return (
        <div className='w-full bg-white'>
            <ObservationsHeader taxpayerId={taxpayerId} onObservationCreated={handleObservationCreated} />
            <ObservationsSection taxpayerId={taxpayerId} refreshKey={refreshKey} />
        </div>
    )
}

export default ObservationsPage