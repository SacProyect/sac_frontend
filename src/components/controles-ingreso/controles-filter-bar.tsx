import { Tabs, TabsList, TabsTrigger } from '@/components/UI/tabs';
import { Input } from '@/components/UI/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/select';
import { Search } from 'lucide-react';
import type { ControlIngresoStatus, Coordinacion } from '@/types/controles-ingreso';
import { COORDINACION_LABELS } from '@/types/controles-ingreso';

export type ControlesTab = 'todos' | ControlIngresoStatus;

interface ControlesFilterBarProps {
  activeTab: ControlesTab;
  onTabChange: (tab: ControlesTab) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  coordinacionFilter: Coordinacion | 'all';
  onCoordinacionChange: (value: Coordinacion | 'all') => void;
  counts: Record<ControlesTab, number>;
}

export function ControlesFilterBar({
  activeTab,
  onTabChange,
  searchValue,
  onSearchChange,
  coordinacionFilter,
  onCoordinacionChange,
  counts,
}: ControlesFilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Tabs por estado */}
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as ControlesTab)}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          {(['todos', 'borrador', 'en_revision', 'emitido', 'notificado', 'cerrado'] as const).map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400 gap-1.5 text-xs"
            >
              {tab === 'todos' ? 'Todos' : tab === 'en_revision' ? 'Revisión' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="ml-1 text-[10px] bg-slate-700 px-1.5 py-0.5 rounded-full">{counts[tab]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Búsqueda + Coordinación */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por RIF, nombre o expediente..."
            className="pl-10 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
          />
        </div>
        <Select value={coordinacionFilter} onValueChange={(v) => onCoordinacionChange(v as Coordinacion | 'all')}>
          <SelectTrigger className="w-full sm:w-52 bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Todas las coordinaciones" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">Todas las coordinaciones</SelectItem>
            {(Object.keys(COORDINACION_LABELS) as Coordinacion[]).map((key) => (
              <SelectItem key={key} value={key}>{COORDINACION_LABELS[key]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
