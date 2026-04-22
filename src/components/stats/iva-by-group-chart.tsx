import React, { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { getGroupPerformance } from "@/components/utils/api/report-functions";
import { GroupStat } from "./group-performance-stats";
import toast from "react-hot-toast";

interface IvaByGroupChartProps {
    year?: number;
}

export const IvaByGroupChart = ({ year }: IvaByGroupChartProps) => {
    const [groupStats, setGroupStats] = useState<GroupStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await getGroupPerformance(year);
                setGroupStats(data);
            } catch (e) {
                console.error(e);
                toast.error("No se pudo obtener el rendimiento de IVA por grupo.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [year]);

    // Transformar datos para el gráfico
    const chartData = groupStats.map((group) => ({
        group_name: group.groupName,
        totalIva: Number(group.totalIvaCollected),
    })).sort((a, b) => b.totalIva - a.totalIva); // Ordenar de mayor a menor

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-800 border border-slate-600 px-3 py-2 rounded-lg text-xs text-white shadow-xl">
                    <p className="mb-1 font-bold">{data.group_name}</p>
                    <p className="text-amber-400">
                        IVA Recaudado:{" "}
                        {Number(data.totalIva).toLocaleString("es-VE", {
                            style: "currency",
                            currency: "VES",
                            minimumFractionDigits: 0,
                        })}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center w-full h-full bg-slate-900">
                <p className="text-lg text-center text-white">Cargando datos...</p>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center w-full h-full bg-slate-900">
                <p className="text-lg text-center text-slate-400">No hay datos para mostrar</p>
            </div>
        );
    }

    const formatY = (value: number) => {
        const n = Number(value);
        if (n >= 1_000_000) {
            return n.toLocaleString("es-VE", { maximumFractionDigits: 1, notation: "compact", compactDisplay: "short" });
        }
        return n.toLocaleString("es-VE", { maximumFractionDigits: 0 });
    };

    return (
        <div className="flex h-full min-h-0 w-full flex-col">
            <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-slate-900/80 px-2 pb-1 pt-3 sm:px-3">
                {/* Título */}
                <div className="mb-1 flex shrink-0 justify-center">
                    <div className="w-full max-w-md rounded-md border border-slate-600 bg-slate-800 px-2 py-1">
                        <p className="text-center text-xs font-semibold text-white sm:text-sm">
                            RENDIMIENTO DE IVA POR GRUPO
                        </p>
                    </div>
                </div>
                {/* Subtítulo */}
                <p className="mb-1 line-clamp-2 text-center text-[9px] leading-tight text-slate-500 sm:text-[10px]">
                    Total de IVA recaudado por grupo (comparación).
                </p>
                {/* Gráfico */}
                <div className="min-h-0 flex-1 pr-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 4, right: 4, left: 0, bottom: 4 }}
                            barSize={22}
                        >
                            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                            <XAxis
                                dataKey="group_name"
                                stroke="#475569"
                                tick={{ fill: "#94a3b8", fontSize: 8 }}
                                angle={-35}
                                textAnchor="end"
                                height={56}
                                interval={0}
                            />
                            <YAxis
                                type="number"
                                stroke="#475569"
                                tick={{ fill: "#94a3b8", fontSize: 9 }}
                                width={44}
                                tickFormatter={formatY}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                                dataKey="totalIva"
                                fill="#ffc74d"
                                radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
