import { Download, TrendingUp } from 'lucide-react'
import React from 'react'


const coordinatorGrowth = [
    { name: "Coordinador Grupo 4", group: "Grupo 4", currentMonth: 1250000, previousMonth: 1050000, growth: 19.05 },
    { name: "Coordinador Grupo 2", group: "Grupo 2", currentMonth: 1180000, previousMonth: 1020000, growth: 15.69 },
    { name: "Coordinador Grupo 6", group: "Grupo 6", currentMonth: 1150000, previousMonth: 1000000, growth: 15.0 },
    { name: "Coordinador Grupo 1", group: "Grupo 1", currentMonth: 1120000, previousMonth: 980000, growth: 14.29 },
    { name: "Coordinador Grupo 5", group: "Grupo 5", currentMonth: 1090000, previousMonth: 960000, growth: 13.54 },
    { name: "Coordinador Grupo 3", group: "Grupo 3", currentMonth: 1060000, previousMonth: 940000, growth: 12.77 },
]




function TopGrowth() {




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
            <div className="bg-[#2a2a29] border-[#3a3a39] rounded-md text-white">
                <div className="flex flex-row items-center justify-between pb-4 lg:pr-4">
                    <div className="flex items-center justify-center gap-2 text-lg font-semibold lg:pt-4 lg:pl-4">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        Coordinadores - Crecimiento Mensual
                    </div>
                    <div className='pt-4'>
                        <div
                            onClick={() => downloadPDF("coordinador-table", "coordinadores-crecimiento.pdf")}
                            className="px-2 py-2 text-white bg-blue-600 border-blue-600 rounded-md hover:bg-blue-700"
                        >
                            <Download className="w-4 h-4" />
                        </div>
                    </div>
                </div>
                <div>
                    <div id="coordinador-table" className="h-[270px] overflow-y-auto custom-scroll p-4">
                        <div className="space-y-3">
                            {coordinatorGrowth.map((coordinator, index) => (
                                <div
                                    key={index}
                                    className={`border rounded-lg p-4 ${index === 0 ? "border-green-500 bg-green-900/20" : "border-[#3a3a39] bg-[#1a1a19]"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? "bg-green-500 text-black" : "bg-blue-600 text-white"
                                                    }`}
                                            >
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="font-medium">{coordinator.name}</div>
                                                <div className="text-sm text-gray-400">{coordinator.group}</div>
                                            </div>
                                        </div>
                                        <div className={`text-right ${index === 0 ? "text-green-400" : "text-blue-400"}`}>
                                            <div className="text-xl font-bold">+{coordinator.growth.toFixed(2)}%</div>
                                            <div className="text-sm">Crecimiento</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="bg-[#2a2a29] rounded-md p-3">
                                            <div className="mb-1 text-gray-400">Mes Anterior</div>
                                            <div className="font-bold">{formatCurrency(coordinator.previousMonth)}</div>
                                        </div>
                                        <div className="bg-[#2a2a29] rounded-md p-3">
                                            <div className="mb-1 text-gray-400">Mes Actual</div>
                                            <div className="font-bold text-green-400">{formatCurrency(coordinator.currentMonth)}</div>
                                        </div>
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

export default TopGrowth