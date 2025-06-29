import { getBestSupervisors } from '@/components/utils/api/reportFunctions'
import { GroupData } from '@/types/stats'
import { Award, Download, Trophy } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

// Datos de ejemplo
// const supervisorData = [
//     {
//         group: "Grupo 1",
//         best: { name: "Ana García", iva: 125000, islr: 85000, multas: 15000, total: 225000 },
//         worst: { name: "Carlos López", iva: 95000, islr: 65000, multas: 8000, total: 168000 },
//     },
//     {
//         group: "Grupo 2",
//         best: { name: "María Rodríguez", iva: 135000, islr: 90000, multas: 18000, total: 243000 },
//         worst: { name: "José Martínez", iva: 88000, islr: 60000, multas: 7000, total: 155000 },
//     },
//     {
//         group: "Grupo 3",
//         best: { name: "Luis Fernández", iva: 118000, islr: 82000, multas: 12000, total: 212000 },
//         worst: { name: "Carmen Silva", iva: 92000, islr: 58000, multas: 9000, total: 159000 },
//     },
//     {
//         group: "Grupo 4",
//         best: { name: "Roberto Díaz", iva: 142000, islr: 95000, multas: 20000, total: 257000 },
//         worst: { name: "Elena Morales", iva: 85000, islr: 55000, multas: 6000, total: 146000 },
//     },
//     {
//         group: "Grupo 5",
//         best: { name: "Patricia Vega", iva: 128000, islr: 87000, multas: 16000, total: 231000 },
//         worst: { name: "Miguel Torres", iva: 90000, islr: 62000, multas: 8500, total: 160500 },
//     },
//     {
//         group: "Grupo 6",
//         best: { name: "Andrea Ruiz", iva: 132000, islr: 89000, multas: 17000, total: 238000 },
//         worst: { name: "David Herrera", iva: 87000, islr: 57000, multas: 7500, total: 151500 },
//     },
// ]

function BestSuperVisor() {
    const [supervisorData, setSupervisorData] = useState<GroupData[]>([]);

    useEffect(() => {
        const fetchSupervisors = async () => {
            try {
                const response = await getBestSupervisors();

                const dataObject = response.data;

                const transformedData = Object.entries(dataObject).map(([groupName, groupData]: any) => {
                    const bestSupervisor = groupData.supervisors.find((s: any) => s.name === groupData.best);
                    const worseSupervisor = groupData.supervisors.find((s: any) => s.name === groupData.worse);

                    const bestTotal = bestSupervisor ? Number(bestSupervisor.total) : 0;
                    const worseTotal = worseSupervisor ? Number(worseSupervisor.total) : 0;
                    const combinedTotal = bestTotal + worseTotal;

                    return {
                        name: groupName,
                        best: groupData.best,
                        worse: groupData.worse,
                        supervisors: groupData.supervisors,
                        combinedTotal,
                    };
                });

                // Ordenar de mayor a menor por combinedTotal
                transformedData.sort((a, b) => b.combinedTotal - a.combinedTotal);

                setSupervisorData(transformedData);
            } catch (e: any) {
                console.error(e);
                toast.error("No se pudieron obtener los mejores supervisores.");
            }
        };

        fetchSupervisors();
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
            <div className="bg-[#2a2a29] border-[#3a3a39] rounded-md text-white ">
                <div className="flex flex-row items-center justify-between pb-4 lg:pr-4">
                    <div className="flex items-center justify-center gap-2 text-lg font-semibold lg:pt-4 lg:pl-4">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        Mejor Supervisor por Grupos
                    </div>
                    <div className='pt-4'>
                        <div
                            onClick={() => downloadPDF("supervisor-table", "supervisores-por-grupo.pdf")}
                            className="px-2 py-2 text-white bg-blue-600 border-blue-600 rounded-md hover:bg-blue-700"
                        >
                            <Download className="w-4 h-4" />
                        </div>
                    </div>
                </div>
                <div>
                    <div id="supervisor-table" className="h-[400px] overflow-y-auto custom-scroll p-4">
                        <div className="space-y-4">
                            {supervisorData && supervisorData?.map((group, index) => (
                                <div key={index} className="border border-[#3a3a39] rounded-lg p-4">
                                    <h3 className="mb-3 font-semibold text-blue-400">{group.name}</h3>

                                    {/* Mejor supervisor */}
                                    <div className="p-3 mb-2 border rounded-md bg-green-900/20 border-green-700/30">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Award className="w-4 h-4 text-green-400" />
                                            <span className="font-medium text-green-400">Mejor: {group.best}</span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 text-sm">
                                            <div>
                                                <span className="text-gray-400">IVA:</span>
                                                <div className="text-xs font-medium">{formatCurrency(Number(group.supervisors.find(s => s.name === group.best)?.collectedIva || 0))}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">ISLR:</span>
                                                <div className="text-xs font-medium">{formatCurrency(Number(group.supervisors.find(s => s.name === group.best)?.collectedIslr || 0))}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Multas:</span>
                                                <div className="text-xs font-medium">{formatCurrency(Number(group.supervisors.find(s => s.name === group.best)?.collectedFines || 0))}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Total:</span>
                                                <div className="text-xs font-bold text-green-400">{formatCurrency(Number(group.supervisors.find(s => s.name === group.best)?.total || 0))}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Peor supervisor */}
                                    <div className="p-3 border rounded-md bg-red-900/20 border-red-700/30">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-medium text-red-400">Menor: {group.worse}</span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 text-sm">
                                            <div>
                                                <span className="text-gray-400">IVA:</span>
                                                <div className="text-xs font-medium">{formatCurrency(Number(group.supervisors.find(s => s.name === group.worse)?.collectedIva || 0))}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">ISLR:</span>
                                                <div className="text-xs font-medium">{formatCurrency(Number(group.supervisors.find(s => s.name === group.worse)?.collectedIslr || 0))}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Multas:</span>
                                                <div className="text-xs font-medium">{formatCurrency(Number(group.supervisors.find(s => s.name === group.worse)?.collectedFines || 0))}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Total:</span>
                                                <div className="text-xs font-bold text-red-400">{formatCurrency(Number(group.supervisors.find(s => s.name === group.worse)?.total || 0))}</div>
                                            </div>
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

export default BestSuperVisor