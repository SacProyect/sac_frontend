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



    useEffect(() => {
        console.log("👤 User loaded:", user);

        if ((user.role === "FISCAL" || user.role === "ADMIN") && user.taxpayer) {
            console.log("📄 User is FISCAL or ADMIN, taxpayer:", user.taxpayer);
            setTaxpayers(user.taxpayer);
        } else if (user.role === "COORDINATOR") {
            console.log("👥 User is COORDINATOR");

            if (!user.coordinatedGroup) {
                console.warn("⚠️ user.coordinatedGroup is undefined or null");
            } else if (!user.coordinatedGroup.members) {
                console.log("USER: " + JSON.stringify(user))
                console.warn("⚠️ user.coordinatedGroup.members is undefined or empty");
            } else {
                console.log("✅ Members found:", user.coordinatedGroup.members);
            }

            const groupTaxpayers = user.coordinatedGroup?.members?.flatMap(
                (member) => member.taxpayer || []
            );

            console.log("🧾 Extracted taxpayers from coordinator group:", groupTaxpayers);
            setTaxpayers(groupTaxpayers || []);
        }
    }, [user]);



    const { contains } = useFilter({ sensitivity: "case" })
    const {
        control,
        watch,
    } = useForm({ defaultValues: { search: '' } })
    const filterValue = watch('search')
    const filteredItems = useMemo(
        () => (taxpayers || [])
            .filter((item) =>
                contains(
                    `${item.rif ? item.rif.toLowerCase() : ""} ${item.process ? item.process.toLowerCase() : ""} ${item.name ? item.name.toLowerCase() : ""} ${item.address ? item.address.toLowerCase() : ""}`, filterValue ? filterValue.toLowerCase() : ""
                )
            )
            .map((item) => ({
                ...item,
                contract_type: item.contract_type == "ORDINARY" ? 'ORDINARIO' as contract_type : 'ESPECIAL' as contract_type,
                address: item.address || 'N/A'
            })),
        [taxpayers, filterValue, user]);

    console.log("TAXPAYER INFO HOMEPAGE: " + JSON.stringify(filteredItems))


    return (
        <div className='flex justify-center w-full lg:pt-8 sm:mt-0'>
            <div className='flex-col items-center justify-center ml-0 '>
                <h2 className="w-full text-2xl font-bold text-center text-black ">Administración</h2>
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
                            className={"flex flex-col ml-0 lg:ml-4"}
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
