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

export interface Stat {
    month: string;           // Ej: "2025-12"
    ivaAmount: number;
    islrAmount: number;
    complianceRate: number;
    globalIndex: number;
    previousIndex?: number | null;
    percentageChange?: number | null;
}

const PageOneStats = ({ rawStats }: { rawStats: Stat[] }) => {
    console.log(JSON.stringify(rawStats));

    // Mapear "2025-12" a nombre corto "Dic" (extraemos el mes numérico)
    const getShortMonthName = (monthStr: string) => {
        // monthStr en formato "YYYY-MM"
        const monthNum = parseInt(monthStr.split("-")[1], 10);
        const monthMapping = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        return monthMapping[monthNum - 1] || monthStr;
    };

    // Mapeamos percentageChange para el gráfico
    const rendimientoData = rawStats
        .filter(item => item.month.startsWith("2025")) // <-- Solo datos del año actual
        .map((item) => ({
            month: item.month,
            percentageChange: item.percentageChange !== null && item.percentageChange !== undefined
                ? Number(item.percentageChange.toFixed(2))
                : null,
            ivaAmount: item.ivaAmount,
            islrAmount: item.islrAmount,
            complianceRate: item.complianceRate,
            previousIndex: item.previousIndex ?? null,
            globalIndex: item.globalIndex ?? null,
        }));

    const hasData = rendimientoData.length > 0;

    // Ajustamos dominio Y para que se adapte al rango de percentageChange
    const validChanges = rendimientoData
        .map(item => item.percentageChange)
        .filter(val => val !== null && !isNaN(val)) as number[];
    const maxChange = hasData && validChanges.length > 0
        ? Math.max(...validChanges)
        : 100;
    const minChange = hasData && validChanges.length > 0
        ? Math.min(...validChanges)
        : 0;
    const yAxisDomain = [Math.floor(minChange) - 10, Math.ceil(maxChange) + 10];

    // Encontrar el mejor mes según percentageChange
    const bestMonth = hasData && validChanges.length > 0
        ? rendimientoData.reduce((best, current) =>
            (current.percentageChange !== null && (best.percentageChange === null || current.percentageChange > best.percentageChange))
                ? current
                : best
        )
        : null;

    // Función para obtener el nombre completo del mes desde "YYYY-MM"
    const getFullMonthName = (monthStr: string) => {
        const monthNum = parseInt(monthStr.split("-")[1], 10);
        const monthMappingFull = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
        return monthMappingFull[monthNum - 1] || monthStr;
    };

    return (
        <div className="flex flex-col items-center w-full lg:w-[41vw] h-[60vh] lg:h-[42vh] bg-[#1c1c1b] pb-8 pt-8 lg:pt-4 text-white font-inter">
            {/* Title and Description */}
            <div className="mb-4 text-center">
                <div className="w-full lg:w-[36vw] border border-[#b7c0cd] bg-[#292d33] rounded-md">
                    <h1 className="font-semibold text-sm lg:text-[18.5px] py-3 px-4 text-white font-inter whitespace-nowrap">
                        RENDIMIENTO GLOBAL
                    </h1>
                </div>
                <p className="mt-2 text-[9.4px] leading-[12.9px] text-[#838382] font-inter">
                    Estadística mensual de la variación porcentual del rendimiento global anual de los contribuyentes.
                </p>
            </div>

            {/* Chart */}
            <div className="w-full lg:w-[41vw] h-full text-xs">
                <ResponsiveContainer width="100%" height="90%">
                    <LineChart data={rendimientoData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="month"
                            angle={0}
                            textAnchor="end"
                            interval={0}
                            scale="point"
                            height={40}
                            tickFormatter={getShortMonthName}
                        />
                        <YAxis domain={yAxisDomain} />
                        <Tooltip
                            formatter={(value: any, name: any) => {
                                if (name === "percentageChange") return [`${value}%`, "Rendimiento %"];
                                return [value, name];
                            }}
                            labelFormatter={(label: string) => `Mes: ${label}`}
                        />
                        <Line
                            type="monotone"
                            dataKey="percentageChange"
                            stroke="#5996ff"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            connectNulls
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Summary Below Chart */}
            <div className="flex flex-col items-center gap-4 mt-0 text-center lg:px-4 sm:flex-row">
                <div className="px-4 py-2 bg-[#5996ff] rounded-lg shadow">
                    <p className="text-xs font-medium">
                        {bestMonth && bestMonth.percentageChange !== null
                            ? `${getFullMonthName(bestMonth.month)} ha sido el mes con mejor rendimiento`
                            : "No hay datos disponibles para determinar el mejor mes"}
                    </p>
                </div>
                <div className="px-4 py-2 bg-[#5996ff] rounded-lg shadow">
                    <p className="text-xs font-medium">
                        {bestMonth && bestMonth.percentageChange !== null
                            ? `${(bestMonth.percentageChange)}% de mejora respecto al mes anterior`
                            : "No hay datos disponibles para determinar el mejor mes"}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PageOneStats;