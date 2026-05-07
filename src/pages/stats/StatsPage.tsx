import { ChartData } from '@/components/stats/GlobalPerfomance';
import { MonthlyIvaStats } from '@/components/stats/GlobalTaxpayerPerformance';
import {
    getGlobalPerformance,
    getGlobalTaxpayerPerformance,
    getGroupPerformance,
} from '@/components/utils/api/reportFunctions';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState, lazy, Suspense } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { GroupStat } from '@/components/stats/GroupPerformanceStats';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import StatisticsPage2 from './StatsPage2';
import StatisticsPage3 from './StatsPage3';
import { usePresentation } from '@/components/context/PresentationContext';
import LoadingCircularComponent from '@/components/UI/Loading/LoadingCircularComponent';

const PageOneStats = lazy(() => import('@/components/stats/GlobalPerfomance'));
const PageTwoStats = lazy(() => import('@/components/stats/GlobalTaxpayerPerformance').then(m => ({ default: m.PageTwoStats })));
const GroupPerformanceStats = lazy(() => import('@/components/stats/GroupPerformanceStats').then(m => ({ default: m.GroupPerformanceStats })));
const IvaByGroupChart = lazy(() => import('@/components/stats/IvaByGroupChart').then(m => ({ default: m.IvaByGroupChart })));

function StatsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [rawStats, setRawStats] = useState<ChartData[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [taxpayerPerformance, setTaxpayerPerformance] = useState<MonthlyIvaStats | null>(null);
    const [groupStats, setGroupStats] = useState<GroupStat[]>([]);

    const { currentPage, isAutoMode, goToPage, goToNextPage, goToPrevPage } = usePresentation();

    if (!user || (user.role !== 'ADMIN' && user.role !== "COORDINATOR")) {
        navigate('/login');
        return;
    }

    useEffect(() => {
        const fetchStats = async () => {
            setLoaded(false);
            try {
                const stats = await getGlobalPerformance(selectedYear);

                if (Array.isArray(stats) && stats.length > 0) {
                    const parsed: ChartData[] = stats.map((item: any) => ({
                        month: item.month,
                        realAmount: item.realAmount,
                        expectedAmount: item.expectedAmount,
                        taxpayersEmitted: item.taxpayersEmitted,
                    }));


                    setRawStats(parsed);
                    setTaxpayerPerformance(await getGlobalTaxpayerPerformance(selectedYear));
                    setGroupStats(await getGroupPerformance(selectedYear));
                } else {
                    setRawStats([]);
                    setTaxpayerPerformance(null);
                    setGroupStats([]);
                    toast.error('No se encontraron estadísticas para el año seleccionado.');
                }
            } catch (e: any) {
                toast.error(e);
            } finally {
                setLoaded(true);
            }
        };

        fetchStats();
    }, [selectedYear]);

    useEffect(() => {
        if (isAutoMode && currentPage === 1) {
            // Salta automáticamente a la página 2
            // Pero solo una vez, si aún está en la 1
            const event = new Event('jumpToAutoMode');
            window.dispatchEvent(event); // Puedes eliminar si no usas este evento
        }
    }, [isAutoMode]);

    const isMobile = window.innerWidth < 768;

    const renderPage = () => {
        if (currentPage === 1) {
            return (
                <>
                    <div className="flex flex-col lg:flex-wrap lg:flex-row w-full lg:w-[82vw] h-full  lg:h-[94.5vh] bg-[#1c1c1b]">

                        {/* GRAFICA 1 */}
                        <div className="w-full h-[70vh] p-2 lg:w-1/2 lg:h-1/2">
                            <Suspense fallback={<p className="text-lg text-center">Cargando estadísticas mensuales...</p>}>
                                {rawStats.length > 0 ? <PageOneStats chartData={rawStats} /> : <p>No hay estadísticas para mostrar</p>}
                            </Suspense>
                        </div>

                        {/* GRAFICA 2 */}
                        <div className="w-full h-[100vh] p-2 lg:w-1/2 lg:h-1/2">
                            {taxpayerPerformance && (
                                <Suspense fallback={<p className="text-lg text-center">Cargando desempeño individual...</p>}>
                                    {taxpayerPerformance !== null ? <PageTwoStats stats={taxpayerPerformance} /> : <p>No hay estadísticas para mostrar</p>}
                                </Suspense>
                            )}
                        </div>

                        {/* GRAFICA 3 */}
                        <div className="w-full h-[100vh] p-2 lg:w-1/2 lg:h-1/2">
                            {groupStats && (
                                <Suspense fallback={<p className="text-lg text-center">Cargando desempeño por coordinaciones...</p>}>
                                    {groupStats.length > 0 ? <GroupPerformanceStats groupStats={groupStats} /> : <p>No hay estadísticas para mostrar</p>}
                                </Suspense>
                            )}
                        </div>

                        {/* GRAFICA 4 */}
                        <div className="w-full h-[100vh] p-2 lg:w-1/2 lg:h-1/2">
                            <Suspense fallback={<p className="text-lg text-center">Cargando rendimiento de IVA por grupo...</p>}>
                                <IvaByGroupChart year={selectedYear} />
                            </Suspense>
                        </div>

                    </div>

                    {/* Solo visible en mobile: renderizar página 2 y 3 directamente debajo */}
                    <div className="block lg:hidden bg-[#1c1c1b] text-white">
                        {isMobile ? (
                            <div>
                                <StatisticsPage2 year={selectedYear} />
                                <StatisticsPage3 year={selectedYear} />
                            </div>
                        ) : (<></>)}
                    </div>

                    {/* Solo visible en mobile: renderizar página 2 y 3 directamente debajo */}
                    <div className="block lg:hidden bg-[#1c1c1b] text-white">
                        <StatisticsPage2 />
                        <StatisticsPage3 />
                    </div>
                </>
            );
        }

        if (currentPage === 2) {
            return (
                <div className="w-full lg:w-[82vw]  lg:h-[94.5vh] flex flex-col bg-[#1c1c1b] text-white">
                    <StatisticsPage2 year={selectedYear} />
                </div>
            )
        }

        if (currentPage === 3) {
            return (
                <div className="w-full lg:w-[82vw]  lg:h-[94.5vh] flex flex-col bg-[#1c1c1b] text-white">
                    <StatisticsPage3 year={selectedYear} />
                </div>

            )
        }

        return (
            <div className='w-full lg:w-[82vw] lg:h-[90.2vh] flex items-center justify-center text-white text-2xl'>
                Página {currentPage} - Próximamente más estadísticas...
            </div>
        );
    };

    const totalPages = 3;



    return (
        <div className="min-h-screen bg-[#292d33]">
            <div className='flex flex-col '>
                {!loaded ? (
                    <div className=''>
                        <LoadingCircularComponent />
                    </div>
                ) : (rawStats.length === 0 && !taxpayerPerformance && groupStats.length === 0) ? (
                    <div className='flex items-center justify-center w-[82vw] h-[100vh]'>
                        <p className='text-2xl font-semibold text-center text-gray-500'>No hay estadísticas para mostrar</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between px-8 py-4 bg-[#1c1c1b] border-b border-[#3a3a3a]">
                            <h1 className="text-2xl font-bold text-white">Panel de Estadísticas</h1>
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium text-gray-400">Seleccionar Año:</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="bg-[#2a2a2a] text-white border border-[#3a3a3a] rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#4a90e2] transition-all cursor-pointer hover:bg-[#333333]"
                                >
                                    {[2024, 2025, 2026].map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {renderPage()}
                        <div className="justify-center hidden py-1 space-x-4 lg:flex bg-[#1c1c1b]">
                            <button
                                onClick={goToPrevPage}
                                className="transition hover:scale-110 bg-[#2a2a2a] px-4 py-2 rounded-lg text-white flex items-center gap-2 border border-[#3a3a3a] hover:bg-[#3c3c3c]"
                            >
                                <ChevronLeft className="w-4 h-4" /> Anterior
                            </button>
                            {[...Array(totalPages)].map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToPage(index + 1)}
                                    className={`px-4 py-2 rounded-lg text-white border transition hover:scale-110 ${currentPage === index + 1 ? 'bg-[#4a90e2]' : 'bg-[#2a2a2a] border-[#3a3a3a] hover:bg-[#3c3c3c]'}`}
                                >
                                    {index + 1}
                                </button>
                            ))}
                            <button
                                onClick={goToNextPage}
                                className="transition hover:scale-110 bg-[#2a2a2a] px-4 py-2 rounded-lg text-white flex items-center gap-2 border border-[#3a3a3a] hover:bg-[#3c3c3c]"
                            >
                                Siguiente <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default StatsPage;
