import TaxpayerCensusTable from '@/components/census/TaxpayerCensusTable'
import { getTaxpayerCensus } from '@/components/utils/api/taxpayerCensusFunctions'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

function CensusTablePage() {
    const [taxpayersCensus, setTaxpayersCensus] = useState<any[]>([])

    useEffect(() => {
        const fetchData = async () => {
            try {

                const response = await getTaxpayerCensus();

                setTaxpayersCensus(response.data);

            } catch (e) {
                toast.error("No se pudieron obtener los contribuyentes.")
            }
        }
        fetchData()
    }, [])


    return (
        <div className=''>
            <TaxpayerCensusTable propRows={taxpayersCensus} />
        </div>
    )
}

export default CensusTablePage