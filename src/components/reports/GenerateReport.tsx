import React, { useEffect, useState } from 'react';
import { CiSearch } from "react-icons/ci";
import { IoDocumentTextOutline } from "react-icons/io5";
import { useAuth } from '@/hooks/useAuth';
import { Taxpayer } from '@/types/taxpayer';
import { useNavigate } from 'react-router-dom';
import { GroupData } from '../contributions/ContributionTypes';
import { getContributions } from '../utils/api/reportFunctions';
import toast from 'react-hot-toast';
import CompleteReportModal from './CompleteReportModal';
import { getTaxpayerForEvents } from '../utils/api/taxpayerFunctions';



function GenerateReport() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [groupData, setGroupData] = useState<GroupData[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [query, setQuery] = useState("");
    const [isLoadingGroups, setIsLoadingGroups] = useState(true);
    const [showCompleteReport, setShowCompleteReport] = useState(false);
    const [taxpayerArray, setTaxpayerArray] = useState<Taxpayer[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMorePages, setHasMorePages] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        const fetchGroups = async () => {
            setIsLoadingGroups(true); // ⏳ Empieza a cargar
            try {

                const response = await getContributions();

                setGroupData(response);

            } catch (e) {
                console.error(e);
                if (user.role !== "FISCAL") {
                    toast.error("No se pudieron obtener los grupos, por favor, recargue la página e intente de nuevo.")
                }
            } finally {
                setIsLoadingGroups(false); // ✅ Finaliza carga
            }
        }
        fetchGroups();
    }, [user])


    if (!user) {
        navigate("/login");
        return null;
    }

    useEffect(() => {
        const fetchTaxpayers = async () => {
            try {
                const response = await getTaxpayerForEvents(currentPage, 50);
                const filtered = response.data.data.filter((t: Taxpayer) => t.process !== "FP");
                
                if (currentPage === 1) {
                    setTaxpayerArray(filtered);
                } else {
                    setTaxpayerArray(prev => [...prev, ...filtered]);
                }
                
                setHasMorePages(response.data.page < response.data.totalPages);
            } catch (e) {
                toast.error("No se pudieron obtener los contribuyentes.");
            }
        };

        fetchTaxpayers();
    }, [currentPage]);

    const loadMoreTaxpayers = async () => {
        if (!hasMorePages || isLoadingMore) return;
        setIsLoadingMore(true);
        setCurrentPage(prev => prev + 1);
        setIsLoadingMore(false);
    };

    if (groupData) {
        groupData.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Filtrar por nombre, rif o fiscal (user.name)
    const q = inputValue.trim().toLowerCase();
    const filteredTaxpayers = taxpayerArray.filter(t => {
        return (
            t.name?.toLowerCase().includes(q) ||
            t.rif?.toLowerCase().includes(q) ||
            t.user.name.toLowerCase().includes(q)
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

    // console.log(filteredTaxpayers);



    return (
        isLoadingGroups ? (
            <section className="w-full h-full lg:h-[100vh] flex items-center justify-center">
                <div className="flex flex-col items-center text-gray-600">
                    <svg className="w-8 h-8 mb-4 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <p className="text-sm font-medium">Cargando información...</p>
                </div>
            </section>
        ) : (
            <section className='w-full h-full pb-14 lg:pb-0'>
                {/* Header */}
                <div className='pt-4 pl-4'>
                    <h1 className='text-xl text-[#1F2937] font-semibold'>Generar Reportes</h1>
                </div>

                {/* Container */}
                <div className='px-4 py-4'>
                    <div className='w-full h-full p-4 border border-gray-200 rounded-md shadow-xl'>

                        {/* Search input */}
                        <div className='w-full'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <h2 className='text-gray-500'>Buscar contribuyente</h2>
                                </div>
                                {user.role !== "FISCAL" && (
                                    <div>
                                        <button className='px-2 py-1 bg-[#3498DB] text-white' onClick={() => setShowCompleteReport(!showCompleteReport)}>Generar Reporte completo</button>
                                    </div>
                                )}
                            </div>

                            <div className='flex flex-col items-start w-full gap-2 pt-4 lg:flex-row lg:items-center'>

                                <div className='w-full lg:w-[90%] flex items-center gap-2 px-3 py-1 bg-white border rounded-md'>
                                    <CiSearch size={18} className="text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre, RIF o nombre del FISCAL"
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

                        {/* Map Filtered Taxpayers */}
                        <div className='w-full h-[48vh] pt-4 overflow-y-auto'>

                            {/* Table Header (only on lg) */}
                            <div className='items-center hidden w-full px-4 py-1 font-medium bg-gray-200 lg:flex rounded-tr-md rounded-tl-md'>
                                <div className='w-[120px]'><p>RIF</p></div>
                                <div className='w-[120px]'><p>Fecha</p></div>
                                <div className='w-[420px]'><p>Nombre</p></div> {/* que se expanda más */}
                                <div className='w-[150px]'><p>FISCAL</p></div>
                                <div className='w-[100px] flex justify-end'><p>Acción</p></div>
                            </div>

                            {/* Table Body */}
                            {filteredTaxpayers.filter(t => t.id && t.rif).map(taxpayer => (
                                <div
                                    key={taxpayer.id}
                                    className='flex flex-col w-full px-4 py-2 border-b border-l border-r lg:flex-row last:rounded-br-md last:rounded-bl-md'
                                >
                                    <div className='w-[120px]'><p>{taxpayer.rif ? taxpayer.rif : "No se encontró el rif"}</p></div>
                                    <div className='w-[120px]'><p>{taxpayer.emition_date ? taxpayer.emition_date.slice(0, 10) : "No se encontró la fecha de emisión"}</p></div>
                                    <div className='w-[420px]'><p>{taxpayer.name ?? "No se encontró el nombre"}</p></div>
                                    <div className='w-[150px]'><p>{taxpayer.user?.name ?? "No se encontró el nombre"}</p></div>
                                    <div className='flex justify-end w-full lg:w-[120px]'>
                                        <button
                                            className='p-1 px-2 m-0 text-xs font-medium border border-gray-200 lg:text-sm'
                                            onClick={() => navigate(`/reports/gen/${taxpayer.id}`)}
                                        >
                                            Ver Reporte
                                        </button>
                                    </div>
                                </div>
                            ))}
                            
                            {/* Botón Cargar Más */}
                            {hasMorePages && (
                                <div className="flex justify-center w-full p-4">
                                    <button
                                        type="button"
                                        onClick={loadMoreTaxpayers}
                                        disabled={isLoadingMore}
                                        className="flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoadingMore && (
                                            <svg className="w-4 h-4 animate-spin shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                        )}
                                        {isLoadingMore ? 'Cargando...' : 'Cargar más contribuyentes'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Group Reports Header */}
                        {user.role !== "FISCAL" && (
                            <>
                                <div className='pt-4 space-y-2'>
                                    <h2 className='font-semibold text-gray-500'>Reportes por grupo</h2>
                                    <p className='text-xs text-gray-500'>Seleccione un grupo para generar un reporte completo</p>
                                </div>

                                {/* Generate Group Report */}
                                <div className='flex flex-col gap-2 pt-4 lg:grid lg:grid-cols-3 lg:gap-y-2 lg:gap-x-2'>
                                    {isLoadingGroups ? (
                                        <p className="text-sm text-gray-500">Cargando grupos...</p>
                                    ) : groupData.length === 0 ? (
                                        <p className="text-sm text-red-500">No se encontraron grupos.</p>
                                    ) : (
                                        groupData.map((group) => (
                                            <div className='w-full h-[4rem] flex border rounded-md px-4 items-center justify-between' key={group.id}>
                                                <div className='w-[90%]'>
                                                    <p className='text-sm font-semibold text-gray-500'>{group.name || "No se encontró"}</p>
                                                    <p className='text-xs text-gray-500'>
                                                        {group.members?.length > 0 ? `${group.members.length} miembros` : "No se encontró"}
                                                    </p>
                                                </div>
                                                <div className='w-[10%] flex items-center'>
                                                    <button
                                                        className='p-2 text-blue-600 bg-blue-300 rounded-full'
                                                        onClick={() => navigate(`/getGroupReport/${group.id}`)}
                                                    >
                                                        <IoDocumentTextOutline size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}



                    </div>
                </div>

                {showCompleteReport && (
                    <CompleteReportModal
                        groups={groupData}
                        onClose={() => setShowCompleteReport(false)}
                    />
                )}

            </section>

        )
    );
}

export default GenerateReport