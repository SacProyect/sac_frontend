import React, { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";
import { getGlobalPerformance } from "../utils/api/reportFunctions";
import toast from "react-hot-toast";

export interface Stat {
    month: string;
    paid: number;
    total: number;
    collected: number;
    lastYear: number;
}

const PageOneStats = ({rawStats} : {rawStats: Stat[]}) => {

    const getShortMonthName = (month: string) => {
        const monthMapping: Record<string, string> = {
            "Enero": "Ene",
            "Febrero": "Feb",
            "Marzo": "Mar",
            "Abril": "Abr",
            "Mayo": "May",
            "Junio": "Jun",
            "Julio": "Jul",
            "Agosto": "Ago",
            "Septiembre": "Sep",
            "Octubre": "Oct",
            "Noviembre": "Nov",
            "Diciembre": "Dic",
        };
        return monthMapping[month] || month;
    };

    // 🧠 Compute rendimiento data with guards for division by zero
    const rendimientoData = rawStats.map((item) => {
        const finesPaidPercentage = item.total > 0 ? (item.paid / item.total) * 100 : 0;
        const collectedrendimiento = item.lastYear > 0 ? (item.collected / item.lastYear) * 100 : 0;
        const rendimiento = (finesPaidPercentage * 0.5) + (collectedrendimiento * 0.5);

        return {
            month: item.month,
            rendimiento: Number(rendimiento.toFixed(2)),
            collected: item.collected,
            lastYear: item.lastYear,
        };
    });

    const hasData = rendimientoData.length > 0;

    // 🧱 Set max domain with fallback
    const maxrendimiento = hasData
        ? Math.max(...rendimientoData.map(item => item.rendimiento))
        : 100;
    const yAxisDomain = [0, Math.ceil(maxrendimiento + 10)];

    // 🏆 Safe reduce on non-empty array
    const bestMonth = hasData
        ? rendimientoData.reduce((best, current) =>
            current.rendimiento > best.rendimiento ? current : best
        )
        : null;

    // 📈 Safe improvement calculation
    const improvementPercentage = bestMonth && bestMonth.lastYear > 0
        ? ((bestMonth.collected - bestMonth.lastYear) / bestMonth.lastYear) * 100
        : 0;

    return (
        <div className="flex flex-col items-center w-full lg:w-[41vw] h-[50vh] bg-[#1c1c1b] pb-8 pt-8 lg:pt-4 text-white font-inter">
            {/* Title and Description */}
            <div className="mb-4 text-center">
                <div className="w-full lg:w-[36vw] border border-[#b7c0cd] bg-[#292d33] rounded-md">
                    <h1 className="font-semibold text-sm lg:text-[18.5px] py-3 px-4 text-white font-inter whitespace-nowrap">
                        RENDIMIENTO GLOBAL DE CONTRIBUYENTES
                    </h1>
                </div>
                <p className="mt-2 text-[9.4px] leading-[12.9px] text-[#838382] font-inter">
                    A continuación, se presenta una estadística del rendimiento global anual <br />
                    de los contribuyentes registrados en la plataforma.
                </p>
            </div>

            {/* Chart */}
            <div className="w-full lg:w-[41vw] h-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rendimientoData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="month"
                            angle={0}
                            textAnchor="end"
                            interval={0}
                            scale="point"
                            height={40}
                            tickFormatter={getShortMonthName} // Use short month name here
                        />
                        <YAxis domain={yAxisDomain} />
                        <Tooltip />
                        <Line type="monotone" dataKey="rendimiento" stroke="#5996ff" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Summary Below Chart */}
            <div className="flex flex-col items-center gap-4 mt-0 text-center sm:flex-row">
                <div className="px-4 py-2 bg-[#5996ff] rounded-lg shadow">
                    <p className="text-xs font-medium">
                        {bestMonth ? `${bestMonth.month} ha sido el mes con mejor rendimiento` : "No hay datos disponibles para determinar el mejor mes"} {/* Full name of the best month */}
                    </p>
                </div>
                <div className="px-4 py-2 bg-[#5996ff] rounded-lg shadow">
                    <p className="text-xs font-medium">
                        {improvementPercentage.toFixed(2)}% mas que al año pasado
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PageOneStats;
