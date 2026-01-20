import { getFiscalTaxpayerCompliance } from '@/components/utils/api/reportFunctions';
import { FiscalInfo } from '@/types/reports';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PieChart as PieChartIcon } from 'lucide-react';

interface ComplianceDistributionChartProps {
    fiscalData: FiscalInfo;
    year: number;
}

interface ComplianceData {
    high: number;
    medium: number;
    low: number;
}

const COLORS = {
    high: '#22c55e',    // Verde
    medium: '#eab308',  // Amarillo
    low: '#ef4444',     // Rojo
};

function ComplianceDistributionChart({ fiscalData, year }: ComplianceDistributionChartProps) {
    const [complianceData, setComplianceData] = useState<ComplianceData>({
        high: 0,
        medium: 0,
        low: 0,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getFiscalTaxpayerCompliance(fiscalData.fiscalId, year);
                
                setComplianceData({
                    high: response.high?.length || 0,
                    medium: response.medium?.length || 0,
                    low: response.low?.length || 0,
                });
            } catch (e) {
                console.error("Error al obtener datos de cumplimiento:", e);
                toast.error("No se pudo obtener la distribución de cumplimiento.", {
                    id: 'compliance-distribution-error',
                    duration: 3000
                });
            }
        };
        fetchData();
    }, [year, fiscalData.fiscalId]);

    const chartData = [
        {
            name: 'Alto Cumplimiento',
            value: complianceData.high,
            color: COLORS.high,
        },
        {
            name: 'Medio Cumplimiento',
            value: complianceData.medium,
            color: COLORS.medium,
        },
        {
            name: 'Bajo Cumplimiento',
            value: complianceData.low,
            color: COLORS.low,
        },
    ].filter(item => item.value > 0); // Solo mostrar categorías con datos

    const total = complianceData.high + complianceData.medium + complianceData.low;

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
            return (
                <div className="bg-[#2a2a29] border border-[#3a3a39] rounded-lg p-3 shadow-lg">
                    <p className="text-white font-semibold">{data.name}</p>
                    <p className="text-gray-300">
                        <span className="font-bold" style={{ color: data.payload.color }}>
                            {data.value}
                        </span>
                        {' '}contribuyentes ({percentage}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent < 0.05) return null; // No mostrar etiquetas muy pequeñas

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                className="text-sm font-semibold"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="bg-[#2a2a29] border border-[#3a3a39] text-white rounded-xl lg:h-[35vh]">
            <div className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2 pt-4 pl-4 text-base font-semibold">
                    <PieChartIcon className="w-4 h-4 text-purple-500" />
                    Distribución de Cumplimiento
                </div>
            </div>
            <div className="pt-0 px-4 pb-4">
                {total === 0 ? (
                    <div className="flex items-center justify-center h-[25vh] text-gray-400">
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
                                fill="#8884d8"
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
                                    <span style={{ color: entry.color, fontSize: '12px' }}>
                                        {value}: {entry.payload.value} contribuyentes
                                    </span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
                {/* Resumen numérico */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="bg-[#1a1a19] border border-green-500/30 rounded-md p-2 text-center">
                        <div className="text-lg font-bold text-green-400">{complianceData.high}</div>
                        <div className="text-xs text-green-300">Alto</div>
                    </div>
                    <div className="bg-[#1a1a19] border border-yellow-500/30 rounded-md p-2 text-center">
                        <div className="text-lg font-bold text-yellow-400">{complianceData.medium}</div>
                        <div className="text-xs text-yellow-300">Medio</div>
                    </div>
                    <div className="bg-[#1a1a19] border border-red-500/30 rounded-md p-2 text-center">
                        <div className="text-lg font-bold text-red-400">{complianceData.low}</div>
                        <div className="text-xs text-red-300">Bajo</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ComplianceDistributionChart;
