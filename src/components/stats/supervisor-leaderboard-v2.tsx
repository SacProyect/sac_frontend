import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Badge } from '@/components/UI/badge';
import { Users } from 'lucide-react';
import { SupervisorLeaderboardData } from '@/hooks/use-fiscal-stats';

interface SupervisorLeaderboardV2Props {
  data: SupervisorLeaderboardData[];
}

export function SupervisorLeaderboardV2({ data }: SupervisorLeaderboardV2Props) {
  const sortedSupervisors = [...data].sort((a, b) => b.cumplimiento - a.cumplimiento);

  if (data.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Top Coordinadores
          </CardTitle>
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
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          Top Coordinadores
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedSupervisors.map((supervisor, index) => (
          <div
            key={supervisor.id}
            className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
              index === 0
                ? 'bg-gradient-to-r from-blue-900 to-blue-800 border border-blue-700 hover:from-blue-800 hover:to-blue-700'
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 flex items-center justify-center font-bold text-slate-300">
                #{index + 1}
              </div>
              <div>
                <p className="font-semibold text-white">{supervisor.nombre}</p>
                <p className="text-xs text-slate-400">
                  Cumplimiento: {supervisor.cumplimiento}%
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-blue-400">
                {new Intl.NumberFormat('es-VE', {
                  style: 'currency',
                  currency: 'VES',
                  notation: 'compact',
                }).format(supervisor.recaudacionMensual)}
              </p>
              <Badge
                className={`mt-1 ${
                  supervisor.cumplimiento >= 90
                    ? 'bg-green-600'
                    : supervisor.cumplimiento >= 75
                    ? 'bg-yellow-600'
                    : 'bg-red-600'
                }`}
              >
                {supervisor.cumplimiento >= 90
                  ? 'Excelente'
                  : supervisor.cumplimiento >= 75
                  ? 'Bueno'
                  : 'Mejorable'}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
