import ObservationsHeader from '@/components/observations/ObservationsHeader'
import ObservationsSection from '@/components/observations/ObservationsSection'
import React from 'react'
import { useParams } from 'react-router-dom'

function ObservationsPage() {
    const { taxpayer } = useParams()



    return (
        <div className='bg-white'>
            <ObservationsHeader />
            <ObservationsSection />
        </div>
    )
}

export default ObservationsPage