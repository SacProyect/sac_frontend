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
        if (!fiscalsByGroup?.length) return;

        const format = (val: number | string) =>
            new Intl.NumberFormat("es-VE", {
                style: "currency",
                currency: "VES",
                minimumFractionDigits: 0,
            }).format(Number(val));

        const tablesHTML = fiscalsByGroup.map((group) => {
            const rows = group.fiscals.map((fiscal, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${fiscal.name}</td>
                        <td>${format(fiscal.total)}</td>
                    </tr>
                `).join("");

            return `
                    <div class="group-table">
                        <h2 class="group-title">${group.name}</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Nombre</th>
                                    <th>Total Recaudado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                    </div>
                `;
        }).join("<br>");

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
                            color: #6b46c1;
                            text-transform: uppercase;
                        }
                        .group-title {
                            font-size: 18px;
                            font-weight: 600;
                            margin-bottom: 8px;
                            color: #4c51bf;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            font-size: 14px;
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
            <div className="bg-[#2a2a29] border-[#3a3a39] rounded-md text-white h-[60vh] lg:h-[45vh]">
                <div className="flex flex-row items-center justify-between pb-4 lg:pb-0 pr-4">
                    <div className="flex items-center justify-center gap-2 text-lg font-semibold pt-4 pl-4">
                        <Users className="w-5 h-5 text-purple-500" />
                        Top 5 Fiscales por Grupo
                    </div>
                    <div className='pt-4'>
                        <button
                            onClick={() => downloadPDF("fiscales-grupo-table", "top-fiscales-por-grupo.pdf")}
                            className="px-2 py-2 text-white bg-blue-600 border-blue-600 rounded-md hover:bg-blue-700"
                        >
                            <Download className="w-4 h-4 rounded-md" />
                        </button>
                    </div>
                </div>
                <div>
                    <div id="fiscales-grupo-table" className="lg:h-[35vh] h-[48vh] overflow-y-auto custom-scroll p-4 ">
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