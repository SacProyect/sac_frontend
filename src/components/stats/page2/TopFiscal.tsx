import { usePresentation } from '@/components/context/PresentationContext'
import { getTopFiscals } from '@/components/utils/api/reportFunctions'
import { exportTopFiscalsExcel } from '@/components/utils/stats/exportTopFiscalsExcel'
import { useAutoScroll } from '@/hooks/useAutoScroll'
import { TopFiscals } from '@/types/stats'
import { Download, TrendingUp } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'




interface TopFiscalProps {
    year?: number;
}

function TopFiscal({ year }: TopFiscalProps) {
    const { currentPage } = usePresentation();
    const [topFiscals, setTopFiscals] = useState<TopFiscals[]>();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollReady, setScrollReady] = useState(false);


    useEffect(() => {
        const fetchFiscals = async () => {

            try {

                const response = await getTopFiscals(year);

                setTopFiscals(response.data);
                setScrollReady(true);

            } catch (e) {
                console.error(e);
                toast.error("No se pudo obtener el top de fiscales.")
            }
        }
        fetchFiscals()
    }, [year])



    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-VE", {
            style: "currency",
            currency: "VES",
            minimumFractionDigits: 0,
        }).format(amount)
    }

    const downloadPDF = (tableId: string, fileName: string) => {
        if (!topFiscals?.length) return;

        const format = (val: number | string) =>
            new Intl.NumberFormat("es-VE", {
                style: "currency",
                currency: "VES",
                minimumFractionDigits: 0,
            }).format(Number(val));

        const tableRows = topFiscals.map((f, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${f.name}</td>
                <td>${format(f.collectedIva)}</td>
                <td>${format(f.collectedIslr)}</td>
                <td>${format(f.collectedFines)}</td>
                <td>${format(f.total)}</td>
            </tr>`).join('');

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
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Nombre</th>
                            <th>IVA</th>
                            <th>ISLR</th>
                            <th>Multas</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </body>
            </html>
        `);
        win.document.close();
        win.print();
    };



    useAutoScroll(scrollRef, "fiscales-table", scrollReady && currentPage === 2);


    return (
        <>
            <div className="bg-[#2a2a29] border-[#3a3a39] rounded-md text-white lg:h-full">
                <div className="flex flex-row items-center justify-between pb-4 pr-4 lg:pb-0">
                    <div className="flex items-center justify-center gap-2 pt-4 pl-4 text-lg font-semibold">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        Top Fiscales - Ranking General
                    </div>
                    <div className='flex pt-4 space-x-2'>
                        <button
                            onClick={() => downloadPDF("fiscales-table", "top-fiscales-general.pdf")}
                            className="px-2 py-2 text-white bg-blue-600 border-blue-600 rounded-md hover:bg-blue-700"
                        >
                            <Download className="w-4 h-4 rounded-md" />
                        </button>

                        {/* Botón Excel */}
                        <button
                            onClick={() => exportTopFiscalsExcel(topFiscals || [], "top-fiscales-general")}
                            className="flex items-center gap-1 px-2 py-2 text-white bg-green-600 border-green-600 rounded-md hover:bg-green-700"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div>
                    <div id="fiscales-table" className="h-[400px] lg:h-[calc(90.2vh-120px)] overflow-y-auto custom-scroll p-4" ref={scrollRef}>
                        <div className="space-y-2">
                            {topFiscals && topFiscals?.map((fiscal, index) => (
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
                                        <span className="text-xs font-bold text-green-400 lg:text-base">{formatCurrency(Number(fiscal.total))}</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 text-sm text-gray-400 lg:grid-cols-3 ml-11">
                                        <p className='text-xs'>IVA: {formatCurrency(Number(fiscal.collectedIva))}</p>
                                        <p className='text-xs'>ISLR: {formatCurrency(Number(fiscal.collectedIslr))}</p>
                                        <p className='text-xs'>Multas: {formatCurrency(Number(fiscal.collectedFines))}</p>
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