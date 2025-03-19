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
            .filter((item) => contains(`${item.rif.toLowerCase()} ${item.process.toLowerCase()} ${item.name.toLowerCase()}`, filterValue.toLowerCase())),
        [taxpayers, filterValue, user]);

    useEffect(() => {
        setTaxpayers(user.taxpayer)
        console.log(user.taxpayer)
    }, [user])


    return (
        <div className='flex justify-center w-full pb-10 mt-20 sm:pb-10 sm:mt-0'>
            <div className='flex-col w-[18rem] sm:w-[60rem] ml-0 sm:ml-20'>
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
                                className={"w-1/2 p-1 mb-4 border border-[#ccc] rounded-lg bg-slate-50 text-black cursor-pointer"}
                                onChange={onChange} />
                        </SearchField>
                    )}
                />

                <div className="w-full overflow-x-auto">
                    <TaxpayerTable propRows={filteredItems} />
                </div>
            </div>
        </div>
    );
}

export default HomePage;
