import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FiscalInfoExtended } from '@/types/fiscal-stats';

interface FiscalProfileCardV2Props {
  fiscal: FiscalInfoExtended;
}

export function FiscalProfileCardV2({ fiscal }: FiscalProfileCardV2Props) {
  const completionRate = fiscal.completionRate || 
    (fiscal.totalAssigned > 0 ? Math.round((fiscal.completed / fiscal.totalAssigned) * 100) : 0);

  const initials = fiscal.name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'F';

  return (
    <Card className="bg-gradient-to-r from-slate-800 to-slate-800 border-slate-700 p-6 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 bg-blue-600 border-2 border-blue-500">
            <AvatarFallback className="text-white font-bold text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">{fiscal.name || fiscal.nombre || 'N/A'}</h2>
            <p className="text-slate-400 text-sm mt-1">ID: {fiscal.id || fiscal.fiscalId || 'N/A'}</p>
            <div className="flex gap-2 mt-3">
              <Badge className="bg-blue-600 text-white">
                Posición #{fiscal.position || fiscal.posicionRanking || 'N/A'}
              </Badge>
              {completionRate >= 90 && (
                <Badge className="bg-green-600 text-white">
                  Desempeño Excelente
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">
              {fiscal.totalAssigned || fiscal.totalAsignados || 0}
            </p>
            <p className="text-xs text-slate-400 mt-2">Total Asignados</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">
              {fiscal.completed || fiscal.completados || 0}
            </p>
            <p className="text-xs text-slate-400 mt-2">Completados</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-400">
              {fiscal.pending || fiscal.pendientes || 0}
            </p>
            <p className="text-xs text-slate-400 mt-2">Pendientes</p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <p className="text-slate-300">Cumplimiento General</p>
          <p className="text-2xl font-bold text-white">{completionRate}%</p>
        </div>
        <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
