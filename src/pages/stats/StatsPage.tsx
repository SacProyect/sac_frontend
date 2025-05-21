import { GlobalKPIResponse, GlobalKPIStats, KPIStat } from '@/components/stats/GlobalKpiStats'
import { GroupPerformanceStats } from '@/components/stats/GroupPerformanceStats'
import PageOneStats, { Stat } from '@/components/stats/PageOneStats'
import { CollectionStats, PageTwoStats } from '@/components/stats/PageTwoStats'
import { getGlobalKPI, getGlobalPerformance, getGlobalTaxpayerPerformance, getGroupPerformance } from '@/components/utils/api/reportFunctions'
import { useAuth } from '@/hooks/useAuth'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { GroupStat } from "@/components/stats/GroupPerformanceStats"


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
                    // Ensure all Stat fields are present
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


                    const taxPerformance = await getGlobalTaxpayerPerformance()

                    setTaxpayerPerformance(taxPerformance)

                    const groupPerformance = await getGroupPerformance()

                    setGroupStats(groupPerformance);

                    const kpi = await getGlobalKPI();

                    setGlobalKpi(kpi);


                } else {
                    toast.error("No se encontraron estadísticas para algunos de los gráficos.");
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
        <div className='flex flex-col '>
            {!loaded ? (
                <div className='flex items-center justify-center w-[82vw] h-[100vh] lg:w-[82vw]  lg:h-[100vh]'>
                    <p className='w-full text-3xl text-center'>Cargando los datos, por favor espere.</p>
                </div>
            ) : (
                <div className=''>
                    <div className='flex lg:flex-row flex-col w-full h-[100vh]  lg:w-[82vw] lg:h-[50vh] bg-[#1c1c1b]'>

                        <div className='w-full h-full lg:w-[41vw] lg:h-[50vh]'>
                            <PageOneStats rawStats={rawStats} />
                        </div>
                        <div className='w-full h-[60vh] lg:w-[41vw] lg:h-[50vh]'>
                            {taxpayerPerformance && <PageTwoStats stats={taxpayerPerformance} />}
                        </div>
                    </div>
                    <div className='flex lg:flex-row flex-col w-full lg:w-[82vw] lg:h-[50vh] pt-10 lg:pt-0 bg-[#1c1c1b] pb-16'>
                        <div className='w-full h-[70vh] lg:w-[41vw] lg:h-[50vh]'>
                            {groupStats && <GroupPerformanceStats groupStats={groupStats} />}
                        </div>

                        <div className='w-full h-[70vh] lg:w-[41vw] lg:h-[50vh]'>
                            {globalKpi && <GlobalKPIStats globalKpi={globalKpi} />}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}



export default StatsPage