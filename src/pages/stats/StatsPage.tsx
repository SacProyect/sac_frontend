import PageOneStats, { Stat } from '@/components/stats/PageOneStats'
import { FinesStat, PageTwoStats } from '@/components/stats/PageTwoStats'
import { getGlobalPerformance, getGlobalTaxpayerPerformance } from '@/components/utils/api/reportFunctions'
import { useAuth } from '@/hooks/useAuth'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

function StatsPage() {

    const { user } = useAuth();
    const navigate = useNavigate();
    const [rawStats, setRawStats] = useState<Stat[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [taxpayerPerformance, setTaxpayerPerformance] = useState<FinesStat | null>(null);



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
                    console.log(taxPerformance)

                    console.log("SUCCESFULLY LOADED")
                } else {
                    toast.error("No se encontraron estadísticas para algunos de los gráficos.");
                }
            } catch (e) {
                toast.error("Ha ocurrido un error obteniendo las estadísticas para algunos de los gráficos.");
            } finally {
                setLoaded(true);
            }
        };

        fetchStats();
    }, []);


    return (
        <div className='flex w-[84vw] h-full'>
            {!loaded ? (
                <div className='flex justify-center items-center w-full h-[90vh]'>
                    <p className='text-center  w-full text-2xl'>Cargando los datos, por favor espere.</p>
                </div>
            ) : (
                <>
                    <PageOneStats rawStats={rawStats} />
                    {taxpayerPerformance && <PageTwoStats finesStats={taxpayerPerformance} />}
                </>
            )}
        </div>
    )
}



export default StatsPage