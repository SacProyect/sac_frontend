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
                <div
                    style={{
                        backgroundColor: "#292d33",
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid #b7c0cd",
                        fontSize: 12,
                        color: "#fff",
                    }}
                >
                    <p style={{ marginBottom: "4px", fontWeight: "bold" }}>
                        {data.group_name}
                    </p>
                    <p style={{ color: "#ffc74d" }}>
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
            <div className="flex items-center justify-center w-full h-full bg-[#1c1c1b]">
                <p className="text-lg text-center text-white">Cargando datos...</p>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center w-full h-full bg-[#1c1c1b]">
                <p className="text-lg text-center text-gray-400">No hay datos para mostrar</p>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center w-full h-full max-w-full max-h-full lg:max-w-full lg:max-h-full">
            <div className="w-full h-full bg-[#1c1c1b] p-0 flex flex-col overflow-hidden">
                {/* Título */}
                <div className="flex items-center justify-center pt-4 mb-1 text-xl font-semibold text-center text-white font-inter">
                    <div className="w-[90vw] lg:w-[35vw] border border-[#b7c0cd] bg-[#292d33] rounded-md px-2 py-1">
                        <p className="text-[14px] lg:text-sm font-semibold text-white text-center whitespace-nowrap overflow-hidden text-ellipsis">
                            RENDIMIENTO DE IVA POR GRUPO
                        </p>
                    </div>
                </div>
                {/* Subtítulo */}
                <p className="text-center text-[8px] leading-[11px] text-[#838382] px-2 mb-1">
                    Esta gráfica muestra el total de IVA recaudado comparando cada grupo entre sí.
                </p>
                {/* Gráfico */}
                <div className="flex-1 min-h-0 pr-4 lg:pr-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                            barSize={30}
                        >
                            <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                            <XAxis
                                dataKey="group_name"
                                stroke="#888"
                                tick={{ fill: "#ccc", fontSize: 10 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis
                                type="number"
                                stroke="#888"
                                tick={{ fill: "#ccc", fontSize: 10 }}
                                tickFormatter={(value) =>
                                    Number(value).toLocaleString("es-VE", {
                                        maximumFractionDigits: 0,
                                    })
                                }
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
