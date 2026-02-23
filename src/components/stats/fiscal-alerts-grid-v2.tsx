import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { FiscalInfoExtended } from '@/types/fiscal-stats';

interface FiscalAlertsGridV2Props {
  fiscalInfo: FiscalInfoExtended;
}

export function FiscalAlertsGridV2({ fiscalInfo }: FiscalAlertsGridV2Props) {
  const alerts = [
    {
      id: 'vdf-en-plazo',
      title: 'VDF en Plazo',
      value: fiscalInfo.vdfInTime || fiscalInfo.vdfEnPlazo || 0,
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      color: 'green',
    },
    {
      id: 'vdf-fuera-proceso',
      title: 'VDF Fuera de Plazo (Proceso)',
      value: fiscalInfo.vdfOutOfTimeProcess || fiscalInfo.vdfFueraPlazoProceso || 0,
      icon: <Clock className="h-5 w-5 text-yellow-500" />,
      color: 'yellow',
    },
    {
      id: 'vdf-fuera-dejada',
      title: 'VDF Fuera de Plazo (Dejada)',
      value: fiscalInfo.vdfOutOfTimeLeft || fiscalInfo.vdfFueraPlazoDejada || 0,
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      color: 'red',
    },
  ];

  return (
    <Card className="bg-slate-800 border-slate-700 p-6 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
      <h3 className="text-lg font-semibold text-white mb-4">Alertas y Verificaciones</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border-l-4 transition-all duration-200 hover:shadow-md ${
              alert.color === 'green'
                ? 'bg-slate-700 border-green-500 hover:bg-slate-600'
                : alert.color === 'yellow'
                ? 'bg-slate-700 border-yellow-500 hover:bg-slate-600'
                : 'bg-slate-700 border-red-500 hover:bg-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {alert.icon}
                <div>
                  <p className="text-slate-300 text-sm">{alert.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{alert.value}</p>
                </div>
              </div>
              <Badge
                className={
                  alert.color === 'green'
                    ? 'bg-green-600'
                    : alert.color === 'yellow'
                    ? 'bg-yellow-600'
                    : 'bg-red-600'
                }
              >
                {alert.value}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
