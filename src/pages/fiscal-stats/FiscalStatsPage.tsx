"use client"
import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import FiscalStatsPage1 from "./FiscalStatsPage1"
import FiscalStatsPage2 from "./FiscalStatsPage2"
import { useAuth } from "@/hooks/useAuth"
import { getFiscalInfo } from "@/components/utils/api/reportFunctions"
import { useNavigate, useParams } from "react-router-dom"
import toast from "react-hot-toast"
import { FiscalInfo } from "@/types/reports"
import FiscalStatsPage3 from "./FiscalStatsPage3"

export default function FiscalStatsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { fiscalId } = useParams();

    if (!user) {
        navigate('/login')
        return;
    }

    useEffect(() => {
        if (user.role === "FISCAL" && user.id !== fiscalId) {
            toast.error("No puede acceder a esta página.")
            navigate("/")
        }
    }, [])

    const [currentPage, setCurrentPage] = useState(1);
    const [fiscalInfo, setFiscalInfo] = useState<FiscalInfo>();
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getFiscalInfo(fiscalId || user.id, selectedYear);
 fix/filtro-2025
                // console.log(response);

> main
                setFiscalInfo(response);
            } catch (e) {
                console.error("Error al cargar información del fiscal:", e);
                toast.error("No se pudieron cargar las estadísticas del fiscal. Por favor, intente de nuevo.", {
                    duration: 4000,
                    id: 'fiscal-stats-error' // Previene duplicados
                });
            }
        }
        fetchData();
    }, [selectedYear])

    const totalPages = 3;

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page)
    }

    const nextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1)
    }

    const prevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1)
    }

    const renderPageContent = () => {
        if (!fiscalInfo) return <div>Loading...</div>;

        switch (currentPage) {
            case 1: return <FiscalStatsPage1 fiscalData={fiscalInfo} fiscalId={fiscalId} year={selectedYear} />;
            case 2: return <FiscalStatsPage2 fiscalData={fiscalInfo} fiscalId={fiscalId} year={selectedYear} />;
            case 3: return <FiscalStatsPage3 fiscalData={fiscalInfo} fiscalId={fiscalId} year={selectedYear} />;
            default: return null;
        }
    }

    return (
        <div className="w-full lg:w-[82vw] h-full lg:h-[100vh] flex flex-col bg-[#1c1c1b] text-white">
       
         fix/filtro-2025
            {/* Header con selector de año */
            {/* Filtro de Año */
              
              main
            <div className="flex items-center justify-between px-8 py-4 bg-[#1c1c1b] border-b border-[#3a3a3a]">
                <h1 className="text-2xl font-bold text-white">Estadísticas del Fiscal</h1>
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
 fix/filtro-2025


 main
            {/* Render en mobile: ambas páginas */}
            <div className="block space-y-4 lg:hidden">
                {fiscalInfo && (
                    <>
                        <FiscalStatsPage1 fiscalData={fiscalInfo} fiscalId={fiscalId} year={selectedYear} />
                        <FiscalStatsPage2 fiscalData={fiscalInfo} fiscalId={fiscalId} year={selectedYear} />
                        <FiscalStatsPage3 fiscalData={fiscalInfo} fiscalId={fiscalId} year={selectedYear} />
                    </>
                )}
            </div>

            {/* Render en desktop con paginación */}
            <div className="hidden lg:block">
                {renderPageContent()}
            </div>

            {/* Paginación solo en lg */}
            <div className="justify-center hidden py-2 space-x-4 lg:flex bg-[#1c1c1b]">
                <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="transition hover:scale-110 bg-[#2a2a2a] px-4 py-2 rounded-lg text-white flex items-center gap-2 border border-[#3a3a3a] hover:bg-[#3c3c3c] disabled:opacity-50 disabled:cursor-not-allowed"
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
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="transition hover:scale-110 bg-[#2a2a2a] px-4 py-2 rounded-lg text-white flex items-center gap-2 border border-[#3a3a3a] hover:bg-[#3c3c3c] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
