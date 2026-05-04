import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { getGroupPerformance } from "@/components/utils/api/report-functions";
import { GroupStat } from "./group-performance-stats";
import { StatsDesignVariant } from "./global-perfomance";
import toast from "react-hot-toast";

interface IvaByGroupChartProps {
    year?: number;
    /** UUID del grupo fiscal (coordinación); si no se envía, todas. */
    groupId?: string;
    designVariant?: StatsDesignVariant;
}

export const IvaByGroupChart = ({ year, groupId, data, designVariant = "classic" }: IvaByGroupChartProps & { data?: GroupStat[] }) => {
    const [groupStats, setGroupStats] = useState<GroupStat[]>(data || []);
    const styles: Record<StatsDesignVariant, {
        panelBg: string;
        titleBorder: string;
        titleBg: string;
        subtitle: string;
        grid: string;
        xTick: string;
        yTick: string;
        tooltipBg: string;
        bar: string;
    }> = {
        classic: {
            panelBg: "bg-slate-950/80",
            titleBorder: "border-slate-500",
            titleBg: "bg-slate-800/90",
            subtitle: "text-slate-400",
            grid: "#334155",
            xTick: "#cbd5e1",
            yTick: "#94a3b8",
            tooltipBg: "bg-slate-900/95",
            bar: "#f7c94b",
        },
        contrast: {
            panelBg: "bg-slate-950",
            titleBorder: "border-amber-300/70",
            titleBg: "bg-amber-950/40",
            subtitle: "text-slate-200",
            grid: "#f59e0b",
            xTick: "#ffffff",
            yTick: "#fde68a",
            tooltipBg: "bg-amber-950/90",
            bar: "#f59e0b",
        },
        minimal: {
            panelBg: "bg-slate-900/40",
            titleBorder: "border-slate-700",
            titleBg: "bg-slate-900/30",
            subtitle: "text-slate-500",
            grid: "#1e293b",
            xTick: "#94a3b8",
            yTick: "#64748b",
            tooltipBg: "bg-slate-900/90",
            bar: "#fbbf24",
        },
    };
    const style = styles[designVariant];
    const [loading, setLoading] = useState(!data);

    useEffect(() => {
        if (data) {
            setGroupStats(data);
            setLoading(false);
            return;
        }
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await getGroupPerformance(year, groupId);
                setGroupStats(res);
            } catch (e) {
                console.error(e);
                toast.error("No se pudo obtener el rendimiento de IVA por grupo.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [year, groupId, data]);

    // Transformar datos para el gráfico
    const chartData = groupStats.map((group) => ({
        group_name: group.groupName,
        short_name: group.groupName.length > 16 ? `${group.groupName.slice(0, 16)}...` : group.groupName,
        totalIva: Number(group.totalIvaCollected),
    })).sort((a, b) => b.totalIva - a.totalIva); // Ordenar de mayor a menor

    const totalIvaCollected = chartData.reduce((sum, group) => sum + group.totalIva, 0);

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
        return n.toLocaleString("es-VE", { maximumFractionDigits: 1, notation: "compact", compactDisplay: "short" });
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const value = Number(data.totalIva) || 0;
            const share = totalIvaCollected > 0 ? (value / totalIvaCollected) * 100 : 0;
            
            return (
                <div className={`p-2 border border-slate-700 rounded-md text-xs shadow-xl ${style.tooltipBg}`}>
                    <p className="font-bold text-white mb-1">{data.group_name}</p>
                    <p className="text-white">IVA recaudado: Bs. {value.toLocaleString("es-VE", { maximumFractionDigits: 0 })}</p>
                    <p className="text-slate-300">Participación del total: {share.toFixed(1)}%</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex h-full min-h-0 w-full flex-col">
            <div className={`flex h-full min-h-0 w-full flex-col overflow-hidden ${style.panelBg} px-2 pb-1 pt-3 sm:px-3`}>
                {/* Título */}
                <div className="mb-1 flex shrink-0 justify-center">
                    <div className={`w-full max-w-md rounded-md border ${style.titleBorder} ${style.titleBg} px-2 py-1`}>
                        <p className="text-center text-xs font-semibold tracking-wide text-white sm:text-sm">
                            RENDIMIENTO DE IVA POR GRUPO
                        </p>
                    </div>
                </div>
                {/* Subtítulo */}
                <p className={`mb-1 line-clamp-2 text-center text-[10px] leading-tight ${style.subtitle}`}>
                    Total de IVA recaudado por grupo y participación porcentual.
                </p>
                {/* Gráfico */}
                <div className="min-h-0 flex-1 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 35 }}>
                            <CartesianGrid strokeDasharray="2 3" stroke={style.grid} vertical={false} />
                            <XAxis 
                                dataKey="short_name" 
                                stroke={style.xTick}
                                tick={{ fontSize: 10, fontWeight: "600" }}
                                angle={-30}
                                textAnchor="end"
                                interval={0}
                            />
                            <YAxis 
                                stroke={style.yTick}
                                tickFormatter={(val) => formatY(Number(val))}
                                tick={{ fontSize: 10 }}
                            />
                            <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} content={<CustomTooltip />} />
                            <Bar dataKey="totalIva" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={style.bar} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
