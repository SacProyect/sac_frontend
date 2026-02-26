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

  // KPIs desde los datos del API
  const totalTaxpayers = globalKPI?.totalTaxpayers || 0;
  const totalTaxCollection = globalKPI?.totalTaxCollection || fiscalLeaderboard.reduce((sum, f) => sum + f.recaudacion, 0);
  const averageCreditSurplus = globalKPI?.averageCreditSurplus || 0;
  const delinquencyRate = globalKPI?.delinquencyRate || 0;
  const growthRate = globalKPI?.growthRate || 0;
  const finePercentage = globalKPI?.finePercentage || 0;

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
          value={totalTaxpayers}
          format="number"
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCardV2
          title="Recaudación Total"
          value={totalTaxCollection}
          format="currency"
          trend={{ value: growthRate, direction: growthRate >= 0 ? 'up' : 'down' }}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <MetricCardV2
          title="Promedio Excedente"
          value={averageCreditSurplus}
          format="currency"
          trend={{ value: finePercentage, direction: 'up' }}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricCardV2
          title="% Morosidad"
          value={delinquencyRate}
          format="percentage"
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
