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

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        const fetchGroups = async () => {

            try {

                const response = await getContributions();

                setGroupData(response);

            } catch (e) {
                console.error(e);
                toast.error("No se pudieron obtener los grupos, por favor, recargue la página e intente de nuevo.")
            }
        }
        fetchGroups();
    }, [user])


    let taxpayerArray: Taxpayer[] = [];

    if (!user) {
        navigate("/login")
        return null;
    }

    if (user.role === "ADMIN" || user.role === "FISCAL") {
        taxpayerArray = user.taxpayer;
    } else if (user.role === "COORDINATOR") {
        taxpayerArray = user.coordinatedGroup.members ? user.coordinatedGroup.members.flatMap((member) => member.taxpayer || []) : [];
    }

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
        <section className='w-full h-full'>

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
                        <div className='flex items-center w-full pt-4'>
                            <div className='w-[90%] flex items-center gap-2 px-3 py-1 bg-white border rounded-md'>
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
                            <div className='lg:w-[5%] px-4'>
                                <button className='px-4 py-1 bg-[#3498DB] text-white' onClick={handleSearch}>Buscar</button>
                            </div>
                        </div>
                    </div>

                    {/* Map Filtered Taxpayers */}
                    <div className='w-full h-[48vh] pt-4 overflow-y-auto'>
                        {/* Table Header */}
                        <div className='flex items-center w-full px-4 py-1 font-medium bg-gray-200 rounded-tr-md rounded-tl-md'>
                            <div className='w-1/3'>
                                <p>RIF</p>
                            </div>
                            <div className='w-1/3'>
                                <p>Nombre</p>
                            </div>
                            <div className='w-1/3'>
                                <p>FISCAL</p>
                            </div>
                            <div className='flex justify-end w-1/3'>
                                <p>Acción</p>
                            </div>
                        </div>

                        {/* Table Body */}
                        {filteredTaxpayers.map(taxpayer => (
                            <div
                                key={taxpayer.id}
                                className='flex w-full px-2 py-2 border-b border-l border-r last:rounded-br-md last:rounded-bl-md'
                            >
                                <div className='w-1/3'><p className='p-1'>{taxpayer.rif || "No encontrado"}</p></div>
                                <div className='w-1/3'><p className='p-1'>{taxpayer.name || "No encontrado"}</p></div>
                                <div className='w-1/3'><p className='p-1'>{taxpayer.user.name || "No encontrado"}</p></div>
                                <div className='flex justify-end w-1/3'>
                                    <button
                                        className='p-1 px-2 m-0 font-medium border border-gray-200'
                                        onClick={() => navigate(`/reports/gen/${taxpayer.id}`)}
                                    >
                                        Ver Reporte
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Group Reports Header*/}
                    <div className='pt-4 space-y-2'>
                        <h2 className='font-semibold text-gray-500'>Reportes por grupo</h2>
                        <p className='text-xs text-gray-500'>Seleccione un grupo para generar un reporte completo</p>
                    </div>

                    {/* Generate Group Report */}
                    <div className='grid w-full grid-cols-3 pt-4 gap-y-2 gap-x-2'>

                        {groupData.map((group) => (
                            <div className='w-full h-[4rem] flex border rounded-md px-4 items-center justify-between' key={group.id}>
                                <div className='w-[90%] '>
                                    <p className='font-semibold text-gray-500'>{group.name || "No se encontró"}</p>
                                    <p className='text-xs text-gray-500'>{group.members.length || "No se encontró"}</p>
                                </div>
                                <div className='w-[10%] flex items-center'>
                                    <button className='p-2 text-blue-600 bg-blue-300 rounded-full' onClick={() => navigate(`/getGroupReport/${group.id}`)}>
                                        <IoDocumentTextOutline size={15} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>

        </section>
    )
}

export default GenerateReport