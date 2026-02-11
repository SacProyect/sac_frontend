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
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(50);
    const [loading, setLoading] = useState(false);




    if (!user) {
        navigate("/login");
        return null;
    }

    // useEffect(() => {
    //     refreshUser();
    // }, []);

    const [taxpayers, setTaxpayers] = useState<Taxpayer[]>([]);

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

    useEffect(() => {
        const loadTaxpayers = async () => {
            try {
                setLoading(true);

                // Convertir el año seleccionado a número, o dejar undefined si es "Todos"
                const yearFilter =
                    selectedYear && selectedYear !== 'Todos'
                        ? parseInt(selectedYear, 10)
                        : undefined;

                // Usar el texto buscado (debounced) como filtro de backend si no está vacío
                const searchFilter = debouncedSearch.trim() || undefined;

                const response = await getTaxpayers(currentPage, limit, yearFilter, searchFilter);

                setTaxpayers(response.data);
                setTotal(response.total);
                setTotalPages(response.totalPages);

            } catch (e) {
                console.error(e);
                toast.error("No se pudieron obtener los contribuyentes.");
            } finally {
                setLoading(false);
            }
        }

        loadTaxpayers();
        // selectedYear es un string (por ejemplo "2025" o "Todos")
    }, [currentPage, limit, selectedYear, debouncedSearch]);

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
        // reset cuando se filtra o cambia de año
        setVisibleCount(25);

        // Al cambiar de año o filtro de búsqueda, volvemos a la primera página
        setCurrentPage(1);
    }, [debouncedSearch, selectedYear]);





    return (
        <div className="w-full px-0 py-0 overflow-hidden">
            <div className="w-full mx-auto xl:max-w-full lg:max-w-screen-lg">
                <h2 className="mb-4 text-2xl font-bold text-center text-black">Administración</h2>

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

                {/* Controles de Paginación (arriba de la tabla) */}
                <div className="flex flex-col items-center justify-between gap-4 px-4 mb-4 sm:flex-row">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        {loading && (
                            <svg className="w-4 h-4 shrink-0 animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        )}
                        Mostrando {taxpayers.length > 0 ? ((currentPage - 1) * limit + 1) : 0} - {Math.min(currentPage * limit, total)} de {total} contribuyentes
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1 || loading}
                            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Primera
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || loading}
                            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Anterior
                        </button>
                        
                        <span className="px-4 py-1 text-sm font-medium text-gray-700">
                            Página {currentPage} de {totalPages}
                        </span>
                        
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || loading}
                            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Siguiente
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages || loading}
                            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Última
                        </button>
                    </div>
                </div>

                <div className="w-full pl-2 lg:pl-0">
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
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();


    if (!user) {
        navigate(
            "/login",
        )
        return null;
    }

    useEffect(() => {
        refreshUser();
    }, [])

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
    const filteredItems = useMemo(() => {
        return (taxpayers || [])
            .filter((item) =>
                contains(
                    `${item.rif ? item.rif.toLowerCase() : ""} ${item.process ? item.process.toLowerCase() : ""} ${item.name ? item.name.toLowerCase() : ""} ${item.address ? item.address.toLowerCase() : ""}`,
                    filterValue ? filterValue.toLowerCase() : ""
                )
            )
            .map((item) => {
                const isCreatedByUser = item.user?.id === user.id;

                let officerName: string = 'Desconocido';

                if (isCreatedByUser || user.role === "FISCAL") {
                    officerName = user.name;
                } else if (user.role === 'ADMIN') {
                    officerName = item.user?.name || 'Desconocido';
                } else if (user.role === 'COORDINATOR') {
                    // If the user is a coordinator, match officerId with member.id
                    const matchedMember = user.coordinatedGroup?.members?.find(
                        (member) => member.id === item.officerId
                    );
                    officerName = matchedMember?.name || 'Desconocido';
                }

                return {
                    ...item,
                    contract_type: item.contract_type == "ORDINARY" ? 'ORDINARIO' as contract_type : 'ESPECIAL' as contract_type,
                    address: item.address || 'N/A',
                    officerName,
                };
            });
    }, [taxpayers, filterValue, user]);

    // console.log("TAXPAYER INFO HOMEPAGE: " + JSON.stringify(filteredItems))


    return (
        <div className='flex justify-center w-full lg:pt-8 sm:mt-0'>
            <div className='flex-col items-center justify-center ml-0'>
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
