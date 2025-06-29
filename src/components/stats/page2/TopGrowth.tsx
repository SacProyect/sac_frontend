import { getMonthlyGrowth } from '@/components/utils/api/reportFunctions';
import { BestGrowth } from '@/types/stats';
import { Download, TrendingUp } from 'lucide-react'
import React, { useEffect, useState } from 'react'


function TopGrowth() {
    const [coordinatorGrowth, setCoordinatorGrowth] = useState<BestGrowth[]>([]);

    useEffect(() => {
        const fetchCoordinatorGrowth = async () => {
            try {
                const response = await getMonthlyGrowth();

                const transformed = response.data
                    .map((item: any) => ({
                        coordinatorName: `Coordinador: ${item.coordinatorName}`,
                        groupName: item.groupName,
                        currentMonth: Number(item.currentMonth),
                        previousMonth: Number(item.previousMonth),
                        growthPercentage: Number(item.growthPercentage),
                    }))
                    .sort((a: BestGrowth, b: BestGrowth) => b.growthPercentage - a.growthPercentage); // Orden descendente

                setCoordinatorGrowth(transformed);
            } catch (e) {
                console.error(e);
                throw new Error("No se pudo obtener el crecimiento estadístico de los coordinadores.");
            }
        };

        fetchCoordinatorGrowth();
    }, []);



    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-VE", {
            style: "currency",
            currency: "VES",
            minimumFractionDigits: 0,
        }).format(amount)
    }

    const downloadPDF = (tableId: string, fileName: string) => {
        if (!coordinatorGrowth.length) return;

        const format = (amount: number) =>
            new Intl.NumberFormat("es-VE", {
                style: "currency",
                currency: "VES",
                minimumFractionDigits: 0,
            }).format(amount);

        const tablesHTML = coordinatorGrowth.map((c) => `
                <div class="group-block">
                    <h2 class="group-title">${c.groupName}</h2>
                    <p class="coordinator-name"><strong>Coordinador:</strong> ${c.coordinatorName}</p>
                    <p class="growth">📈 <strong>Crecimiento:</strong> ${c.growthPercentage.toFixed(2)}%</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Mes Anterior</th>
                                <th>Mes Actual</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${format(Number(c.previousMonth))}</td>
                                <td>${format(Number(c.currentMonth))}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `).join("<br>");

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
                            color: #2f855a;
                            text-transform: uppercase;
                        }
                        .group-title {
                            font-size: 18px;
                            font-weight: 600;
                            margin-bottom: 4px;
                            color: #319795;
                        }
                        .coordinator-name, .growth {
                            margin: 4px 0;
                            font-size: 14px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            font-size: 14px;
                            margin-top: 10px;
                            margin-bottom: 25px;
                        }
                        th, td {
                            border: 1px solid #ccc;
                            padding: 10px;
                            text-align: center;
                        }
                        th {
                            background-color: #f5f5f5;
                            font-weight: bold;
                            color: #333;
                        }
                        tr:nth-child(even) {
                            background-color: #fafafa;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">${fileName.replace(".pdf", "").replace(/-/g, " ").toUpperCase()}</div>
                    ${tablesHTML}
                </body>
                </html>
            `);
        win.document.close();
        win.print();
    };


    return (
        <>
            <div className="bg-[#2a2a29] border-[#3a3a39] rounded-md text-white">
                <div className="flex flex-row items-center justify-between pb-4 lg:pr-4">
                    <div className="flex items-center justify-center gap-2 text-lg font-semibold lg:pt-4 lg:pl-4">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        Coordinadores - Crecimiento Mensual
                    </div>
                    <div className='pt-4'>
                        <button
                            onClick={() => downloadPDF("coordinador-table", "coordinadores-crecimiento.pdf")}
                            className="px-2 py-2 text-white bg-blue-600 border-blue-600 rounded-md hover:bg-blue-700"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div>
                    <div id="coordinador-table" className="h-[270px] overflow-y-auto custom-scroll p-4">
                        <div className="pb-4 space-y-3">
                            {coordinatorGrowth && coordinatorGrowth.map((coordinator, index) => (
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
                                                <div className="font-medium">{coordinator.coordinatorName}</div>
                                                <div className="text-sm text-gray-400">{coordinator.groupName}</div>
                                            </div>
                                        </div>
                                        <div className={`text-right ${index === 0 ? "text-green-400" : "text-blue-400"}`}>
                                            <div className="text-xl font-bold">+{coordinator.growthPercentage.toFixed(2)}%</div>
                                            <div className="text-sm">Crecimiento</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="bg-[#2a2a29] rounded-md p-3">
                                            <div className="mb-1 text-gray-400">Mes Anterior</div>
                                            <div className="font-bold">{formatCurrency(Number(coordinator.previousMonth))}</div>
                                        </div>
                                        <div className="bg-[#2a2a29] rounded-md p-3">
                                            <div className="mb-1 text-gray-400">Mes Actual</div>
                                            <div className="font-bold text-green-400">{formatCurrency(Number(coordinator.currentMonth))}</div>
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