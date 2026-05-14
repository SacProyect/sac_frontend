import React, { useEffect, useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine, LabelList } from "recharts";
import { getGroupPerformance } from "@/components/utils/api/report-functions";
import { GroupStat } from "./group-performance-stats";
import { StatsDesignVariant } from "./global-perfomance";
import toast from "react-hot-toast";

interface IvaByGroupChartProps {
    year?: number;
    /** UUID del grupo fiscal (coordinación); si no se envía, todas. */
    groupId?: string;
    designVariant?: StatsDesignVariant;
    /** Cicla automáticamente por las barras resaltando cada grupo */
    autoHover?: boolean;
}

// ─── Paletas de colores escalables ───────────────────────────────────────────

/**
 * Paleta principal (classic / minimal): 12 colores curados que se ciclan
 * automáticamente si hay más grupos que colores.
 */
const PALETTE_CLASSIC = [
    "#3b82f6", // blue-500
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#8b5cf6", // violet-500
    "#ef4444", // red-500
    "#06b6d4", // cyan-500
    "#f97316", // orange-500
    "#84cc16", // lime-500
    "#ec4899", // pink-500
    "#14b8a6", // teal-500
    "#a855f7", // purple-500
    "#eab308", // yellow-500
];

/** Paleta cálida para el variant 'contrast' (ámbar/naranja). */
const PALETTE_CONTRAST = [
    "#f59e0b", // amber-500
    "#fbbf24", // amber-400
    "#d97706", // amber-600
    "#f97316", // orange-500
    "#fb923c", // orange-400
    "#ea580c", // orange-600
    "#fcd34d", // amber-300
    "#fde68a", // amber-200
    "#fdba74", // orange-300
    "#fed7aa", // orange-200
    "#fef3c7", // amber-100
    "#ffedd5", // orange-100
];

/** Paleta para el top 3 (gold, silver, bronze) */
const TOP_COLORS = {
    1: "#fbbf24", // gold
    2: "#94a3b8", // silver
    3: "#cd7f32", // bronze
};

const getBarColor = (variant: StatsDesignVariant, index: number, rank?: number): string => {
    if (rank && rank <= 3) {
        return TOP_COLORS[rank as keyof typeof TOP_COLORS];
    }
    const palette = variant === "contrast" ? PALETTE_CONTRAST : PALETTE_CLASSIC;
    return palette[index % palette.length];
};

// ─── Gradientes para las barras ───────────────────────────────────────────────

const GRADIENTS = {
    classic: [
        { offset: "0%", color: "#3b82f6", opacity: 1 },
        { offset: "100%", color: "#1d4ed8", opacity: 1 },
    ],
    contrast: [
        { offset: "0%", color: "#fbbf24", opacity: 1 },
        { offset: "100%", color: "#d97706", opacity: 1 },
    ],
    minimal: [
        { offset: "0%", color: "#64748b", opacity: 1 },
        { offset: "100%", color: "#334155", opacity: 1 },
    ],
};

// ─── Estilos por variant ─────────────────────────────────────────────────────

const STYLES: Record<StatsDesignVariant, {
    panelBg: string;
    titleBorder: string;
    titleBg: string;
    subtitle: string;
    grid: string;
    xTick: string;
    yTick: string;
    tooltipBg: string;
    kpiCardBg: string;
    kpiCardBorder: string;
    kpiCardText: string;
    kpiCardHighlight: string;
    tableHeader: string;
    tableRow: string;
    tableRowHighlight: string;
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
        kpiCardBg: "bg-slate-800/60",
        kpiCardBorder: "border-slate-600/50",
        kpiCardText: "text-slate-300",
        kpiCardHighlight: "text-blue-400",
        tableHeader: "bg-slate-800/80 text-slate-300",
        tableRow: "text-slate-400 hover:bg-slate-800/50",
        tableRowHighlight: "bg-amber-950/30",
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
        kpiCardBg: "bg-amber-950/30",
        kpiCardBorder: "border-amber-500/50",
        kpiCardText: "text-amber-100",
        kpiCardHighlight: "text-amber-300",
        tableHeader: "bg-amber-900/50 text-amber-200",
        tableRow: "text-amber-100/80 hover:bg-amber-900/30",
        tableRowHighlight: "bg-amber-900/40",
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
        kpiCardBg: "bg-slate-800/30",
        kpiCardBorder: "border-slate-700/50",
        kpiCardText: "text-slate-400",
        kpiCardHighlight: "text-slate-200",
        tableHeader: "bg-slate-800/40 text-slate-400",
        tableRow: "text-slate-500 hover:bg-slate-800/30",
        tableRowHighlight: "bg-slate-800/50",
    },
};

