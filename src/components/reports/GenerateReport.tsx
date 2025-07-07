import React, { useEffect, useState } from 'react';
import { CiSearch } from "react-icons/ci";
import { IoDocumentTextOutline } from "react-icons/io5";
import ReportModal from './ReportModal';
import { useAuth } from '@/hooks/useAuth';
import { Taxpayer } from '@/types/taxpayer';
import { useNavigate } from 'react-router-dom';
import { Event } from '@/types/event';
import { IVAReports } from '@/types/IvaReports';
import { GroupData } from '../contributions/ContributionTypes';
import { getContributions } from '../utils/api/reportFunctions';
import toast from 'react-hot-toast';



function GenerateReport() {
    const [showReportModal, setShowReportModal] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();
    // const [selectedTaxpayer, setSelectedTaxpayer] = useState<Taxpayer | null>(null);
    const [groupData, setGroupData] = useState<GroupData[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [query, setQuery] = useState("");
    const [isLoadingGroups, setIsLoadingGroups] = useState(true);

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


    let taxpayerArray: Taxpayer[] = [];

    if (!user) {
        navigate("/login")
        return null;
    }

    if (user.role === "ADMIN" || user.role === "FISCAL" || user.role === "SUPERVISOR") {
        taxpayerArray = user.taxpayer;
    } else if (user.role === "COORDINATOR") {
        taxpayerArray = user.coordinatedGroup.members ? user.coordinatedGroup.members.flatMap((member) => member.taxpayer || []) : [];
    }

    console.log(user.coordinatedGroup);

    // ✅ Filtrar los contribuyentes con process !== "FP"
    taxpayerArray = taxpayerArray.filter(t => t.process !== "FP");

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





    return (
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
                        <h2 className='text-gray-500'>Buscar contribuyente</h2>
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
                        {filteredTaxpayers.map(taxpayer => (
                            <div
                                key={taxpayer.id}
                                className='flex flex-col w-full px-4 py-2 border-b border-l border-r lg:flex-row last:rounded-br-md last:rounded-bl-md'
                            >
                                <div className='w-[120px]'><p>{taxpayer.rif}</p></div>
                                <div className='w-[120px]'><p>{taxpayer.emition_date.slice(0, 10)}</p></div>
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
                    </div>

                    {/* Group Reports Header */}
                    {user.role !== "FISCAL" && user.role !== "SUPERVISOR" && (
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
                                                <p className='text-xs text-gray-500'>{group.members.length || "No se encontró"}</p>
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

        </section>

    )
}

export default GenerateReport