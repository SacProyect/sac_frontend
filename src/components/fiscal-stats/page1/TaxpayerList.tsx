import { getFiscalTaxpayers } from "@/components/utils/api/reportFunctions";
import { useAuth } from "@/hooks/useAuth";
import { FiscalInfo, TaxpayersList } from "@/types/reports";
import { Building, Calendar, Download, MapPin } from "lucide-react"
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";



interface TaxpayerListProps {
    fiscalInfo: FiscalInfo;
    year: number;
}

function TaxpayerList({ fiscalInfo, year }: TaxpayerListProps) {
    const [taxpayersList, setTaxpayersList] = useState<TaxpayersList[]>();
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        navigate('/login')
        return;
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getFiscalTaxpayers(fiscalInfo.fiscalId, year);

                setTaxpayersList(response);

            } catch (e) {
                console.error("Error al obtener lista de contribuyentes:", e);
                toast.error("No se pudo obtener la lista de contribuyentes.", {
                    id: 'taxpayer-list-error',
                    duration: 3000
                });
            }
        }
        fetchData();
    }, [year])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-VE", {
            style: "currency",
            currency: "VES",
            minimumFractionDigits: 0,
        }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("es-VE")
    }

    const getFaseColor = (fase: string) => {
        switch (fase) {
            case "FASE_1":
                return "bg-red-600"
            case "FASE_2":
                return "bg-yellow-600"
            case "FASE_3":
                return "bg-green-600"
            default:
                return "bg-gray-600"
        }
    }


    return (
        <>
            <div className="bg-[#2a2a29] border-[#3a3a39] text-white rounded-xl lg:h-[40vh]">
                <div className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-2 pt-4 pl-4 text-base font-semibold">
                        <Building className="w-4 h-4 text-blue-500" />
                        Contribuyentes Asignados
                    </div>
                </div>
                <div className="pt-0">
                    <div id="contribuyentes-table" className="lg:h-[30vh] h-[39vh]  overflow-y-auto custom-scroll p-4">
                        <div className="space-y-2">
                            {taxpayersList && taxpayersList.map((taxpayer, index) => (
                                <div key={taxpayer.id} className="border border-[#3a3a39] bg-[#1a1a19] rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">{taxpayer.name}</div>
                                                <div className="text-xs text-gray-400">{taxpayer.rif}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-green-400">
                                                {formatCurrency(Number(taxpayer.totalCollected))}
                                            </div>
                                            <div className="text-xs text-gray-400">Total</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mb-2">
                                        {taxpayer.process === "AF" && (
                                            <p className={`${getFaseColor(taxpayer.fase)} text-white text-xs rounded-full px-2`}>{taxpayer.fase.replace("_", " ")}</p>
                                        )}
                                        {taxpayer.culminated && <p className="px-2 text-xs text-white bg-green-600 rounded-full">CULMINADO</p>}
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 text-xs lg:grid-cols-3">
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">IVA</div>
                                            <div className="font-bold text-[10px]">{formatCurrency(Number(taxpayer.collectedIva))}</div>
                                        </div>
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">ISLR</div>
                                            <div className="font-bold text-[10px]">{formatCurrency(Number(taxpayer.collectedIslr))}</div>
                                        </div>
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">Multas</div>
                                            <div className="font-bold text-orange-400 text-[10px]">{formatCurrency(Number(taxpayer.collectedFines))}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                        <MapPin className="w-3 h-3" />
                                        <span>{taxpayer.address}</span>
                                        <Calendar className="w-3 h-3 ml-2" />
                                        <span>{formatDate(taxpayer.emition_date.toString())}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default TaxpayerList