import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';

interface ParishData {
  name: string;
  sinMaquina: number;
  conMaquina: number;
}

interface MaquinasParroquiaChartProps {
  data: ParishData[];
}

export function MaquinasParroquiaChart({ data }: MaquinasParroquiaChartProps) {
  // Ordenar por sinMaquina descendente
  const sorted = [...data].sort((a, b) => b.sinMaquina - a.sinMaquina);

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-100 text-sm font-semibold">
          Sin máquina fiscal por parroquia
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.3)" />
            <XAxis type="number" stroke="rgb(148,163,184)" style={{ fontSize: '11px' }} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="rgb(148,163,184)"
              style={{ fontSize: '11px' }}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#e2e8f0',
              }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(value: number) => [`${value} contribuyentes`, 'Sin máquina']}
            />
            <Bar dataKey="sinMaquina" radius={[0, 4, 4, 0]} name="Sin máquina">
              {sorted.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.sinMaquina > 0 ? '#f97316' : '#64748b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
