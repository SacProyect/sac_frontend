import { FiscalInfoExtended } from '@/types/fiscal-stats';
import { Card } from '@/components/UI/card';
import { Download } from 'lucide-react';
import { Button } from '@/components/UI/button';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { decimalToNumber } from '@/components/utils/number.utils';

interface FiscalReviewPage2Props {
  fiscalInfo: FiscalInfoExtended;
  fiscalTaxpayerCompliance?: {
    high?: any[];
    medium?: any[];
    low?: any[];
  } | null;
  fiscalCollectAnalisis?: any;
}

export function FiscalReviewPage2Cumplimiento({ fiscalInfo, fiscalTaxpayerCompliance, fiscalCollectAnalisis }: FiscalReviewPage2Props) {
  const highCompliance = (fiscalTaxpayerCompliance?.high ?? []).map((t: any) => ({
    id: t.id ?? t.taxpayerId ?? '',
    name: t.name ?? t.businessName ?? t.razonSocial ?? 'N/A',
    rif: t.rif ?? 'N/A',
    value: decimalToNumber(t.complianceRate ?? t.compliance ?? 0),
    total: decimalToNumber(t.totalCollected ?? t.total ?? 0),
  }));

  const mediumCompliance = (fiscalTaxpayerCompliance?.medium ?? []).map((t: any) => ({
    id: t.id ?? t.taxpayerId ?? '',
    name: t.name ?? t.businessName ?? t.razonSocial ?? 'N/A',
    rif: t.rif ?? 'N/A',
    value: decimalToNumber(t.complianceRate ?? t.compliance ?? 0),
    total: decimalToNumber(t.totalCollected ?? t.total ?? 0),
  }));

  const lowCompliance = (fiscalTaxpayerCompliance?.low ?? []).map((t: any) => ({
    id: t.id ?? t.taxpayerId ?? '',
    name: t.name ?? t.businessName ?? t.razonSocial ?? 'N/A',
    rif: t.rif ?? 'N/A',
    value: decimalToNumber(t.complianceRate ?? t.compliance ?? 0),
    total: decimalToNumber(t.totalCollected ?? t.total ?? 0),
  }));

  const chartData = [
    { name: 'Bajo (<33%)', value: lowCompliance.length, color: '#ef4444' },
    { name: 'Medio (34-66%)', value: mediumCompliance.length, color: '#eab308' },
    { name: 'Alto (>67%)', value: highCompliance.length, color: '#22c55e' }
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(val).replace('VES', 'Bs.S');
  };

  const renderTaxpayerList = (title: string, count: number, color: 'green' | 'yellow' | 'red', items: any[]) => {
    const colorClasses = {
      green: { text: 'text-green-400', border: 'border-green-500/50', icon: 'text-green-500', iconBg: 'bg-green-600' },
      yellow: { text: 'text-yellow-400', border: 'border-yellow-500/50', icon: 'text-yellow-500', iconBg: 'bg-yellow-600' },
      red: { text: 'text-red-400', border: 'border-red-500/50', icon: 'text-red-500', iconBg: 'bg-red-600' }
    };
    const theme = colorClasses[color];

    return (
      <Card className="bg-slate-800 border-slate-700 flex flex-col h-[400px] shadow-sm">
        <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between bg-slate-800/80">
          <div className="flex items-center gap-2">
            <span className={theme.icon}>↗</span>
            <h3 className="font-semibold text-white text-sm">{title} ({count})</h3>
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant="outline" className="h-7 w-7 bg-blue-600 border-none text-white hover:bg-blue-700">
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="outline" className="h-7 w-7 bg-green-600 border-none text-white hover:bg-green-700">
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm italic">
              Sin contribuyentes en esta clasificación.
            </div>
          ) : items.map((t, idx) => (
            <div key={idx} className={`rounded-lg p-3 border ${theme.border} bg-slate-800 transition-colors hover:bg-slate-700/80`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3">
                  <div className={`w-6 h-6 rounded-full ${theme.iconBg} flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5`}>
                    {idx + 1}
                  </div>
                  <div className="max-w-[180px] sm:max-w-[220px]">
                    <h4 className="text-white font-medium text-xs truncate" title={t.name}>{t.name}</h4>
                    <p className="text-slate-400 text-[10px] mt-0.5">{t.rif}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`${theme.text} font-bold text-sm`}>{Number(t.value).toFixed(1)}%</p>
                  <p className="text-slate-400 text-[9px]">Cumplimiento</p>
                </div>
              </div>
              <div className="bg-slate-900/60 rounded p-2 flex justify-between items-center">
                <p className="text-slate-400 text-[10px]">Total Pagado</p>
                <p className={`${theme.text} font-bold text-xs`}>{formatCurrency(t.total)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 p-2 rounded shadow-lg">
          <p className="text-slate-300 text-xs font-medium">{payload[0].name}</p>
          <p className="text-white font-bold text-sm">{payload[0].value} contribuyentes</p>
        </div>
      );
    }
    return null;
  };

  const total = chartData.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in duration-300">
      {/* Contribuyentes Alto Cumplimiento */}
      {renderTaxpayerList('Alto Cumplimiento (>67%)', highCompliance.length, 'green', highCompliance)}

      {/* Contribuyentes Medio Cumplimiento */}
      {renderTaxpayerList('Medio Cumplimiento (34-66%)', mediumCompliance.length, 'yellow', mediumCompliance)}

      {/* Contribuyentes Bajo Cumplimiento */}
      {renderTaxpayerList('Bajo Cumplimiento (<33%)', lowCompliance.length, 'red', lowCompliance)}

      {/* Distribución de Cumplimiento — gráfico de dona */}
      <Card className="bg-slate-800 border-slate-700 flex flex-col h-[400px] shadow-sm">
        <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2 bg-slate-800/80 shrink-0">
          <span className="text-purple-400">⏱</span>
          <h3 className="font-semibold text-white text-sm">Distribución de Cumplimiento</h3>
        </div>

        {/* Área del gráfico — toma todo el espacio restante */}
        <div className="flex-1 relative min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Etiqueta central absoluta */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-slate-400 text-[10px] uppercase tracking-widest">Total</span>
            <span className="text-white text-4xl font-bold leading-none mt-0.5">{total}</span>
            <span className="text-slate-500 text-[10px] mt-1">contribuyentes</span>
          </div>
        </div>

        {/* Leyenda fija en la parte inferior */}
        <div className="px-5 pb-4 pt-3 border-t border-slate-700/50 space-y-2 shrink-0">
          {chartData.map((entry, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-300 text-xs">{entry.name}</span>
              </div>
              <span className="font-bold text-white text-sm">{entry.value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
