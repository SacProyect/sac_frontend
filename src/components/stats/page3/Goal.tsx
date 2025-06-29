import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react'
import React from 'react'





function Goal() {


    const recaudacionComparacion = {
        esperada: 15750000,
        real: 12890000,
        diferencia: -18.16,
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-VE", {
            style: "currency",
            currency: "VES",
            minimumFractionDigits: 0,
        }).format(amount)
    }



    return (
        <div className="bg-[#2a2a29] border-[#3a3a39] text-white p-4 rounded-xl space-y-6">
            <div className="flex items-center gap-2 text-base font-semibold">
                <BarChart3 className="w-4 h-4 text-purple-500" />
                Recaudación Real vs Esperada
            </div>

            <div className="h-full space-y-4">
                {/* META ESPERADA */}
                <div className="p-2 border bg-gradient-to-r from-blue-600/20 to-blue-400/20 border-blue-500/50 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="mb-1 text-xs font-medium text-blue-300">META ESPERADA</div>
                            <div className="text-2xl font-bold text-blue-400">
                                {formatCurrency(recaudacionComparacion.esperada)}
                            </div>
                        </div>
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="h-2 mt-3 rounded-full bg-blue-900/30">
                        <div className="w-full h-2 bg-blue-500 rounded-full" />
                    </div>
                </div>

                {/* INDICADOR DE DIFERENCIA */}
                <div className="px-4 py-2 text-center border shadow-lg bg-gradient-to-r from-red-600 to-red-500 rounded-2xl border-red-400/30">
                    <div className="mb-1 text-3xl font-black text-white">
                        {recaudacionComparacion.diferencia.toFixed(1)}%
                    </div>
                    <div className="text-sm font-medium text-red-100">DÉFICIT</div>
                </div>

                {/* RECAUDACIÓN REAL */}
                <div className="p-2 border bg-gradient-to-r from-red-600/20 to-red-400/20 border-red-500/50 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="mb-1 text-xs font-medium text-red-300">RECAUDACIÓN REAL</div>
                            <div className="text-2xl font-bold text-red-400">
                                {formatCurrency(recaudacionComparacion.real)}
                            </div>
                        </div>
                        <div className="flex items-center justify-center w-12 h-12 bg-red-500 rounded-full">
                            <TrendingDown className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="h-2 mt-3 rounded-full bg-red-900/30">
                        <div
                            className="h-2 transition-all duration-1000 bg-red-500 rounded-full"
                            style={{
                                width: `${(recaudacionComparacion.real / recaudacionComparacion.esperada) * 100}%`,
                            }}
                        />
                    </div>
                </div>

                {/* INFORMACIÓN ADICIONAL */}
                <div className="bg-[#1a1a19] rounded-lg p-3 border border-gray-600/30">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Diferencia en monto:</span>
                        <span className="font-bold text-red-400">
                            -{formatCurrency(recaudacionComparacion.esperada - recaudacionComparacion.real)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Goal