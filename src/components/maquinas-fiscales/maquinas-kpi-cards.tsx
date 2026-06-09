import { Database, Monitor, Ban, AlertTriangle, Clock, Link, Unlink, FileWarning } from 'lucide-react';
import { Card, CardContent } from '@/components/UI/card';
import type { MachineStatsMock } from '@/types/maquinas-fiscales';

interface MaquinasKpiCardsProps {
  stats: MachineStatsMock;
}

export function MaquinasKpiCards({ stats }: MaquinasKpiCardsProps) {
  const primaryCards = [
    { label: 'Total', value: stats.total, icon: Database, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Con Máquina', value: stats.conMaquina, icon: Monitor, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Sin Máquina', value: stats.sinMaquina, icon: Ban, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Críticas', value: stats.criticas1000, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
  ];

  const secondaryCards = [
    { label: 'En Alerta', value: stats.enAlerta, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Enlazadas', value: stats.enlazadas, icon: Link, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Sin Enlace', value: stats.sinEnlace, icon: Unlink, color: 'text-slate-400', bg: 'bg-slate-500/10' },
    { label: 'RIF Vencidos', value: stats.rifVencidos, icon: FileWarning, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="space-y-3">
      {/* Fila 1: Métricas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {primaryCards.map((card) => (
          <Card key={card.label} className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{card.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                </div>
                <div className={`${card.bg} p-2 rounded-lg`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Fila 2: Métricas de acción */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {secondaryCards.map((card) => (
          <Card key={card.label} className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{card.label}</p>
                  <p className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                </div>
                <div className={`${card.bg} p-1.5 rounded-lg`}>
                  <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
