import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

const COLORS = {
    high: "#22c55e",   // Verde
    medium: "#eab308", // Amarillo
    low: "#ef4444",    // Rojo
};

export interface ComplianceDistributionChartProps {
    highComplianceCount: number;
    mediumComplianceCount: number;
    lowComplianceCount: number;
}

export default function ComplianceDistributionChart({
    highComplianceCount,
    mediumComplianceCount,
    lowComplianceCount,
}: ComplianceDistributionChartProps) {
    const total = highComplianceCount + mediumComplianceCount + lowComplianceCount;

    const chartData = [
        { name: "Alto Cumplimiento", value: highComplianceCount, color: COLORS.high },
        { name: "Medio Cumplimiento", value: mediumComplianceCount, color: COLORS.medium },
        { name: "Bajo Cumplimiento", value: lowComplianceCount, color: COLORS.low },
    ].filter((x) => x.value > 0);

    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload?.length) return null;
        const data = payload[0];
        const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : "0.0";

        return (
            <div className="bg-[#2a2a29] border border-[#3a3a39] rounded-lg p-3 shadow-lg">
                <p className="text-white font-semibold">{data.name}</p>
                <p className="text-gray-300">
                    <span className="font-bold" style={{ color: data.payload.color }}>
                        {data.value}
                    </span>{" "}
                    contribuyentes ({percentage}%)
                </p>
            </div>
        );
    };

    const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        if (percent < 0.05) return null;
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? "start" : "end"}
                dominantBaseline="central"
                className="text-sm font-semibold"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="bg-[#2a2a29] border border-[#3a3a39] text-white rounded-xl lg:h-[50vh]">
            <div className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2 pt-4 pl-4 text-base font-semibold">
                    <PieChartIcon className="w-4 h-4 text-purple-500" />
                    Distribución de Cumplimiento
                </div>
            </div>

            <div className="pt-0 px-4 pb-4">
                {total === 0 ? (
                    <div className="flex items-center justify-center h-[35vh] text-gray-400">
                        <p>No hay datos de cumplimiento disponibles</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={CustomLabel}
                                outerRadius={80}
                                innerRadius={50}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value, entry: any) => (
                                    <span style={{ color: entry.color, fontSize: "12px" }}>
                                        {value}: {entry.payload.value}
                                    </span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}

                <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="bg-[#1a1a19] border border-green-500/30 rounded-md p-2 text-center">
                        <div className="text-lg font-bold text-green-400">{highComplianceCount}</div>
                        <div className="text-xs text-green-300">Alto</div>
                    </div>
                    <div className="bg-[#1a1a19] border border-yellow-500/30 rounded-md p-2 text-center">
                        <div className="text-lg font-bold text-yellow-400">{mediumComplianceCount}</div>
                        <div className="text-xs text-yellow-300">Medio</div>
                    </div>
                    <div className="bg-[#1a1a19] border border-red-500/30 rounded-md p-2 text-center">
                        <div className="text-lg font-bold text-red-400">{lowComplianceCount}</div>
                        <div className="text-xs text-red-300">Bajo</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

