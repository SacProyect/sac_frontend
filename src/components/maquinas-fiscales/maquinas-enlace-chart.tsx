import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';

interface EnlaceData {
  enlazadas: number;
  sinEnlace: number;
}

interface MaquinasEnlaceChartProps {
  data: EnlaceData;
}

const COLORS = ['#22c55e', '#eab308'];

export function MaquinasEnlaceChart({ data }: MaquinasEnlaceChartProps) {
  const chartData = [
    { name: 'Enlazadas', value: data.enlazadas },
    { name: 'Sin enlace', value: data.sinEnlace },
  ].filter(d => d.value > 0);

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-100 text-sm font-semibold">
          Enlazadas vs Sin enlace
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#e2e8f0',
              }}
              formatter={(value: number) => [`${value} máquinas`]}
            />
            <Legend wrapperStyle={{ paddingTop: '10px', color: '#94a3b8', fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