// ─── Componentes auxiliares ───────────────────────────────────────────────────

// Tarjeta KPI reutilizable
const KpiCard = ({ 
    label, 
    value, 
    subValue, 
    icon, 
    highlight = false, 
    accent,
    style 
}: { 
    label: string; 
    value: string; 
    subValue?: string; 
    icon?: React.ReactNode;
    highlight?: boolean;
    accent?: string;
    style: typeof STYLES.classic;
}) => (
    <div className={`flex flex-col p-2.5 rounded-lg border ${style.kpiCardBorder} ${style.kpiCardBg} gap-1 transition-colors`}>
        <div className="flex items-center justify-between">
            <span className={`text-[9px] uppercase tracking-widest font-bold ${style.kpiCardText} flex items-center gap-1`}>
                {icon && <span className="text-[10px]">{icon}</span>}
                {label}
            </span>
        </div>
        <p className={`text-base font-black leading-none tabular-nums ${highlight ? (accent || style.kpiCardHighlight) : 'text-white'}`}>
            {value}
        </p>
        {subValue && (
            <p className={`text-[9px] ${style.kpiCardText} leading-tight`}>
                {subValue}
            </p>
        )}
    </div>
);

// Componente de ranking badge
const RankBadge = ({ rank }: { rank: number }) => {
    const getBadgeStyle = () => {
        switch (rank) {
            case 1:
                return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
            case 2:
                return "bg-slate-400/20 text-slate-300 border-slate-400/50";
            case 3:
                return "bg-amber-700/20 text-amber-600 border-amber-700/50";
            default:
                return "bg-slate-700/20 text-slate-400 border-slate-600/50";
        }
    };
    
    return (
        <span className={`inline-flex items-center justify-center w-5 h-5 text-[9px] font-bold rounded border ${getBadgeStyle()}`}>
            {rank}
        </span>
    );
};

// ─── Componente principal ────────────────────────────────────────────────────

