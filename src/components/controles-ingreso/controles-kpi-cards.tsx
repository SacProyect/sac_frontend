import { FileText, Clock, Eye, Send, Bell, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/UI/card';
import type { ControlesIngresoStats } from '@/types/controles-ingreso';

interface ControlesKpiCardsProps {
  stats: ControlesIngresoStats;
}

export function ControlesKpiCards({ stats }: ControlesKpiCardsProps) {
  const cards = [
    { label: 'Total', value: stats.total, icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Borradores', value: stats.borradores, icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/10' },
    { label: 'En Revisión', value: stats.en_revision, icon: Eye, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Emitidos', value: stats.emitidos, icon: Send, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Notificados', value: stats.notificados, icon: Bell, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Cerrados', value: stats.cerrados, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {cards.map((card) => (
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
  );
}
