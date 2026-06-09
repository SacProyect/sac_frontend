import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';

interface SeveridadData {
  name: string;
  count: number;
  fill: string;
}

interface MaquinasSeveridadChartProps {
  data: SeveridadData[];
}

export function MaquinasSeveridadChart({ data }: MaquinasSeveridadChartProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-100 text-sm font-semibold">
          Distribución por severidad
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.3)" />
            <XAxis dataKey="name" stroke="rgb(148,163,184)" style={{ fontSize: '11px' }} />
            <YAxis stroke="rgb(148,163,184)" style={{ fontSize: '11px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#e2e8f0',
              }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(value: number) => [`${value} máquinas`]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Máquinas">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
