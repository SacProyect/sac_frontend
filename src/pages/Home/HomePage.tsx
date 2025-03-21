import { useMemo } from 'react';
import TaxpayerTable from '../../components/Taxpayer/TaxpayerTable';
import { useAuth } from '../../hooks/useAuth';
import { Input } from 'react-aria-components';
import { SearchField } from 'react-aria-components';
import { Controller, useForm } from 'react-hook-form';
import { useFilter } from 'react-aria';
import { Label } from 'react-aria-components';
import { useEffect } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { contract_type } from '@/types/taxpayer';

function HomePage() {
    const { user } = useAuth();
    const navigate = useNavigate();


    if (!user) {
        navigate(
            "/login",
        )
        return null;
    }

    const [taxpayers, setTaxpayers] = useState(user?.taxpayer || [])
    const { contains } = useFilter({ sensitivity: "case" })
    const {
        control,
        watch,
    } = useForm({ defaultValues: { search: '' } })
    const filterValue = watch('search')
    const filteredItems = useMemo(
        () => (taxpayers || [])
            .filter((item) => contains(`${item.rif.toLowerCase()} ${item.process.toLowerCase()} ${item.name.toLowerCase()}`, filterValue.toLowerCase()))
            .map((item) => ({
                ...item,
                contract_type: item.contract_type == "ORDINARY" ? 'ORDINARIO' as contract_type : 'ESPECIAL' as contract_type,
            })),
        [taxpayers, filterValue, user]);

    useEffect(() => {
        setTaxpayers(user.taxpayer)
        console.log(user.taxpayer)
    }, [user])

    console.log("TAXPAYER INFO HOMEPAGE: " + JSON.stringify(filteredItems))


    return (
        <div className='flex items-center justify-center w-full pb-10 mt-20 sm:pb-10 sm:mt-0'>
            <div className='flex-col items-center justify-center ml-0 '>
                <h2 className="w-full text-2xl font-bold text-center text-black mb-11">Administración</h2>
                <Controller
                    control={control}
                    name='search'
                    render={({
                        field: { name, value, onChange, onBlur }
                    }) => (
                        <SearchField
                            name={name}
                            value={value.toLowerCase()}
                            onChange={onChange}
                            onBlur={onBlur}
                            className={"flex flex-col"}
                        >
                            <Label>Buscar</Label>
                            <Input
                                className={"w-full lg:w-1/2 p-1 mb-4 border border-[#ccc] rounded-lg bg-slate-50 text-black cursor-pointer"}
                                onChange={onChange} />
                        </SearchField>
                    )}
                />

                <div className="">
                    <TaxpayerTable propRows={filteredItems} />
                </div>
            </div>
        </div>
    );
}

export default HomePage;
