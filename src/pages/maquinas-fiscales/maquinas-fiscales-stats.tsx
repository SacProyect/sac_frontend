import { useState, useEffect } from 'react';
import { PageHeader, LoadingState, BackButton } from '@/components/UI/v2';
import { MaquinasKpiCards } from '@/components/maquinas-fiscales/maquinas-kpi-cards';
import { MaquinasParroquiaChart } from '@/components/maquinas-fiscales/maquinas-parroquia-chart';
import { MaquinasEnlaceChart } from '@/components/maquinas-fiscales/maquinas-enlace-chart';
import { MaquinasSeveridadChart } from '@/components/maquinas-fiscales/maquinas-severidad-chart';
import { maquinasFiscalesStatsMock } from '@/data/mock-maquinas-fiscales';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Trophy } from 'lucide-react';

export default function MaquinasFiscalesStats() {
  const [loading, setLoading] = useState(true);
  const [stats] = useState(maquinasFiscalesStatsMock);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingState message="Cargando estadísticas..." />;
  }

  return (
    <div className="space-y-6">
      <BackButton to="/maquinas-fiscales" label="Volver al dashboard" />
      <PageHeader
        title="Estadísticas de Máquinas Fiscales"
        description="Análisis ejecutivo y distribución de máquinas por parroquia y severidad"
      />

      {/* KPIs resumidos */}
      <MaquinasKpiCards stats={stats} />

      {/* Gráfico principal: parroquias */}
      <MaquinasParroquiaChart data={stats.porParroquia} />

      {/* Gráficos secundarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MaquinasSeveridadChart data={stats.porSeveridad} />
        <MaquinasEnlaceChart data={{ enlazadas: stats.enlazadas, sinEnlace: stats.sinEnlace }} />
      </div>

      {/* Top Parroquias */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-100 text-sm font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            Top Parroquias con más casos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.parroquiasTop.map((parish, idx) => {
              const maxCount = stats.parroquiasTop[0]?.count || 1;
              const widthPercent = (parish.count / maxCount) * 100;
              return (
                <div key={parish.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 w-5 text-right">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300">{parish.name}</span>
                      <span className="text-xs font-medium text-slate-400">{parish.count.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500/60 rounded-full transition-all duration-500"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
