<<<<<<< HEAD
import { useMemo, useEffect, useState } from 'react';
import TaxpayerTable from '../../components/Taxpayer/TaxpayerTable';
import { useAuth } from '../../hooks/useAuth';
import { Input, Label, SearchField } from 'react-aria-components';
import { Controller, useForm } from 'react-hook-form';
import { useFilter } from 'react-aria';
import { useNavigate } from 'react-router-dom';
import { Taxpayer } from '@/types/taxpayer';
import { useDebounce } from '@/hooks/useDebounce';
import { getTaxpayers } from '@/components/utils/api/taxpayerFunctions';
import toast from 'react-hot-toast';

function HomePage() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [visibleCount, setVisibleCount] = useState(25);




    if (!user) {
        navigate("/login");
        return null;
    }

    // useEffect(() => {
    //     refreshUser();
    // }, []);

    const [taxpayers, setTaxpayers] = useState<Taxpayer[]>([]);


    useEffect(() => {
        const loadTaxpayers = async () => {
            try {
                const response = await getTaxpayers();

                setTaxpayers(response);

            } catch (e) {
                console.error(e);
                toast.error("No se pudieron obtener los contribuyentes.");
            }
        }

        loadTaxpayers();
    }, [])

    const { contains } = useFilter({ sensitivity: "base" });
    const { control, watch } = useForm({
        defaultValues: {
            search: '',
            year: 'Todos'
        }
    });

    const searchValue = watch('search');
    const selectedYear = watch('year');
    const debouncedSearch = useDebounce(searchValue.toLowerCase(), 800);

    const filteredItems = useMemo(() => {
        const term = debouncedSearch.trim();

        const result = taxpayers
            .map(item => {
                const officerName = item.user?.name || "Desconocido";

                return {
                    ...item,
                    contractTypeLabel: item.contract_type === "ORDINARY" ? 'ORDINARIO' : 'ESPECIAL',
                    address: item.address || 'N/A',
                    officerName,
                };
            })
            .filter(item => {
                // ✅ CORRECCIÓN CRÍTICA 2026: Usar UTC para obtener el año fiscal correcto
                // El problema era que getFullYear() usaba la zona horaria local, causando que
                // fechas como "2025-12-31T23:00:00.000Z" se interpretaran como 2025 en lugar de 2026
                const emitionDate = item.emition_date ? new Date(item.emition_date) : null;
                const itemYear = emitionDate ? emitionDate.getUTCFullYear().toString() : '';

                const yearMatches = selectedYear === 'Todos' || itemYear === selectedYear;
                if (!yearMatches) return false;

                if (!term) return true;

                const haystack = `${item.rif} ${item.process} ${item.name} ${item.address} ${item.user.name} ${item.providenceNum}`.toLowerCase();
                return contains(haystack, term);
            });
        return result;
    }, [taxpayers, debouncedSearch, user, contains, selectedYear]);

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return ['Todos', ...Array.from({ length: currentYear - 2022 }, (_, i) => (2023 + i).toString())];
    }, []);




    useEffect(() => {
        setVisibleCount(25); // reset cuando se filtra
    }, [debouncedSearch, selectedYear]);




    return (
        <div className="w-full px-0 py-0 overflow-x-hidden">
            <div className="w-full mx-auto xl:max-w-full lg:max-w-screen-lg">
                <h2 className="my-4 text-2xl font-bold text-center text-black">Administración</h2>

                <div className="flex flex-col flex-wrap items-stretch justify-between gap-2 px-4 mb-4 sm:flex-row">
                    <Controller
                        control={control}
                        name='search'
                        render={({ field: { name, value, onChange, onBlur } }) => (
                            <SearchField name={name} value={value} onChange={onChange} onBlur={onBlur} className="flex-1 px-2 lg:w-11/12 lg:px-0">
                                <Label className="mb-1 text-sm font-medium text-gray-700">Buscar</Label>
                                <Input
                                    className="w-full p-2 text-black transition bg-white border border-gray-300 shadow-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Buscar por RIF, nombre, proceso..."
                                    onChange={onChange}
                                />
                            </SearchField>
                        )}
                    />

                    <Controller
                        control={control}
                        name='year'
                        render={({ field }) => (
                            <div className="px-2 lg:w-1/12 lg:px-0">
                                <Label className="mb-1 text-sm font-medium text-gray-700">Año</Label>
                                <select
                                    {...field}
                                    className="w-full p-2 text-black transition bg-white border border-gray-300 shadow-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    />
                </div>

                <div className="flex items-center justify-center w-full pl-2 overflow-x-auto lg:pl-0">
                    <TaxpayerTable propRows={filteredItems} visibleCount={visibleCount}
                        setVisibleCount={setVisibleCount}
                    />
=======
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

    useEffect(() => {

        if (user.role === "FISCAL" || user.role === "ADMIN" && user.taxpayer) setTaxpayers(user.taxpayer);


        if (user.role === "COORDINATOR") {
            const groupTaxpayers = user.coordinatedGroup?.members?.flatMap(
                (member) => member.taxpayer
            );
            setTaxpayers(groupTaxpayers || []);
        }

        // console.log(user.taxpayer)
    }, [user])

    // console.log("TAXPAYER INFO HOMEPAGE: " + JSON.stringify(filteredItems))


    return (
        <div className='flex items-center justify-center w-full mt-20 sm:mt-0'>
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
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
                </div>
            </div>
        </div>
    );
}

export default HomePage;
