import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFiscalStats } from '@/hooks/use-fiscal-stats';
import { useAuth } from '@/hooks/use-auth';
import { FiscalProfileCardV2, FiscalPerformanceChartV2, FiscalAlertsGridV2 } from '@/components/stats';
import { YearSelector, LoadingState, ErrorState, PageHeader, BackButton, EmptyState } from '@/components/UI/v2';
import { Card } from '@/components/UI/card';
import { Badge } from '@/components/UI/badge';
import { Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * FiscalStatsDashboardV2 - Dashboard de Estadísticas Individuales del Fiscal
 * 
 * Muestra:
 * - Perfil del fiscal con métricas principales
 * - Gráfico de desempeño mensual vs meta
 * - Alertas y notificaciones
 * - Ranking del fiscal
 */
export default function FiscalStatsDashboardV2() {
  const { fiscalId } = useParams<{ fiscalId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  const effectiveFiscalId = fiscalId || user?.id || '';
  const { loading, error, fiscalPerformance, fiscalInfo } = useFiscalStats(selectedYear, effectiveFiscalId);

  useEffect(() => {
    if (user?.role === 'FISCAL' && user.id !== fiscalId && fiscalId) {
      toast.error('No puede acceder a esta página.');
      navigate('/v2/stats');
    }
  }, [user, fiscalId, navigate]);

  if (loading) {
    return <LoadingState message="Cargando estadísticas del fiscal..." />;
  }

  if (error) {
    return <ErrorState title="Error al cargar las estadísticas" message={error} />;
  }

  if (!fiscalInfo) {
    return <EmptyState title="No se encontraron datos del fiscal" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Estadísticas del Fiscal"
        description="Análisis detallado del desempeño individual"
        action={
          <div className="flex items-center gap-4">
            <BackButton to="/v2/stats" />
            <YearSelector value={selectedYear} onChange={setSelectedYear} />
          </div>
        }
      />

      {/* Profile Card */}
      <FiscalProfileCardV2 fiscal={fiscalInfo} />

      {/* Performance Chart */}
      <FiscalPerformanceChartV2 data={fiscalPerformance} />

      {/* Rankings Card */}
      <Card className="bg-slate-800 border-slate-700 p-6 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <h3 className="text-lg font-semibold text-white">Posición en el Ranking</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-yellow-500">
            #{fiscalInfo.position || 'N/A'}
          </div>
          <div className="flex-1">
            <p className="text-slate-300">
              {fiscalInfo.position === 1
                ? '¡Felicidades! Eres el fiscal con mejor desempeño.'
                : `Estás en el top ${fiscalInfo.position || 'N/A'} de fiscales.`}
            </p>
          </div>
          {fiscalInfo.complianceRate >= 90 && (
            <Badge className="bg-green-600 text-white">Desempeño Excelente</Badge>
          )}
        </div>
      </Card>

      {/* Alerts Grid */}
      <FiscalAlertsGridV2 fiscalInfo={fiscalInfo} />
    </div>
  );
}