export const IvaByGroupChart = ({ year, groupId, data, designVariant = "classic", autoHover = false }: IvaByGroupChartProps & { data?: GroupStat[] }) => {
    const [groupStats, setGroupStats] = useState<GroupStat[]>(data || []);
    const [loading, setLoading] = useState(!data);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const style = STYLES[designVariant];

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

    // Transformar datos para el gráfico - ordenados por rendimiento (mayor a menor)
    const chartData = useMemo(() => {
        const sorted = groupStats
            .map((group) => ({
                group_name: group.groupName,
                short_name: group.groupName.length > 16 ? `${group.groupName.slice(0, 16)}...` : group.groupName,
                totalIva: Number(group.totalIvaCollected),
            }))
            .sort((a, b) => b.totalIva - a.totalIva);

        // Agregar ranking
        return sorted.map((item, index) => ({
            ...item,
            rank: index + 1,
        }));
    }, [groupStats]);

    // Calcular métricas
    const metrics = useMemo(() => {
        const totalIvaCollected = chartData.reduce((sum, group) => sum + group.totalIva, 0);
        const totalGroups = chartData.length;
        const averagePerGroup = totalGroups > 0 ? totalIvaCollected / totalGroups : 0;
        const topGroup = chartData[0] || null;
        const topGroupShare = topGroup && totalIvaCollected > 0 
            ? (topGroup.totalIva / totalIvaCollected) * 100 
            : 0;
        
        return {
            totalIvaCollected,
            totalGroups,
            averagePerGroup,
            topGroup,
            topGroupShare,
        };
    }, [chartData]);

    // ─── Auto-hover cycle ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!autoHover || chartData.length === 0) {
            setHoveredIndex(null);
            return;
        }
        setHoveredIndex(0);
        const interval = setInterval(() => {
            setHoveredIndex((prev) => (prev === null ? 0 : (prev + 1) % chartData.length));
        }, 2500);
        return () => clearInterval(interval);
    }, [autoHover, chartData.length]);

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

    const formatFullNumber = (value: number) => {
        return value.toLocaleString("es-VE", { maximumFractionDigits: 0 });
    };

    // Tooltip mejorado
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            const value = Number(d.totalIva) || 0;
            const share = metrics.totalIvaCollected > 0 ? (value / metrics.totalIvaCollected) * 100 : 0;
            const comparison = metrics.averagePerGroup > 0 ? ((value - metrics.averagePerGroup) / metrics.averagePerGroup) * 100 : 0;
            const isAboveAverage = value > metrics.averagePerGroup;
            const barColor = getBarColor(designVariant, d.rank - 1, d.rank);

            return (
                <div className={`p-3 border border-slate-700/80 rounded-lg text-xs shadow-xl ${style.tooltipBg} min-w-[180px]`}>
                    {/* Header con ranking */}
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700/50">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: barColor }} />
                            <p className="font-bold text-white text-[11px]">{d.group_name}</p>
                        </div>
                        <RankBadge rank={d.rank} />
                    </div>
                    
                    {/* Valores principales */}
                    <div className="space-y-1.5">
                        <p className="text-white font-medium">
                            IVA: <span className="font-bold">Bs. {formatFullNumber(value)}</span>
                        </p>
                        <p className="text-slate-300">
                            Participación: <span className="text-white font-medium">{share.toFixed(1)}%</span>
                        </p>
                        
                        {/* Comparación con promedio */}
                        <div className={`flex items-center gap-1 mt-1.5 px-1.5 py-1 rounded ${isAboveAverage ? 'bg-emerald-900/30' : 'bg-red-900/30'}`}>
                            <span className={`text-[10px] ${isAboveAverage ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isAboveAverage ? '▲' : '▼'}
                            </span>
                            <span className={`text-[10px] ${isAboveAverage ? 'text-emerald-300' : 'text-red-300'}`}>
                                {Math.abs(comparison).toFixed(1)}% vs promedio
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Etiqueta sobre la barra
    const BarLabel = (props: any) => {
        const { x, y, width, value, index } = props;
        if (!value || value <= 0) return null;

        const isActive = autoHover && hoveredIndex !== null && index === hoveredIndex;
        const isDimmed = autoHover && hoveredIndex !== null && index !== hoveredIndex;
        const barColor = getBarColor(designVariant, index, chartData[index]?.rank);

        return (
            <text
                x={x + width / 2}
                y={isActive ? y - 7 : y - 5}
                textAnchor="middle"
                fill={isActive ? barColor : style.xTick}
                style={{
                    fontSize: isActive ? 11 : 9,
                    fontWeight: isActive ? 800 : 600,
                    opacity: isDimmed ? 0.25 : 1,
                    transition: 'opacity 0.35s ease',
                }}
            >
                {formatY(value)}
            </text>
        );
    };


    // Barra personalizada con efecto zoom en la activa
    const renderCustomBar = (props: any) => {
        const { x, y, width, height, index, fill } = props;
        if (!height || height <= 0) return <g key={`bar-empty-${index}`} />;

        const isActive = autoHover && hoveredIndex !== null && index === hoveredIndex;
        const isDimmed = autoHover && hoveredIndex !== null && index !== hoveredIndex;

        return (
            <rect
                key={`bar-${index}`}
                x={x}
                y={y}
                width={width}
                height={height}
                fill={fill}
                rx={4}
                ry={4}
                style={{
                    transformBox: 'fill-box',
                    transformOrigin: 'bottom center',
                    transform: isActive ? 'scaleY(1.08) scaleX(1.12)' : 'scale(1)',
                    opacity: isDimmed ? 0.3 : 1,
                    transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease',
                    filter: isActive ? `drop-shadow(0 0 6px ${fill}88)` : 'none',
                }}
            />
        );
    };

    // Datos del grupo activo en autoHover
    const activeGroup = autoHover && hoveredIndex !== null ? chartData[hoveredIndex] : null;
    const activeShare = activeGroup && metrics.totalIvaCollected > 0
        ? (activeGroup.totalIva / metrics.totalIvaCollected) * 100 : 0;
    const activeComparison = activeGroup && metrics.averagePerGroup > 0
        ? ((activeGroup.totalIva - metrics.averagePerGroup) / metrics.averagePerGroup) * 100 : 0;
    const activeIsAboveAvg = activeGroup ? activeGroup.totalIva > metrics.averagePerGroup : false;
    const activeBarColor = activeGroup ? getBarColor(designVariant, activeGroup.rank - 1, activeGroup.rank) : '#fff';

    return (
        <div className={`flex w-full flex-col h-full overflow-y-auto custom-scrollbar ${style.panelBg}`}>
            <div className={`flex w-full flex-col min-h-full px-2 pb-2 pt-3 sm:px-3`}>
                {/* Título como línea de estado */}
                <div className="mb-3 flex shrink-0 items-center gap-3">
                    <div className="flex-1">
                        <p className={`text-[9px] font-bold uppercase tracking-widest ${style.subtitle}`}>IVA por Coordinación Fiscal</p>
                        <h2 className="text-sm font-black tracking-tight text-white">Rendimiento de Recaudación</h2>
                    </div>
                    {autoHover && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-600/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-blue-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                            Demo
                        </span>
                    )}
                </div>

                {/* ─── KPI Cards con jerarquía ─── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
                    {/* Total grupos — secundario */}
                    <KpiCard 
                        label="Total Grupos"
                        value={metrics.totalGroups.toString()}
                        icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a4 4 0 11-8 0 4 4 0 018 0zM17 20a4 4 0 10-8 0 4 4 0 008 0z" /></svg>}
                        style={style}
                    />
                    {/* Promedio — secundario */}
                    <KpiCard 
                        label="Promedio/Grupo"
                        value={`Bs. ${formatY(metrics.averagePerGroup)}`}
                        subValue="Por grupo fiscal"
                        style={style}
                    />
                    {/* Grupo líder — destacado */}
                    <KpiCard 
                        label="Grupo Líder"
                        value={metrics.topGroup ? metrics.topGroup.short_name : "N/A"}
                        subValue={metrics.topGroup ? `${metrics.topGroupShare.toFixed(1)}% del total` : ""}
                        highlight
                        accent="text-yellow-400"
                        icon={<svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>}
                        style={style}
                    />
                    {/* Total recaudado — primario / más prominente */}
                    <KpiCard 
                        label="Total Recaudado"
                        value={`Bs. ${formatY(metrics.totalIvaCollected)}`}
                        subValue="IVA total"
                        style={style}
                    />
                </div>

                {/* ─── Panel de info del grupo activo (solo en autoHover) ─── */}
                {autoHover && activeGroup && (
                    <div
                        key={activeGroup.group_name}
                        className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-slate-700/40 bg-slate-900/60 px-3 py-2 text-[11px] shrink-0"
                        style={{ animation: 'fadeSlideIn 0.3s ease' }}
                    >
                        <RankBadge rank={activeGroup.rank} />
                        <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: activeBarColor }}
                        />
                        <span className="font-bold text-white flex-1 truncate min-w-[80px]">{activeGroup.group_name}</span>
                        <span className="font-black tabular-nums" style={{ color: activeBarColor }}>
                            Bs. {formatFullNumber(activeGroup.totalIva)}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="font-semibold text-slate-300 tabular-nums">{activeShare.toFixed(1)}%</span>
                        <span className={`flex items-center gap-0.5 font-bold tabular-nums ${
                            activeIsAboveAvg ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                            {activeIsAboveAvg ? '▲' : '▼'}
                            {Math.abs(activeComparison).toFixed(1)}%
                        </span>
                        <span className="text-[9px] text-slate-600 hidden sm:inline">vs promedio</span>
                    </div>
                )}

                {/* ─── Gráfico mejorado ─── */}
                <div className="mt-2 flex-1 min-h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barSize={28} margin={{ top: 12, right: 5, left: -20, bottom: 40 }}>
                            <defs>
                                {Object.entries(GRADIENTS).map(([key, stops]) => (
                                    <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                                        {stops.map((stop, i) => (
                                            <stop key={i} offset={stop.offset} stopColor={stop.color} stopOpacity={stop.opacity} />
                                        ))}
                                    </linearGradient>
                                ))}
                            </defs>
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
                            {/* Línea de promedio */}
                            <ReferenceLine 
                                y={metrics.averagePerGroup} 
                                stroke={designVariant === "contrast" ? "#f59e0b" : "#ef4444"}
                                strokeDasharray="5 5"
                                strokeWidth={1.5}
                                label={{
                                    value: 'Promedio',
                                    position: 'right',
                                    fill: style.yTick,
                                    fontSize: 9,
                                }}
                            />
                            <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} content={<CustomTooltip />} />
                            <Bar dataKey="totalIva" radius={[4, 4, 0, 0]} shape={renderCustomBar}>
                                {chartData.map((entry, index) => {
                                    const barColor = getBarColor(designVariant, index, entry.rank);
                                    const isActive = autoHover && hoveredIndex !== null && index === hoveredIndex;
                                    const isDimmed = autoHover && hoveredIndex !== null && index !== hoveredIndex;
                                    return (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={autoHover ? barColor : `url(#gradient-${designVariant})`}
                                            opacity={isDimmed ? 0.3 : 1}
                                            stroke={isActive ? barColor : 'transparent'}
                                            strokeWidth={isActive ? 2 : 0}
                                        />
                                    );
                                })}

                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

            </div>
        </div>
    );
};