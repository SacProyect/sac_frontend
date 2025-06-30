"use client"
import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import FiscalStatsPage1 from "./FiscalStatsPage1"
import FiscalStatsPage2 from "./FiscalStatsPage2"
import { useAuth } from "@/hooks/useAuth"
import { getFiscalInfo } from "@/components/utils/api/reportFunctions"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { FiscalInfo } from "@/types/reports"

export default function FiscalStatsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        navigate('/login')
        return;
    }

    const [currentPage, setCurrentPage] = useState(1);
    const [fiscalInfo, setFiscalInfo] = useState<FiscalInfo>();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getFiscalInfo(user.id);
                setFiscalInfo(response);
            } catch (e) {
                console.error(e);
                toast.error("No se pudo obtener la información del fiscal.")
            }
        }
        fetchData();
    }, [])

    const totalPages = 2;

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
            case 1: return <FiscalStatsPage1 fiscalData={fiscalInfo} />;
            case 2: return <FiscalStatsPage2 fiscalData={fiscalInfo} />;
            default: return null;
        }
    }

    return (
        <div className="w-full lg:w-[82vw] flex flex-col bg-[#1c1c1b] text-white">
            {/* Render en mobile: ambas páginas */}
            <div className="block lg:hidden space-y-4">
                {fiscalInfo && (
                    <>
                        <FiscalStatsPage1 fiscalData={fiscalInfo} />
                        <FiscalStatsPage2 fiscalData={fiscalInfo} />
                    </>
                )}
            </div>

            {/* Render en desktop con paginación */}
            <div className="hidden lg:block">
                {renderPageContent()}
            </div>

            {/* Paginación solo en lg */}
            <div className="hidden lg:flex items-center justify-center gap-2 py-2 bg-[#1c1c1b]">
                <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="text-white hover:bg-[#3a3a39] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Anterior
                </button>

                {[1, 2].map((page) => (
                    <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-1 rounded ${currentPage === page ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-[#3a3a39]"} text-white`}
                    >
                        {page}
                    </button>
                ))}

                <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="text-white hover:bg-[#3a3a39] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                    Siguiente
                    <ChevronRight className="w-4 h-4 ml-1" />
                </button>
            </div>
        </div>
    )
}
