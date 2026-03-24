import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CiSearch } from "react-icons/ci";
import { IoDocumentTextOutline } from "react-icons/io5";
import { useAuth } from '@/hooks/use-auth';
import { Taxpayer } from '@/types/taxpayer';
import { useNavigate } from 'react-router-dom';
import { GroupData } from '../contributions/contribution-types';
import { getContributions } from '../utils/api/report-functions';
import toast from 'react-hot-toast';
import CompleteReportModal from './complete-report-modal';
import { getTaxpayerForEvents } from '../utils/api/taxpayer-functions';
import { useCachedTaxpayersForEvents } from '@/hooks/useCachedData';

function GenerateReport() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [groupData, setGroupData] = useState<GroupData[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [searchDebounce, setSearchDebounce] = useState("");
    const [query, setQuery] = useState("");
    const [isLoadingGroups, setIsLoadingGroups] = useState(true);
    const [showCompleteReport, setShowCompleteReport] = useState(false);
    const [searchResults, setSearchResults] = useState<Taxpayer[] | null>(null);
    const [searchAdditionalPages, setSearchAdditionalPages] = useState<Taxpayer[]>([]);
    const [searchPage, setSearchPage] = useState(2);
    const [searchTotalPages, setSearchTotalPages] = useState(1);
    const [searchLoading, setSearchLoading] = useState(false);
    const [additionalPages, setAdditionalPages] = useState<Taxpayer[]>([]);
    const [currentPage, setCurrentPage] = useState(2);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);

    const { taxpayersForEvents: firstPageTaxpayers, totalPages } = useCachedTaxpayersForEvents(50);
    const firstPageFiltered = useMemo(
        () => (firstPageTaxpayers || []).filter((t: Taxpayer) => t.process !== "FP"),
        [firstPageTaxpayers]
    );
    const isSearching = searchDebounce.trim() !== '';
    const displayedFirst = isSearching ? (searchResults ?? []) : firstPageFiltered;
    const displayedExtra = isSearching ? searchAdditionalPages : additionalPages;
    const totalPagesDisplayed = isSearching ? searchTotalPages : totalPages;
    const hasMorePages = isSearching
        ? searchPage <= totalPagesDisplayed
        : currentPage <= totalPagesDisplayed;
    const taxpayerArray = useMemo(
        () => [...displayedFirst, ...displayedExtra],
        [displayedFirst, displayedExtra]
    );
    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        const fetchGroups = async () => {
            setIsLoadingGroups(true); 
            try {
                const response = await getContributions();
                setGroupData(response);
            } catch (e) {
                console.error(e);
                if (user.role !== "FISCAL") {
                    toast.error("No se pudieron obtener los grupos, por favor, recargue la página e intente de nuevo.")
                }
            } finally {
                setIsLoadingGroups(false);
            }
        }
        fetchGroups();
    }, [navigate, user])

    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearchDebounce(inputValue);
        }, 500);
        return () => clearTimeout(timeout);
    }, [inputValue]);

    useEffect(() => {
        const term = searchDebounce.trim();
        if (term === '') {
            setSearchResults(null);
            setSearchAdditionalPages([]);
            setSearchPage(2);
            return;
        }
        let cancelled = false;
        const fetchSearchFirst = async () => {
            setSearchLoading(true);
            try {
                const response = await getTaxpayerForEvents(1, 50, term);
                if (cancelled) return;
                const data = (response?.data?.data ?? []) as Taxpayer[];
                const filtered = data.filter((t: Taxpayer) => t.process !== "FP");
                setSearchResults(filtered);
                setSearchTotalPages(response?.data?.totalPages ?? 1);
                setSearchAdditionalPages([]);
                setSearchPage(2);
            } catch (e) {
                if (!cancelled) toast.error("No se pudieron obtener los contribuyentes.");
            } finally {
                if (!cancelled) setSearchLoading(false);
            }
        };
        fetchSearchFirst();
        return () => { cancelled = true; };
    }, [searchDebounce]);

    useEffect(() => {
        if (!isSearching && currentPage <= 2) return;
        if (isSearching) return;
        const fetchPage = async () => {
            // This useEffect was incomplete in the original file (cut off by merge marker logic)
            // But it seems it was meant to trigger something when currentPage changes.
            // However, loadMoreTaxpayers is defined later.
        };
        fetchPage();
    }, [currentPage, isSearching]);

    const loadMoreTaxpayers = useCallback(async () => {
        if (!hasMorePages || isLoadingMore) return;
        setIsLoadingMore(true);
        const term = searchDebounce.trim() || undefined;
        const pageToFetch = isSearching ? searchPage : currentPage;
        try {
            const response = await getTaxpayerForEvents(pageToFetch, 50, term);
            const data = (response?.data?.data ?? []) as Taxpayer[];
            const filtered = data.filter((t: Taxpayer) => t.process !== "FP");
            if (isSearching) {
                setSearchAdditionalPages(prev => [...prev, ...filtered]);
                setSearchPage(prev => prev + 1);
            } else {
                setAdditionalPages(prev => (pageToFetch === 2 ? filtered : [...prev, ...filtered]));
                setCurrentPage(prev => prev + 1);
            }
        } catch (e) {
            toast.error("No se pudieron cargar más contribuyentes.");
        } finally {
            setIsLoadingMore(false);
        }
    }, [hasMorePages, isLoadingMore, searchDebounce, isSearching, searchPage, currentPage]);

    const handleScroll = useCallback(() => {
        const el = listRef.current;
        if (!el || !hasMorePages || isLoadingMore) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        const threshold = 60;
        if (scrollTop + clientHeight >= scrollHeight - threshold) {
            loadMoreTaxpayers();
        }
    }, [hasMorePages, isLoadingMore, loadMoreTaxpayers]);

    if (!user) return null;

    if (groupData) {
        groupData.sort((a, b) => a.name.localeCompare(b.name));
    }

    const handleSearch = () => {
        setQuery(inputValue.trim());
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

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
                    <h1 className='text-xl text-white font-semibold'>Generar Reportes</h1>
                </div>

                {/* Container */}
                <div className='px-4 py-4'>
                    <div className='w-full h-full p-4 border border-slate-700/50 rounded-xl shadow-xl bg-slate-900/40 backdrop-blur-md'>

                        <div className='w-full'>
                            <div className='flex items-center justify-between mb-4'>
                                <div>
                                    <h2 className='text-slate-400 font-medium'>Buscar contribuyente</h2>
                                </div>
                                {user.role !== "FISCAL" && (
                                    <div>
                                        <button 
                                            className='px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all' 
                                            onClick={() => setShowCompleteReport(!showCompleteReport)}
                                        >
                                            Generar Reporte completo
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className='flex flex-col items-start w-full gap-2 pt-4 lg:flex-row lg:items-center'>

                                <div className='w-full lg:w-[90%] flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 transition-all'>
                                    <CiSearch size={20} className="text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre, RIF o nombre del FISCAL"
                                        className="flex-1 text-sm text-white placeholder-slate-500 bg-transparent focus:outline-none"
                                        value={inputValue}
                                        onChange={e => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                    />
                                </div>

                                <div className='w-full lg:w-[10%]'>
                                    <button 
                                        className='w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold border border-slate-700 transition-all' 
                                        onClick={handleSearch}
                                    >
                                        Buscar
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div 
                            ref={listRef}
                            onScroll={handleScroll}
                            className='w-full h-[40vh] mt-6 overflow-y-auto custom-scrollbar border border-slate-800 rounded-xl bg-slate-950/20'
                        >

                            <div className='sticky top-0 z-10 items-center hidden w-full px-6 py-3 font-bold bg-slate-800/90 backdrop-blur text-slate-400 text-[10px] uppercase tracking-widest lg:flex border-b border-slate-700/50'>
                                <div className='w-[150px]'><p>RIF</p></div>
                                <div className='w-[130px]'><p>Fecha</p></div>
                                <div className='flex-1'><p>Nombre</p></div>
                                <div className='w-[180px]'><p>FISCAL</p></div>
                                <div className='w-[120px] flex justify-end'><p>Acción</p></div>
                            </div>

                            {taxpayerArray.filter(t => t.id && t.rif).length === 0 ? (
                                <div className="flex items-center justify-center h-full text-slate-500 text-sm italic">
                                    No se encontraron contribuyentes
                                </div>
                            ) : (
                                taxpayerArray.filter(t => t.id && t.rif).map(taxpayer => (
                                    <div
                                        key={taxpayer.id}
                                        className='flex flex-col w-full px-6 py-4 border-b border-slate-800/50 lg:flex-row hover:bg-white/5 transition-colors group'
                                    >
                                        <div className='w-[150px] text-slate-300 font-mono text-xs'>{taxpayer.rif}</div>
                                        <div className='w-[130px] text-slate-400 text-xs'>{taxpayer.emition_date ? taxpayer.emition_date.slice(0, 10) : "N/A"}</div>
                                        <div className='flex-1 text-slate-200 font-medium truncate pr-4'>{taxpayer.name}</div>
                                        <div className='w-[180px] text-slate-400 text-xs'>{taxpayer.user?.name || "N/A"}</div>
                                        <div className='flex justify-end w-full lg:w-[120px] mt-2 lg:mt-0'>
                                            <button
                                                className='px-3 py-1.5 text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-lg hover:bg-indigo-500 hover:text-white transition-all'
                                                onClick={() => navigate(`/gen-reports/${taxpayer.id}`)}
                                            >
                                                Ver Reporte
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                            
                            {isLoadingMore && (
                                <div className="p-6 flex justify-center items-center gap-3">
                                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cargando más contribuyentes...</p>
                                </div>
                            )}
                        </div>

                        {user.role !== "FISCAL" && (
                            <>
                                <div className='mt-8 mb-4'>
                                    <h2 className='font-bold text-white text-lg'>Reportes por grupo</h2>
                                    <p className='text-xs text-slate-400'>Seleccione un grupo para generar un reporte completo consolidado</p>
                                </div>

                                <div className='flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:gap-4'>
                                    {isLoadingGroups ? (
                                        <p className="text-sm text-slate-500">Cargando grupos...</p>
                                    ) : groupData.length === 0 ? (
                                        <p className="text-sm text-rose-400">No se encontraron grupos configurados.</p>
                                    ) : (
                                        groupData.map((group) => (
                                            <div 
                                                className='w-full bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between hover:border-slate-500 transition-all group' 
                                                key={group.id}
                                            >
                                                <div className='w-[80%]'>
                                                    <p className='text-sm font-bold text-slate-200 group-hover:text-white transition-colors'>{group.name}</p>
                                                    <p className='text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-semibold'>
                                                        {group.members?.length || 0} Miembros
                                                    </p>
                                                </div>
                                                <button
                                                    className='w-10 h-10 flex items-center justify-center bg-indigo-500/10 text-indigo-400 rounded-full hover:bg-indigo-500 hover:text-white transition-all shadow-lg shadow-black/20'
                                                    onClick={() => navigate(`/getGroupReport/${group.id}`)}
                                                >
                                                    <IoDocumentTextOutline size={18} />
                                                </button>
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

export default GenerateReport;
