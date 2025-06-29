import { Download, TrendingUp } from 'lucide-react'
import React from 'react'

const topFiscales = [
    { name: "Carlos Mendoza", total: 285000, iva: 165000, islr: 95000, multas: 25000 },
    { name: "Sofía Castillo", total: 272000, iva: 158000, islr: 89000, multas: 25000 },
    { name: "Fernando Jiménez", total: 265000, iva: 152000, islr: 88000, multas: 25000 },
    { name: "Lucía Ramírez", total: 258000, iva: 148000, islr: 85000, multas: 25000 },
    { name: "Diego Vargas", total: 251000, iva: 145000, islr: 81000, multas: 25000 },
    { name: "Valentina Cruz", total: 244000, iva: 142000, islr: 77000, multas: 25000 },
    { name: "Andrés Moreno", total: 237000, iva: 138000, islr: 74000, multas: 25000 },
    { name: "Isabella Guerrero", total: 230000, iva: 135000, islr: 70000, multas: 25000 },
    { name: "Sebastián Peña", total: 223000, iva: 132000, islr: 66000, multas: 25000 },
    { name: "Camila Ortiz", total: 216000, iva: 128000, islr: 63000, multas: 25000 },
    { name: "Mateo Delgado", total: 209000, iva: 125000, islr: 59000, multas: 25000 },
    { name: "Emilia Santos", total: 202000, iva: 122000, islr: 55000, multas: 25000 },
]


function TopFiscal() {



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
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        Top Fiscales - Ranking General
                    </div>
                    <div className='pt-4'>
                        <div
                            onClick={() => downloadPDF("fiscales-table", "top-fiscales-general.pdf")}
                            className="px-2 py-2 text-white bg-blue-600 border-blue-600 rounded-md hover:bg-blue-700"
                        >
                            <Download className="w-4 h-4 rounded-md" />
                        </div>
                    </div>
                </div>
                <div>
                    <div id="fiscales-table" className="h-[400px] overflow-y-auto custom-scroll p-4">
                        <div className="space-y-2">
                            {topFiscales.map((fiscal, index) => (
                                <div
                                    key={index}
                                    className={`border rounded-lg p-3 ${index === 0
                                        ? "border-yellow-500 bg-yellow-900/20"
                                        : index === 1
                                            ? "border-gray-400 bg-gray-900/20"
                                            : index === 2
                                                ? "border-orange-500 bg-orange-900/20"
                                                : "border-[#3a3a39] bg-[#1a1a19]"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0
                                                    ? "bg-yellow-500 text-black"
                                                    : index === 1
                                                        ? "bg-gray-400 text-black"
                                                        : index === 2
                                                            ? "bg-orange-500 text-black"
                                                            : "bg-blue-600 text-white"
                                                    }`}
                                            >
                                                {index + 1}
                                            </div>
                                            <span className="font-medium">{fiscal.name}</span>
                                        </div>
                                        <span className="font-bold text-green-400">{formatCurrency(fiscal.total)}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-sm text-gray-400 ml-11">
                                        <div>IVA: {formatCurrency(fiscal.iva)}</div>
                                        <div>ISLR: {formatCurrency(fiscal.islr)}</div>
                                        <div>Multas: {formatCurrency(fiscal.multas)}</div>
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

export default TopFiscal