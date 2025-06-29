import { getTopFiveByGroup } from '@/components/utils/api/reportFunctions';
import { TopFiveFiscalsByGroup } from '@/types/stats'
import { Download, Users } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast';




function TopFiveFiscals() {
    const [fiscalsByGroup, setFiscalsByGroup] = useState<TopFiveFiscalsByGroup[]>();

    useEffect(() => {
        const fetchTopFiveByGroup = async () => {
            try {
                const response = await getTopFiveByGroup();

                const dataObject = response.data;

                // Transformar y ordenar
                const transformedData = Object.entries(dataObject)
                    .map(([groupName, fiscals]: any) => {
                        const parsedFiscals = fiscals.map((f: any) => ({
                            name: f.name,
                            total: Number(f.totalCollected),
                        }));

                        const groupTotal = parsedFiscals.reduce((acc: number, f: any) => acc + f.total, 0);

                        return {
                            name: groupName,
                            fiscals: parsedFiscals,
                            totalCollected: groupTotal,
                        };
                    })
                    .sort((a, b) => b.totalCollected - a.totalCollected); // Orden descendente

                setFiscalsByGroup(transformedData);
            } catch (e) {
                toast.error("No se pudieron obtener los mejores fiscales de cada grupo.");
            }
        };

        fetchTopFiveByGroup();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-VE", {
            style: "currency",
            currency: "VES",
            minimumFractionDigits: 0,
        }).format(amount)
    }

    const downloadPDF = (tableId: string, fileName: string) => {
        // Función para descargar como PDF (implementación básica)
        const element = document.getElementById(tableId)
        if (element) {
            window.print()
        }
    }


    return (
        <>
            <div className="bg-[#2a2a29] border-[#3a3a39] rounded-md text-white h-[40vh]">
                <div className="flex flex-row items-center justify-between pb-4 lg:pr-4">
                    <div className="flex items-center justify-center gap-2 text-lg font-semibold lg:pt-4 lg:pl-4">
                        <Users className="w-5 h-5 text-purple-500" />
                        Top 5 Fiscales por Grupo
                    </div>
                    <div className='pt-4'>
                        <div
                            onClick={() => downloadPDF("fiscales-grupo-table", "top-fiscales-por-grupo.pdf")}
                            className="px-2 py-2 text-white bg-blue-600 border-blue-600 rounded-md hover:bg-blue-700"
                        >
                            <Download className="w-4 h-4 rounded-md" />
                        </div>
                    </div>
                </div>
                <div>
                    <div id="fiscales-grupo-table" className="h-[285px] overflow-y-auto custom-scroll p-4 ">
                        <div className="space-y-4 lg:pb-8">
                            {fiscalsByGroup?.map((group, index) => (
                                <div key={index} className="border border-[#3a3a39] rounded-lg p-4">
                                    <h3 className="mb-3 font-semibold text-purple-400">{group.name}</h3>
                                    <div className="space-y-2">
                                        {group.fiscals.map((fiscal: any, i: number) => (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between py-2 px-3 bg-[#1a1a19] rounded-md"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-purple-600 text-white" : "bg-gray-600 text-white"
                                                            }`}
                                                    >
                                                        {i + 1}
                                                    </div>
                                                    <span className="font-medium">{fiscal.name}</span>
                                                </div>
                                                <span className="font-bold text-green-400">{formatCurrency(fiscal.total)}</span>
                                            </div>
                                        ))}
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

export default TopFiveFiscals