import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LabelList
} from "recharts";

export interface KPIStat {
    name: string;
    value: number;
}

interface CustomLabelProps {
    x?: number | string;
    y?: number | string;
    width?: number | string;
    value?: number | string;
    payload?: KPIStat;
    height?: number | string;
}

export interface GlobalKPIResponse {
    totalTaxCollection: number;
    averageCreditSurplus: number;
    finePercentage: number;
    growthRate: number;
    delinquencyRate: number;
}

interface GlobalKPIProps {
    globalKpi: GlobalKPIResponse;
}

export const GlobalKPIStats = ({ globalKpi }: GlobalKPIProps) => {
    // Transformar el objeto de la API en el array que necesita Recharts
    const data: KPIStat[] = [
        { name: "Recaudación total (Bs.)", value: globalKpi.totalTaxCollection },
        { name: "Promedio excedente fiscal (Bs.)", value: globalKpi.averageCreditSurplus },
        { name: "Indice de contribuyentes con multas", value: globalKpi.finePercentage },
        { name: "Porcentaje de crecimiento recaudación", value: globalKpi.growthRate },
        { name: "Morosidad %", value: globalKpi.delinquencyRate },
    ];

    // Campos que se muestran con % (para etiqueta y tooltip)
    const percentageFields = ["Indice de contribuyentes con multas", "Porcentaje de crecimiento recaudación", "Morosidad %"];

    const renderCustomLabel = (props: CustomLabelProps) => {
        const { x = 0, y = 0, width = 0, height = 0, value = 0, payload } = props;
        const h = typeof height === "string" ? parseFloat(height) : height;
        const isPercent = payload && percentageFields.includes(payload.name);
        return (
            <text
                x={Number(x) + Number(width) + 6}
                y={Number(y) + h / 2 + 1}
                fill="#fff"
                fontSize={8}
                alignmentBaseline="middle"
            >
                {value}{isPercent ? "%" : ""}
            </text>
        );
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const { name, value } = payload[0].payload as KPIStat;
            const isPercentage = percentageFields.includes(name);
            const isLow = isPercentage && Number(value) < 20;
            const bg = isLow ? "#ff4d4d" : "#1eff87";
            return (
                <div style={{
                    backgroundColor: bg,
                    padding: "6px 10px",
                    borderRadius: "4px",
                    fontSize: 12,
                    color: "#000"
                }}>
                    <p><strong>{name}</strong></p>
                    <p>{value}{isPercentage ? "%" : ""}</p>
                </div>
            );
        }
        return null;
    };

    const maxValue = Math.max(...data.map(d => d.value), 0);

    const xDomainMax = maxValue * 1.1;

    return (
        <div className="flex justify-center items-center w-full h-full max-w-full max-h-full lg:max-w-[41vw] lg:max-h-[50vh]">
            <div className="w-full h-full bg-[#1c1c1b] p-0 flex flex-col overflow-hidden">
                {/* Título */}
                <div className="flex items-center justify-center pt-4 mb-1 text-xl font-semibold text-center text-white font-inter">
                    <div className="w-[90vw] lg:w-[35vw] border border-[#b7c0cd] bg-[#292d33] rounded-md px-2 py-1">
                        <p className="text-[14px] font-semibold text-white text-center whitespace-nowrap overflow-hidden text-ellipsis">
                            INDICADORES GLOBALES DE RENDIMIENTO
                        </p>
                    </div>
                </div>
                {/* Subtítulo */}
                <p className="text-center text-[8px] leading-[11px] text-[#838382] px-2 mb-1">
                    Esta gráfica muestra indicadores clave de rendimiento como recaudación total, promedio de excedente fiscal, porcentaje de contribuyentes con multas, tasa de crecimiento y morosidad.
                </p>
                {/* Gráfico */}
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={data}
                            margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                            barSize={14}
                        >
                            <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                            <XAxis
                                type="number"
                                stroke="#888"
                                domain={[0, xDomainMax]}
                            />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={100}
                                stroke="#ccc"
                                tick={{ fontSize: 8 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" fill="#5996ff" radius={[0, 6, 6, 0]}>
                                <LabelList dataKey="value" position="right" content={renderCustomLabel} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
