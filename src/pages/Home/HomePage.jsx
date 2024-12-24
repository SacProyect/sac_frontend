import React, { useMemo } from 'react';
import TaxpayerTable from '../../components/Taxpayer/TaxpayerTable';
import { useAuth } from '../../hooks/useAuth';
import { Input } from 'react-aria-components';
import { SearchField } from 'react-aria-components';
import { Controller, useForm } from 'react-hook-form';
import { useFilter } from 'react-aria';
import { Label } from 'react-aria-components';
import { useEffect } from 'react';
import { useState } from 'react';

function HomePage() {
    const { user } = useAuth();
    const [taxpayers, setTaxpayers] = useState(user.contribuyentes)
    const { contains } = useFilter({ sensitivity: "case" })
    const {
        control,
        watch,
    } = useForm({ defaultValues: { search: '' } })
    const filterValue = watch('search')
    const filteredItems = useMemo(
        () => taxpayers.filter((item) => contains(`${item.rif} ${item.procedimiento} ${item.nombre}`, filterValue)),
        [taxpayers, filterValue, user]);

    useEffect(() => {
        setTaxpayers(user.contribuyentes)
        console.log(user.contribuyentes)
    }, [user])
    return (
        <div className='flex justify-center w-full mt-20 pb-10 sm:pb-10 sm:mt-0'>
            <div className='flex-col w-[18rem] sm:w-[60rem] ml-0 sm:ml-20'>
                <h2 className="text-black text-2xl font-bold w-full text-center mb-11">Administración</h2>
                <Controller
                    control={control}
                    name='search'
                    render={({
                        field: { name, value, onChange, onBlur, ref }
                    }) => (
                        <SearchField
                            name={name}
                            value={value}
                            onChange={onChange}
                            onBlur={onBlur}
                            className={"flex flex-col"}
                        >
                            <Label>Buscar</Label>
                            <Input
                                className={"w-1/2 p-1 mb-4 border border-[#ccc] rounded-lg bg-slate-50 text-black cursor-pointer"}
                                onChange={onChange} />
                        </SearchField>
                    )}
                />

                <div className="overflow-x-auto w-full">
                    <TaxpayerTable propRows={filteredItems} />
                </div>
            </div>
        </div>
    );
}

export default HomePage;
