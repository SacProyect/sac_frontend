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
}

interface GlobalKPIProps {
    globalKpi: KPIStat[]
}

export const GlobalKPIStats = ({ globalKpi }: GlobalKPIProps) => {

    const percentageFields = [
        "Tasa de cumplimiento",
        "Contribuyentes cumplidores",
        "Cambio en rendimiento",
    ];

    const renderCustomLabel = (props: CustomLabelProps & { height?: number | string }) => {
        const {
            x = 0,
            y = 0,
            width = 0,
            value = 0,
            payload,
            height = 0,
        } = props;

        const numericHeight = typeof height === "string" ? parseFloat(height) : height;

        const isPercent =
            payload?.name &&
            percentageFields.some(
                (p) => p.toLowerCase() === payload.name?.toLowerCase()
            );

        return (
            <text
                x={Number(x) + Number(width) + 6}
                y={Number(y) + numericHeight / 2 + 1}
                fill="#fff"
                fontSize={8}
                alignmentBaseline="middle"
            >
                {value}
                {isPercent ? "%" : ""}
            </text>
        );
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const { name, value } = payload[0].payload;

            const isPercentage = percentageFields.includes(name);
            const isLowPercent = isPercentage && value < 20;

            const bgColor = isLowPercent ? "#ff4d4d" : "#1eff87"; // rojo o verde

            return (
                <div
                    style={{
                        backgroundColor: bgColor,
                        padding: "6px 10px",
                        borderRadius: "4px",
                        fontSize: 12,
                        color: "#000",
                    }}
                >
                    <p><strong>{name}</strong></p>
                    <p>{value}{isPercentage ? "%" : ""}</p>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="flex justify-center items-center w-full h-full max-w-full max-h-full lg:max-w-[41vw] lg:max-h-[50vh]">
            <div className="w-full h-full bg-[#1c1c1b] p-0 flex flex-col overflow-hidden">

                {/* Título */}
                <div className="text-white text-xl font-semibold font-inter text-center mb-1 pt-4 flex items-center justify-center">
                    <div className="w-[90vw] lg:w-[35vw] border border-[#b7c0cd] bg-[#292d33] rounded-md px-2 py-1">
                        <p className="text-[14px] font-semibold text-white text-center whitespace-nowrap overflow-hidden text-ellipsis">
                            INDICADORES GLOBALES DE RENDIMIENTO
                        </p>
                    </div>
                </div>

                {/* Subtítulo */}
                <p className="text-center text-[8px] leading-[11px] text-[#838382] px-2 mb-1">
                    Esta gráfica muestra indicadores clave de rendimiento como tasas de cumplimiento, montos promedios, tiempos de demora, y porcentajes de mejora o declive en la gestión de multas.
                </p>

                {/* Gráfico */}
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={globalKpi}
                            margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                            barSize={14}
                        >
                            <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                            <XAxis type="number" stroke="#888" />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={70}
                                stroke="#ccc"
                                tick={{ fontSize: 8 }}
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                contentStyle={{
                                    backgroundColor: "#000000",
                                    borderColor: "#7cffcc",
                                    fontSize: 2,
                                    color: "#fff",
                                }}
                                formatter={(value: any, name: any) => {
                                    const isPercent = percentageFields.includes(name);
                                    return [`${value}${isPercent ? "%" : ""}`, name];
                                }}
                            />
                            <Bar dataKey="value" fill="#5996ff" radius={[0, 6, 6, 0]}>
                                <LabelList
                                    dataKey="value"
                                    position="right"
                                    content={renderCustomLabel}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

    );
};
