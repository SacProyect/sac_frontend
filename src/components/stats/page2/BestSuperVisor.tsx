import { getBestSupervisors } from '@/components/utils/api/reportFunctions'
import { GroupData } from '@/types/stats'
import { Award, Download, Trophy } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useRef } from 'react';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { usePresentation } from '@/components/context/PresentationContext'
import { exportSupervisorsExcel } from '@/components/utils/stats/exportSupervisorsExcel'




function BestSuperVisor() {
    const [supervisorData, setSupervisorData] = useState<GroupData[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollReady, setScrollReady] = useState(false);
    const { currentPage } = usePresentation();



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
                setScrollReady(true);

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
        if (!supervisorData.length) return;

        const format = (val: number | string) =>
            new Intl.NumberFormat("es-VE", {
                style: "currency",
                currency: "VES",
                minimumFractionDigits: 0,
            }).format(Number(val));

        let htmlTables = supervisorData
            .map(group => {
                const best = group.supervisors.find(s => s.name === group.best);
                const worst = group.supervisors.find(s => s.name === group.worse);

                const row = (label: string, s?: any, color = "#111") => `
                <tr>
                    <td><strong style="color:${color}">${label}</strong></td>
                    <td>${s?.name || "-"}</td>
                    <td>${format(s?.collectedIva || 0)}</td>
                    <td>${format(s?.collectedIslr || 0)}</td>
                    <td>${format(s?.collectedFines || 0)}</td>
                    <td>${format(s?.total || 0)}</td>
                </tr>`;

                return `
                <div class="group-table">
                    <h2>${group.name}</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Cargo</th>
                                <th>Nombre</th>
                                <th>IVA</th>
                                <th>ISLR</th>
                                <th>Multas</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${row("Mejor Supervisor", best, "#2f855a")}
                            ${row("Menor Supervisor", worst, "#c53030")}
                        </tbody>
                    </table>
                </div>`;
            })
            .join("<br/>");

        const win = window.open("", "_blank");
        if (!win) return;

        win.document.write(`
        <html>
        <head>
        <title>${fileName}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 40px;
                background: white;
                color: black;
            }
            .header {
                font-size: 22px;
                font-weight: 700;
                text-align: center;
                margin-bottom: 30px;
                color: #2b6cb0;
                text-transform: uppercase;
            }
            .group-table {
                margin-bottom: 40px;
            }
            h2 {
                font-size: 18px;
                color: #2c5282;
                margin-bottom: 10px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 14px;
            }
            th, td {
                border: 1px solid #ccc;
                padding: 10px;
                text-align: center;
            }
            th {
                background-color: #f7fafc;
                font-weight: bold;
                color: #333;
            }
            tr:nth-child(even) {
                background-color: #f9f9f9;
            }
        </style>
        </head>
        <body>
            <div class="header">${fileName.replace(".pdf", "").replace(/-/g, " ").toUpperCase()}</div>
            ${htmlTables}
        </body>
        </html>
    `);
        win.document.close();
        win.print();
    };

    useAutoScroll(scrollRef, "supervisor-table", scrollReady && currentPage === 2);


    return (
        <>
            <div className="bg-[#2a2a29] border-[#3a3a39] rounded-md text-white lg:h-full">
                <div className="flex flex-row items-center justify-between pb-4 pr-4 lg:pb-0">
                    <div className="flex items-center justify-center gap-2 pt-4 pl-4 text-lg font-semibold">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        Mejor Supervisor por Grupos
                    </div>
                    <div className='flex pt-4 space-x-2'>
                        <button
                            onClick={() => downloadPDF("supervisor-table", "supervisores-por-grupo.pdf")}
                            className="px-2 py-2 text-white bg-blue-600 border-blue-600 rounded-md hover:bg-blue-700"
                        >
                            <Download className="w-4 h-4" />
                        </button>

                        {/* Botón Excel */}
                        <button
                            onClick={() =>
                                exportSupervisorsExcel(supervisorData, "supervisores-por-grupo")
                            }
                            className="px-2 py-2 text-white bg-green-600 border-green-600 rounded-md hover:bg-green-700"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div>
                    <div id="supervisor-table" className="h-[40vh] lg:h-[40vh] overflow-y-auto custom-scroll p-4" ref={scrollRef}>
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
                                        <div className="grid grid-cols-2 gap-2 text-sm lg:grid-cols-4">
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
                                        <div className="grid grid-cols-2 gap-2 text-sm lg:grid-cols-4">
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