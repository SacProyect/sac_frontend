import { Tabs, TabsList, TabsTrigger } from '@/components/UI/tabs';
import { AlertTriangle, Ban, Star, LayoutGrid } from 'lucide-react';

export type MaquinaTab = 'sin_transmitir' | 'sin_maquina' | 'especiales' | 'todos';

interface MaquinasFilterTabsProps {
  activeTab: MaquinaTab;
  onTabChange: (tab: MaquinaTab) => void;
  counts: {
    sin_transmitir: number;
    sin_maquina: number;
    especiales: number;
    todos: number;
  };
}

export function MaquinasFilterTabs({ activeTab, onTabChange, counts }: MaquinasFilterTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as MaquinaTab)}>
      <TabsList className="bg-slate-800/50 border border-slate-700/50">
        <TabsTrigger
          value="sin_transmitir"
          className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 gap-1.5"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Sin transmitir
          <span className="ml-1 text-[10px] bg-slate-700 px-1.5 py-0.5 rounded-full">{counts.sin_transmitir}</span>
        </TabsTrigger>
        <TabsTrigger
          value="sin_maquina"
          className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 gap-1.5"
        >
          <Ban className="h-3.5 w-3.5" />
          Sin máquina
          <span className="ml-1 text-[10px] bg-slate-700 px-1.5 py-0.5 rounded-full">{counts.sin_maquina}</span>
        </TabsTrigger>
        <TabsTrigger
          value="especiales"
          className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 gap-1.5"
        >
          <Star className="h-3.5 w-3.5" />
          Especiales
          <span className="ml-1 text-[10px] bg-slate-700 px-1.5 py-0.5 rounded-full">{counts.especiales}</span>
        </TabsTrigger>
        <TabsTrigger
          value="todos"
          className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400 gap-1.5"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Todos
          <span className="ml-1 text-[10px] bg-slate-700 px-1.5 py-0.5 rounded-full">{counts.todos}</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
