import { useState, useEffect } from 'react';
import { RefreshCw, MessageSquare, CheckCircle, Clock, Send, XCircle } from 'lucide-react';
import { Button } from '@/components/UI/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Badge } from '@/components/UI/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { runNotificationCheck, getNotificationStats } from '@/components/utils/api/fiscal-operaciones-functions';
import { isWhatsAppNotificationsEnabled } from '@/config/feature-flags';
import { NotificationQueueStats } from '@/types/repair-reports';

export function NotificationsAdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<NotificationQueueStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getNotificationStats();
      setStats(data);
    } catch (error: any) {
      console.error('Error fetching notification stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCheck = async () => {
    setChecking(true);
    try {
      const result = await runNotificationCheck();
      toast({
        title: 'Check ejecutado',
        description: result.message || 'El check de notificaciones se ejecutó correctamente',
      });
      // Refresh stats after check
      await fetchStats();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Error al ejecutar el check',
        variant: 'destructive',
      });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Only render for ADMIN users when feature flag is enabled
  if (!isWhatsAppNotificationsEnabled || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <Card className="mb-4 border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Notificaciones WhatsApp
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button
              size="sm"
              onClick={handleRunCheck}
              disabled={checking}
            >
              <Send className={`h-3.5 w-3.5 mr-1 ${checking ? 'animate-pulse' : ''}`} />
              Ejecutar check
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {stats ? (
          <div className="grid grid-cols-5 gap-4">
            <StatItem
              icon={<MessageSquare className="h-4 w-4 text-slate-500" />}
              label="Total"
              value={stats.total}
            />
            <StatItem
              icon={<Clock className="h-4 w-4 text-amber-500" />}
              label="Pendientes"
              value={stats.pending}
              highlight={stats.pending > 0}
            />
            <StatItem
              icon={<RefreshCw className="h-4 w-4 text-blue-500" />}
              label="Enviando"
              value={stats.sending}
            />
            <StatItem
              icon={<CheckCircle className="h-4 w-4 text-emerald-500" />}
              label="Enviados"
              value={stats.sent}
            />
            <StatItem
              icon={<XCircle className="h-4 w-4 text-rose-500" />}
              label="Fallidos"
              value={stats.failed}
              highlight={stats.failed > 0}
            />
          </div>
        ) : (
          <div className="text-sm text-slate-500 text-center py-2">
            {loading ? 'Cargando estadísticas...' : 'No hay datos disponibles'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatItem({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className={`text-sm font-medium ${highlight ? 'text-rose-600' : 'text-slate-900'}`}>
          {value}
        </div>
      </div>
    </div>
  );
}
