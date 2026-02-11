import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardV2Props {
  title: string;
  value: string | number;
  format?: 'currency' | 'percentage' | 'number';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  icon?: React.ReactNode;
}

export function MetricCardV2({
  title,
  value,
  format = 'number',
  trend,
  icon,
}: MetricCardV2Props) {
  const formatValue = () => {
    if (format === 'currency') {
      return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
        notation: 'compact',
      }).format(Number(value));
    }
    if (format === 'percentage') {
      return `${value}%`;
    }
    return new Intl.NumberFormat('es-VE').format(Number(value));
  };

  return (
    <Card className="bg-slate-800 border-slate-700 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-300">{title}</CardTitle>
        {icon && <div className="text-2xl text-blue-400">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold text-white">{formatValue()}</div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-sm ${
                trend.direction === 'up' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
