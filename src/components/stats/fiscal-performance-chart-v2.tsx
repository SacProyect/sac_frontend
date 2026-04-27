import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/card';
import { FiscalPerformanceData } from '@/hooks/use-fiscal-stats';

interface FiscalPerformanceChartV2Props {
  data: FiscalPerformanceData[];
}

export function FiscalPerformanceChartV2({ data }: FiscalPerformanceChartV2Props) {
  if (data.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-white">Desempeño Personal</CardTitle>
          <CardDescription className="text-slate-400">
            Comparativo de desempeño vs meta mensual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-center py-8">No hay datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-white">Desempeño Personal {new Date().getFullYear()}</CardTitle>
        <CardDescription className="text-slate-400">
          Comparativo de desempeño vs meta mensual
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.3)" />
            <XAxis dataKey="mes" stroke="rgb(148,163,184)" style={{ fontSize: '12px' }} />
            <YAxis stroke="rgb(148,163,184)" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#e2e8f0',
              }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px', color: '#94a3b8' }} />
            <Bar dataKey="desempeño" fill="hsl(34 89% 63%)" radius={[4, 4, 0, 0]} name="Desempeño" />
            <Bar dataKey="meta" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} name="Meta" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
