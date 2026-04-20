import { useState } from 'react';
import { Card } from '@/components/UI/card';
import { Label } from '@/components/UI/label';
import { Switch } from '@/components/UI/switch';
import { Bell, AlertCircle, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

export function NotificationsTabV2() {
  const [notifications, setNotifications] = useState({
    vdfExpired: true,
    dailyReports: false,
    newContribuyentes: true,
    multas: true,
    sistemaMaintenance: true,
  });

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    
    // TODO: Conectar a API para guardar preferencias
    // Por ahora solo mostramos un toast
    toast.success(`Notificación ${notifications[key] ? 'desactivada' : 'activada'}`);
  };

  return (
    <Card className="bg-slate-800 border-slate-700 p-6 space-y-6 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Preferencias de Notificaciones</h3>
        <p className="text-slate-400 text-sm">Controla qué notificaciones deseas recibir</p>
      </div>

      <div className="space-y-4 border-t border-slate-700 pt-6">
        {/* Alertas de VDF Vencidos */}
        <div className="flex items-start justify-between p-4 bg-slate-900 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="text-white font-medium">Alertas de VDF Vencidos</p>
              <p className="text-slate-400 text-sm mt-1">
                Recibe notificaciones cuando haya VDF próximos a vencer
              </p>
            </div>
          </div>
          <Switch
            checked={notifications.vdfExpired}
            onCheckedChange={() => handleToggle('vdfExpired')}
          />
        </div>

        {/* Reportes Diarios */}
        <div className="flex items-start justify-between p-4 bg-slate-900 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
          <div className="flex items-start gap-3">
            <BarChart3 className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-white font-medium">Reportes Diarios</p>
              <p className="text-slate-400 text-sm mt-1">
                Recibe un resumen diario de actividades y recaudaciones
              </p>
            </div>
          </div>
          <Switch
            checked={notifications.dailyReports}
            onCheckedChange={() => handleToggle('dailyReports')}
          />
        </div>

        {/* Nuevos Contribuyentes */}
        <div className="flex items-start justify-between p-4 bg-slate-900 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-white font-medium">Nuevos Contribuyentes</p>
              <p className="text-slate-400 text-sm mt-1">
                Recibe notificaciones cuando se registren nuevos contribuyentes
              </p>
            </div>
          </div>
          <Switch
            checked={notifications.newContribuyentes}
            onCheckedChange={() => handleToggle('newContribuyentes')}
          />
        </div>

        {/* Notificaciones de Multas */}
        <div className="flex items-start justify-between p-4 bg-slate-900 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-white font-medium">Notificaciones de Multas</p>
              <p className="text-slate-400 text-sm mt-1">
                Recibe alertas cuando se registren nuevas multas
              </p>
            </div>
          </div>
          <Switch
            checked={notifications.multas}
            onCheckedChange={() => handleToggle('multas')}
          />
        </div>

        {/* Mantenimiento del Sistema */}
        <div className="flex items-start justify-between p-4 bg-slate-900 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-purple-500 mt-0.5" />
            <div>
              <p className="text-white font-medium">Mantenimiento del Sistema</p>
              <p className="text-slate-400 text-sm mt-1">
                Recibe notificaciones sobre mantenimientos programados
              </p>
            </div>
          </div>
          <Switch
            checked={notifications.sistemaMaintenance}
            onCheckedChange={() => handleToggle('sistemaMaintenance')}
          />
        </div>
      </div>

      {/* Notification Summary */}
      <div className="border-t border-slate-700 pt-6 bg-slate-900 rounded-lg p-4">
        <p className="text-sm text-slate-300">
          <span className="font-semibold">Notificaciones activas:</span>{' '}
          <span className="text-blue-400">
            {Object.values(notifications).filter((v) => v).length} de{' '}
            {Object.keys(notifications).length}
          </span>
        </p>
      </div>
    </Card>
  );
}
