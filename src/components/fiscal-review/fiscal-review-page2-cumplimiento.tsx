import { FiscalInfoExtended } from '@/types/fiscal-stats';
import { Card } from '@/components/UI/card';
import { Download } from 'lucide-react';
import { Button } from '@/components/UI/button';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface FiscalReviewPage2Props {
  fiscalInfo: FiscalInfoExtended;
}

export function FiscalReviewPage2Cumplimiento({ fiscalInfo }: FiscalReviewPage2Props) {
  // Mock data as seen on the second page image
  const highCompliance = [
    { id: '1', name: 'Taller Hermanos Contreras, CA', rif: 'J295609213', value: 83.33, total: 0 }
  ];
  
  const mediumCompliance = [
    { id: '1', name: 'INVERSIONES TAJOMAR C.A.', rif: 'J001335072', value: 70.83, total: 0 },
    { id: '2', name: 'CORPORACION MAXIPLAST 22 C.A', rif: 'J405400211', value: 64.57, total: 0 },
    { id: '3', name: 'DISTRIBUIDORA J.A, C.A', rif: 'J408821211', value: 45.10, total: 0 },
    { id: '4', name: 'MUNDO DEPORTIVO, C.A', rif: 'J304412311', value: 38.50, total: 0 }
  ];

  const lowCompliance = [
    { id: '1', name: 'CANDELARIA ME, C.A', rif: 'J504759678', value: 49.88, total: 0 },
    { id: '2', name: 'IMPORPRODUCTOS J.M, C.A', rif: 'J407021234', value: 37.80, total: 0 },
    { id: '3', name: 'COMERCIALIZADORA AAA, C.A', rif: 'J509923112', value: 20.10, total: 0 },
    { id: '4', name: 'INVERSIONES EL SOL, C.A', rif: 'J202231211', value: 15.00, total: 0 },
    { id: '5', name: 'SERVICIOS MULTIPLES, C.A', rif: 'J305541211', value: 5.50, total: 0 }
  ];

  const chartData = [
    { name: 'Bajo Cumplimiento (<33%)', value: 67, color: '#ef4444' }, // Red
    { name: 'Medio Cumplimiento (34-66%)', value: 4, color: '#eab308' }, // Yellow
    { name: 'Alto Cumplimiento (>67%)', value: 1, color: '#22c55e' } // Green
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(val).replace('VES', 'Bs.S');
  };

  const renderTaxpayerList = (title: string, count: number, color: 'green' | 'yellow' | 'red', items: any[]) => {
    const colorClasses = {
      green: {
        text: 'text-green-400',
        border: 'border-green-500/50',
        bg: 'bg-green-500/10',
        icon: 'text-green-500',
        iconBg: 'bg-green-600'
      },
      yellow: {
        text: 'text-yellow-400',
        border: 'border-yellow-500/50',
        bg: 'bg-yellow-500/10',
        icon: 'text-yellow-500',
        iconBg: 'bg-yellow-600'
      },
      red: {
        text: 'text-red-400',
        border: 'border-red-500/50',
        bg: 'bg-red-500/10',
        icon: 'text-red-500',
        iconBg: 'bg-red-600'
      }
    };
    
    const theme = colorClasses[color];

    return (
      <Card className="bg-slate-800 border-slate-700 flex flex-col h-[320px] shadow-sm">
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
          {items.map((t, idx) => (
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
                  <p className={`${theme.text} font-bold text-sm`}>{t.value}%</p>
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
          <p className="text-slate-300 text-xs font-medium">{`${payload[0].name}`}</p>
          <p className="text-white font-bold text-sm">{`${payload[0].value} contribuyentes`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in duration-300">
      {/* Contribuyentes Alto Cumplimiento */}
      {renderTaxpayerList('Contribuyentes Alto Cumplimiento (>67%)', highCompliance.length, 'green', highCompliance)}

      {/* Contribuyentes Medio Cumplimiento */}
      {renderTaxpayerList('Contribuyentes Medio Cumplimiento (34-66%)', 4, 'yellow', mediumCompliance)}

      {/* Contribuyentes Bajo Cumplimiento */}
      {renderTaxpayerList('Contribuyentes Bajo Cumplimiento (<33%)', 67, 'red', lowCompliance)}

      {/* Distribución de Cumplimiento */}
      <Card className="bg-slate-800 border-slate-700 flex flex-col h-[320px] shadow-sm">
        <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2 bg-slate-800/80">
          <span className="text-purple-400">⏱</span>
          <h3 className="font-semibold text-white text-sm">Distribución de Cumplimiento</h3>
        </div>
        <div className="flex-1 p-2 flex flex-col items-center justify-center relative w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={72}
                content={(props) => {
                  const { payload } = props;
                  return (
                    <ul className="flex flex-col gap-1.5 w-full px-6 mt-2">
                      {payload?.map((entry: any, index: number) => (
                        <li key={`item-${index}`} className="flex items-center text-[11px] text-slate-300">
                          <span 
                            className="w-2.5 h-2.5 rounded-full mr-2 shrink-0" 
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="truncate flex-1">{entry.value}</span>
                          <span className="font-bold text-white ml-2">{entry.payload.value}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <span className="text-slate-400 text-[10px] block">Total</span>
            <span className="text-white text-xl font-bold">72</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
