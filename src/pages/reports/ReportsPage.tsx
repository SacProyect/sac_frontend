import { Fines } from '@/App'
import GenerateReport from '@/components/reports/GenerateReport'
import { Event } from '@/types/event'
import { IVAReports } from '@/types/IvaReports'
import { Payment } from '@/types/payment'
import React from 'react'
import { useLoaderData } from 'react-router-dom'

function ReportsPage() {
    


    return (
        <section className='w-full'>
            <GenerateReport/>
        </section>
    )
}

export default ReportsPage