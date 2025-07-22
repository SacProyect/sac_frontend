import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";

export type ChartData = {
    month: string;              // "2025-01"
    expectedAmount: number;     // Monto esperado del mes
    realAmount: number;         // Monto real recaudado
};

const PageOneStats = ({ chartData }: { chartData: ChartData[] }) => {

    // Mapear "2025-12" a nombre corto "Dic" (extraemos el mes numérico)
    const getShortMonthName = (monthStr: string) => {
        // monthStr en formato "YYYY-MM"
        const monthNum = parseInt(monthStr.split("-")[1], 10);
        const monthMapping = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        return monthMapping[monthNum - 1] || monthStr;
    };

    const mappedData = chartData.map(item => ({
        ...item,
        dotColor: item.realAmount >= item.expectedAmount ? "#00ff66" : "#00ff66",
    }));

    return (
        <div className="flex flex-col items-center w-full lg:w-full h-full lg:h-full bg-[#1c1c1b] pb-8 pt-8 lg:pb-12 lg:pt-4 text-white font-inter">
            {/* Title and Description */}
            <div className="mb-4 text-center">
                <div className="w-full lg:w-full border border-[#b7c0cd] bg-[#292d33] rounded-md">
                    <h1 className="px-4 py-2 text-sm font-semibold text-white lg:text-sm font-inter whitespace-nowrap">
                        RENDIMIENTO GLOBAL DE IVA
                    </h1>
                </div>
                <p className="mt-2 text-[9.4px] leading-[12.9px] text-[#838382] font-inter">
                    Comparativa de monto mensual de IVA pagado.
                </p>
            </div>

            {/* Chart */}
            <div className="w-full h-full text-xs">
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mappedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tickFormatter={getShortMonthName} />
                        <YAxis />
                        <Tooltip
                            formatter={(value: number) =>
                                value.toLocaleString("es-VE", {
                                    style: "currency",
                                    currency: "VES",
                                    minimumFractionDigits: 2,
                                })
                            }
                        />
                        {/* <Line
                            type="monotone"
                            dataKey="expectedAmount"
                            stroke="#e74c3c"
                            strokeWidth={2}
                            name="Esperado"
                            dot={false}
                        /> */}
                        <Line
                            type="monotone"
                            dataKey="realAmount"
                            stroke="#3498db"
                            strokeWidth={2}
                            name="Pagado"
                            dot={({ cx, cy, payload }) => (
                                <circle cx={cx} cy={cy} r={4} fill={payload.dotColor} stroke="#fff" strokeWidth={1} />
                            )}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PageOneStats;