import { GlobalKPIStats, KPIStat } from '@/components/stats/GlobalKpiStats'
import { GroupPerformanceStats } from '@/components/stats/GroupPerformanceStats'
import PageOneStats, { Stat } from '@/components/stats/PageOneStats'
import { FinesStat, PageTwoStats } from '@/components/stats/PageTwoStats'
import { getGlobalKPI, getGlobalPerformance, getGlobalTaxpayerPerformance, getGroupPerformance } from '@/components/utils/api/reportFunctions'
import { useAuth } from '@/hooks/useAuth'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import {GroupStat} from "@/components/stats/GroupPerformanceStats"


function StatsPage() {

    const { user } = useAuth();
    const navigate = useNavigate();
    const [rawStats, setRawStats] = useState<Stat[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [taxpayerPerformance, setTaxpayerPerformance] = useState<FinesStat | null>(null);
    const [groupStats, setGroupStats] = useState<GroupStat[]>([]);
    const [globalKpi, setGlobalKpi] = useState<KPIStat[]>([]);



    if (!user || user.role !== "ADMIN") {
        navigate("/login");
        return;
    }

    const monthMap = {
        January: "Enero",
        February: "Febrero",
        March: "Marzo",
        April: "Abril",
        May: "Mayo",
        June: "Junio",
        July: "Julio",
        August: "Agosto",
        September: "Septiembre",
        October: "Octubre",
        November: "Noviembre",
        December: "Diciembre",
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const stats = await getGlobalPerformance();

                if (stats && typeof stats === "object" && Object.keys(stats).length > 0) {
                    const parsed: Stat[] = Object.entries(stats).map(([monthEn, values]: any) => ({
                        month: monthMap[monthEn as keyof typeof monthMap],
                        paid: values.paid,
                        total: values.fines,
                        collected: values.collected,
                        lastYear: values.lastYear,
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
                <div className='flex items-center justify-center w-[84vw] h-[90vh]'>
                    <p className='w-full text-3xl text-center'>Cargando los datos, por favor espere.</p>
                </div>
            ) : (
                <div className='  '>
                    <div className='flex  w-[84vw] h-[50vh]'>
                        <PageOneStats rawStats={rawStats} />
                        {taxpayerPerformance && <PageTwoStats finesStats={taxpayerPerformance} />}
                    </div>
                    <div className='flex w-[84vw] h-[50vh]'>
                        {groupStats && <GroupPerformanceStats groupStats={groupStats} />}
                        {globalKpi && <GlobalKPIStats globalKpi={globalKpi} />}
                    </div>
                </div>
            )}
        </div>
    )
}



export default StatsPage