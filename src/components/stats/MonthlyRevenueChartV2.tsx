import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MonthlyRevenueData } from '@/hooks/useFiscalStats';

interface MonthlyRevenueChartV2Props {
  data: MonthlyRevenueData[];
}

export function MonthlyRevenueChartV2({ data }: MonthlyRevenueChartV2Props) {
  return (
    <Card className="bg-slate-800 border-slate-700 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-white">Recaudación Mensual IVA</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="mes" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#e2e8f0',
              }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(value: number | string) =>
                new Intl.NumberFormat('es-VE', {
                  style: 'currency',
                  currency: 'VES',
                  notation: 'compact',
                }).format(Number(value))
              }
            />
            <Legend wrapperStyle={{ paddingTop: '20px', color: '#94a3b8' }} />
            <Bar
              dataKey="recaudacion"
              fill="#3b82f6"
              name="Recaudación (Bs.S)"
              radius={[8, 8, 0, 0]}
            />
            <Brush dataKey="mes" height={30} stroke="#475569" fill="#334155" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
