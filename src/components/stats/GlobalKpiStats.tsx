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

export const GlobalKPIStats = ({globalKpi}: GlobalKPIProps) => {
    // const sampleKPIData: KPIStat[] = [
    //     { name: "Tasa de cumplimiento", value: 78 },
    //     { name: "Monto promedio de multa", value: 100 },
    //     { name: "Demora promedio", value: 12 },
    //     { name: "Contribuyentes cumplidores", value: 62 },
    //     { name: "Declive en rendimiento", value: 15 },
    //     { name: "multas promedio", value: 6 },
    // ];

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
                y={Number(y) + numericHeight / 2 + 4}
                fill="#fff"
                fontSize={12}
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

            const bgColor =  isLowPercent ? "#ff4d4d" : "#1eff87"; // rojo o verde

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
        <div className="flex justify-center items-center w-1/2">
            <div className="w-full h-full bg-[#1c1c1b] p-2">
                {/* Título */}
                <div className="text-white text-xl font-semibold font-inter text-center mb-2 pt-2 flex items-center justify-center">
                    <div className="flex items-center justify-center w-[600px] border border-[#b7c0cd] bg-[#292d33] rounded-md">
                        <p className="w-full font-semibold text-[24.5px] py-1 px-4 text-white font-inter whitespace-nowrap">
                            INDICADORES GLOBALES DE RENDIMIENTO
                        </p>
                    </div>
                </div>

                {/* Subtítulo */}
                <p className=" mt-4 text-center px-16 mb-4  text-[9.4px] leading-[12.9px] text-[#838382] font-inter">
                    Esta gráfica muestra indicadores clave de rendimiento como tasas de cumplimiento, montos promedios, tiempos de demora, y porcentajes de mejora o declive en la gestión de multas.
                </p>

                {/* Gráfico */}
                <div className="w-full h-[40vh]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={globalKpi}
                            margin={{ top: 10, right: 60, left: 0, bottom: 20 }}
                            barSize={20}
                        >
                            <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                            <XAxis type="number" stroke="#888" />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={120}
                                stroke="#ccc"
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                contentStyle={{
                                    backgroundColor: "#000000",
                                    borderColor: "#7cffcc",
                                    fontSize: 10,
                                    color: "#fff"
                                }}
                                formatter={(value: any, name: any) => {
                                    const isPercent = percentageFields.includes(name);
                                    return [`${value}${isPercent ? "%" : ""}`, name];
                                }}
                            />
                            <Bar dataKey="value" fill="#5996ff" radius={[0, 10, 10, 0]}>
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
