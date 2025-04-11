import { PageOneStats } from '@/components/stats/PageOneStats'
import { PageTwoStats } from '@/components/stats/PageTwoStats'
import React from 'react'

function StatsPage() {
    return (
        <div className='flex w-[84vw] h-full'>
            <PageOneStats />
            <PageTwoStats />
        </div>
    )
}

export default StatsPage