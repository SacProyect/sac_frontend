import { GlobalKPIResponse, } from '@/components/stats/GlobalKpiStats'

import { Stat } from '@/components/stats/PageOneStats'
import { CollectionStats } from '@/components/stats/PageTwoStats'
import { getGlobalKPI, getGlobalPerformance, getGlobalTaxpayerPerformance, getGroupPerformance } from '@/components/utils/api/reportFunctions'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState, lazy, Suspense } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { GroupStat } from "@/components/stats/GroupPerformanceStats"


const PageOneStats = lazy(() => import('@/components/stats/PageOneStats'));
const PageTwoStats = lazy(() => import('@/components/stats/PageTwoStats').then(m => ({ default: m.PageTwoStats })));
const GroupPerformanceStats = lazy(() => import('@/components/stats/GroupPerformanceStats').then(m => ({ default: m.GroupPerformanceStats })));
const GlobalKPIStats = lazy(() => import('@/components/stats/GlobalKpiStats').then(m => ({ default: m.GlobalKPIStats })));


function StatsPage() {

    const { user } = useAuth();
    const navigate = useNavigate();
    const [rawStats, setRawStats] = useState<Stat[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [taxpayerPerformance, setTaxpayerPerformance] = useState<CollectionStats | null>(null);
    const [groupStats, setGroupStats] = useState<GroupStat[]>([]);
    const [globalKpi, setGlobalKpi] = useState<GlobalKPIResponse | null>(null);




    if (!user || user.role !== "ADMIN") {
        navigate("/login");
        return;
    }


    useEffect(() => {
        const fetchStats = async () => {
            try {
                const stats = await getGlobalPerformance();

                if (Array.isArray(stats) && stats.length > 0) {
                    const parsed: Stat[] = stats.map((item: any) => ({
                        month: item.month,
                        ivaAmount: item.ivaAmount ?? 0,
                        islrAmount: item.islrAmount ?? 0,
                        complianceRate: item.complianceRate ?? 0,
                        globalIndex: item.globalIndex ?? 0,
                        previousIndex: item.previousIndex ?? null,
                        percentageChange: item.percentageChange ?? null,
                    }));

                    setRawStats(parsed);
                    setTaxpayerPerformance(await getGlobalTaxpayerPerformance());
                    setGroupStats(await getGroupPerformance());
                    setGlobalKpi(await getGlobalKPI());
                } else {
                    toast.error('No se encontraron estadísticas para algunos de los gráficos.');
                }
            } catch (e: any) {
                toast.error(e);
            } finally {
                setLoaded(true);
            }
        };

        fetchStats();
    }, []);




    return (
        <div className='flex flex-col'>
            {!loaded ? (
                <div className='flex items-center justify-center w-[82vw] h-[100vh]'>
                    <p className='w-full text-3xl text-center'>Cargando los datos, por favor espere.</p>
                </div>
            ) : (
                (rawStats.length === 0 && !taxpayerPerformance && groupStats.length === 0 && !globalKpi) ? (
                    <div className='flex items-center justify-center w-[82vw] h-[100vh]'>
                        <p className='text-2xl font-semibold text-center text-gray-500'>No hay estadísticas para mostrar</p>
                    </div>
                ) : (
                    <div>
                        <div className='flex lg:flex-row flex-col w-full h-[100vh] lg:w-[82vw] lg:h-[50vh] bg-[#1c1c1b]'>
                            <div className='w-full h-full lg:w-[41vw] lg:h-[50vh]'>
                                <Suspense fallback={<p className="text-lg text-center">Cargando estadísticas mensuales...</p>}>
                                    {rawStats.length > 0 ? (
                                        <PageOneStats rawStats={rawStats} />
                                    ) : <p>No hay estadísticas para mostrar</p>
                                    }

                                </Suspense>
                            </div>
                            <div className='w-full h-[60vh] lg:w-[41vw] lg:h-[50vh]'>
                                {taxpayerPerformance && (
                                    <Suspense fallback={<p className="text-lg text-center">Cargando desempeño individual...</p>}>
                                        {taxpayerPerformance !== null ? (
                                            <PageTwoStats stats={taxpayerPerformance} />
                                        ) : <p className=''>No hay estadísticas para mostrar</p>}
                                    </Suspense>
                                )}
                            </div>
                        </div>

                        <div className='flex lg:flex-row flex-col w-full lg:w-[82vw] lg:h-[50vh] pt-10 lg:pt-0 bg-[#1c1c1b] pb-16'>
                            <div className='w-full h-[70vh] lg:w-[41vw] lg:h-[50vh]'>
                                {groupStats && (
                                    <Suspense fallback={<p className="text-lg text-center">Cargando desempeño por grupos...</p>}>
                                        {groupStats.length > 0 ? (
                                            <GroupPerformanceStats groupStats={groupStats} />
                                        ) : <p>No hay estadísticas para mostrar</p>}

                                    </Suspense>
                                )}
                            </div>
                            <div className='w-full h-[70vh] lg:w-[41vw] lg:h-[50vh]'>
                                {globalKpi && (
                                    <Suspense fallback={<p className="text-lg text-center">Cargando KPIs globales...</p>}>
                                        <GlobalKPIStats globalKpi={globalKpi} />
                                    </Suspense>
                                )}
                            </div>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}



export default StatsPage