import React, { useEffect, useState } from 'react';
import { CiSearch } from "react-icons/ci";
import { IoDocumentTextOutline } from "react-icons/io5";
import { useAuth } from '@/hooks/useAuth';
import { Taxpayer } from '@/types/taxpayer';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GroupData } from '@/types/stats';
import { getContributions } from '@/components/utils/api/reportFunctions';
import { getFiscalsForReview, getTaxpayerForEvents } from '@/components/utils/api/taxpayerFunctions';
import LoadingCircularComponent from '../UI/Loading/LoadingCircularComponent';
import { User } from '@/types/user';



function FiscalReviewComponent() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [groupData, setGroupData] = useState<GroupData[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [query, setQuery] = useState("");
    const [isLoadingFiscals, setIsLoadingFiscals] = useState(true);
    const [taxpayerArray, setTaxpayerArray] = useState<Taxpayer[]>([]);
    const [fiscalArray, setFiscalArray] = useState<User[]>([]);
    // ✅ CORRECCIÓN 2026: Agregado estado para filtro de año
    const [selectedYear, setSelectedYear] = useState<number | null>(null); // null = todos los años

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }
    }, [user])

    // ✅ CORRECCIÓN 2026: Actualizado para usar el filtro de año
    useEffect(() => {
        const fetchTaxpayers = async () => {
            setIsLoadingFiscals(true);
            try {
                // Pasar el año seleccionado (o undefined si es null)
                const year = selectedYear !== null ? selectedYear : undefined;
                const response = await getFiscalsForReview(year);

                setFiscalArray(response.data);
                setIsLoadingFiscals(false);
            } catch (e) {
                toast.error("No se pudieron obtener los fiscales.");
                setIsLoadingFiscals(false);
            }
        };

        fetchTaxpayers();
    }, [selectedYear]); // ✅ Se ejecuta cuando cambia el año seleccionado

    if (fiscalArray) fiscalArray.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));


    // Filtrar por nombre, rif o fiscal (user.name)
    const q = inputValue.trim().toLowerCase();
    const filteredFiscals = fiscalArray.filter(f => {
        return (
            f.name?.toLowerCase().includes(q) ||
            f.group?.name?.toLowerCase().includes(q) ||
            f.role.toLowerCase().includes(q) ||
            f.supervisor?.name.toLowerCase().includes(q)
        );
    });

    // Manejar submit de búsqueda
    const handleSearch = () => {
        setQuery(inputValue.trim());
    };

    // Manejar Enter en el input
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        isLoadingFiscals ? (
            <LoadingCircularComponent />
        ) : (
            <section className='w-full h-full pb-14 lg:pb-0'>
                {/* Header */}
                <div className='pt-4 pl-4'>
                    <h1 className='text-xl text-[#1F2937] font-semibold'>Revisión de Fiscales</h1>
                </div>

                {/* Container */}
                <div className='px-4 py-4'>
                    <div className='w-full h-full p-4 border border-gray-200 rounded-md shadow-xl'>

                        {/* Search input */}
                        <div className='w-full'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <h2 className='text-gray-500'>Buscar Fiscal</h2>
                                </div>
                            </div>

                            {/* ✅ CORRECCIÓN 2026: Agregado filtro de año */}
                            <div className='flex flex-col gap-3 pt-4'>
                                {/* Filtro de Año */}
                                <div className='w-full lg:w-[300px]'>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                                        Filtrar por Año
                                    </label>
                                    <select
                                        value={selectedYear === null ? '' : selectedYear}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setSelectedYear(value === '' ? null : parseInt(value, 10));
                                        }}
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3498DB]'
                                    >
                                        <option value="">Todos los años</option>
                                        <option value="2025">2025</option>
                                        <option value="2026">2026</option>
                                    </select>
                                </div>

                                {/* Barra de búsqueda */}
                                <div className='flex flex-col items-start w-full gap-2 lg:flex-row lg:items-center'>
                                    <div className='w-full lg:w-[90%] flex items-center gap-2 px-3 py-1 bg-white border rounded-md'>
                                        <CiSearch size={18} className="text-gray-500" />
                                        <input
                                            type="text"
                                            placeholder="Buscar por nombre, cédula, o grupo"
                                            className="flex-1 text-sm placeholder-gray-400 bg-transparent focus:outline-none"
                                            value={inputValue}
                                            onChange={e => setInputValue(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                        />
                                    </div>

                                    <div className='w-full lg:w-[10%]'>
                                        <button className='w-full px-4 py-1 bg-[#3498DB] text-white' onClick={handleSearch}>Buscar</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Map Filtered Fiscals */}
                        <div className='w-full h-full lg:h-[75vh] pt-4 overflow-y-auto'>

                            {/* Table Header (only on lg) */}
                            {/* Table Header (solo visible en pantallas grandes) */}
                            <div className='hidden w-full px-4 py-2 font-medium bg-gray-200 lg:flex rounded-t-md'>
                                <div className='flex-[1]'><p>Cédula</p></div>
                                <div className='flex-[2]'><p>Nombre</p></div>
                                <div className='flex-[1]'><p>Grupo</p></div>
                                <div className='flex-[1]'><p>Supervisor</p></div>
                                <div className='flex-[1] text-right'><p>Acción</p></div>
                            </div>

                            {/* Table Body */}
                            {filteredFiscals.filter(t => t.id && t.personId).map(fiscal => (
                                <div
                                    key={fiscal.id}
                                    className='flex flex-col w-full px-4 py-3 border-b border-l border-r lg:flex-row last:rounded-b-md'
                                >
                                    <div className='flex-[1]'><p>{fiscal.personId ? Number(fiscal.personId).toLocaleString() : "No se encontró la cédula"}</p></div>
                                    <div className='flex-[2]'><p>{fiscal.name ?? "No se encontró el nombre"}</p></div>
                                    <div className='flex-[1]'><p>{fiscal.group?.name ?? "No se encontró el grupo"}</p></div>
                                    <div className='flex-[1]'><p>{(fiscal.role === "FISCAL" && fiscal.supervisor?.name) ? fiscal.supervisor.name : fiscal.role === "SUPERVISOR" ? fiscal.name : "No se encontró el supervisor"}</p></div>
                                    <div className='flex-[1] flex justify-end mt-2 lg:mt-0'>
                                        <button
                                            className='px-3 py-1 text-xs font-medium border border-gray-300 lg:text-sm'
                                            onClick={() => {
                                                // ✅ CORRECCIÓN 2026: Pasar año seleccionado como query parameter
                                                // Si hay un año seleccionado, pasarlo para que la página de estadísticas lo use
                                                const yearParam = selectedYear !== null ? `?year=${selectedYear}` : '';
                                                navigate(`/fiscal-stats/${fiscal.id}${yearParam}`);
                                            }}
                                        >
                                            Ver Estadísticas
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>

            </section>

        )
    );
}

export default FiscalReviewComponent