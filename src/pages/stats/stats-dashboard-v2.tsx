import { useState } from 'react';
import { useFiscalStats } from '@/hooks/use-fiscal-stats';
import { MetricCardV2, MonthlyRevenueChartV2, ComplianceDistributionChartV2, FiscalLeaderboardV2, SupervisorLeaderboardV2 } from '@/components/stats';
import { YearSelector, LoadingState, ErrorState, PageHeader } from '@/components/UI/v2';
import { BarChart3, Users, TrendingUp, AlertCircle } from 'lucide-react';

/**
 * StatsDashboardV2 - Dashboard de Estadísticas Globales
 * 
 * Muestra:
 * - KPIs principales (Total Contribuyentes, Recaudación, Excedente, Morosidad)
 * - Gráfico de Recaudación Mensual
 * - Gráfico de Distribución de Cumplimiento
 * - Leaderboard de Fiscales
 * - Leaderboard de Coordinadores
 */
export default function StatsDashboardV2() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const { loading, error, monthlyRevenue, complianceDistribution, fiscalLeaderboard, supervisorLeaderboard, globalKPI } = useFiscalStats(selectedYear);

  // Calcular KPIs desde los datos
  const totalContribuyentes = globalKPI?.totalContribuyentes || 0;
  const recaudacionTotal = globalKPI?.recaudacionTotal || fiscalLeaderboard.reduce((sum, f) => sum + f.recaudacion, 0);
  const promedioExcedente = globalKPI?.promedioExcedente || 
    (fiscalLeaderboard.length > 0
      ? Math.round(
          (fiscalLeaderboard.reduce((sum, f) => sum + (f.recaudacion - f.meta), 0) / fiscalLeaderboard.length / (fiscalLeaderboard[0]?.meta || 1)) * 100
        )
      : 0);
  const totalVdfFuera = fiscalLeaderboard.reduce((sum, f) => sum + f.vdfFueraPlazoProceso + f.vdfFueraPlazoDejada, 0);
  const totalVdf = fiscalLeaderboard.reduce((sum, f) => sum + f.vdfEnPlazo + f.vdfFueraPlazoProceso + f.vdfFueraPlazoDejada, 0);
  const morosityRate = totalVdf > 0 ? Math.round((totalVdfFuera / totalVdf) * 100) : 0;
  const monthlyTrend = globalKPI?.monthlyTrend || 0;

  if (loading) {
    return <LoadingState message="Cargando estadísticas..." />;
  }

  if (error) {
    return <ErrorState title="Error al cargar las estadísticas" message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <PageHeader
        title="Estadísticas Globales"
        description="Dashboard de indicadores clave y análisis de desempeño"
        action={<YearSelector value={selectedYear} onChange={setSelectedYear} />}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCardV2
          title="Total Contribuyentes"
          value={totalContribuyentes}
          format="number"
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCardV2
          title="Recaudación Total"
          value={recaudacionTotal}
          format="currency"
          trend={{ value: monthlyTrend, direction: monthlyTrend >= 0 ? 'up' : 'down' }}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <MetricCardV2
          title="Promedio Excedente vs Meta"
          value={promedioExcedente}
          format="percentage"
          trend={{ value: 5, direction: 'up' }}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricCardV2
          title="% Morosidad VDF"
          value={morosityRate}
          format="percentage"
          trend={{ value: 2, direction: 'down' }}
          icon={<AlertCircle className="h-5 w-5" />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyRevenueChartV2 data={monthlyRevenue} />
        <ComplianceDistributionChartV2 data={complianceDistribution} />
      </div>

      {/* Leaderboards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FiscalLeaderboardV2 data={fiscalLeaderboard} />
        <SupervisorLeaderboardV2 data={supervisorLeaderboard} />
      </div>
    </div>
  );
}
