import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, LoadingState, EmptyState } from '@/components/UI/v2';
import { MaquinasKpiCards } from '@/components/maquinas-fiscales/maquinas-kpi-cards';
import { MaquinasFilterTabs, type MaquinaTab } from '@/components/maquinas-fiscales/maquinas-filter-tabs';
import { MaquinasSearchBar } from '@/components/maquinas-fiscales/maquinas-search-bar';
import { MaquinasTable } from '@/components/maquinas-fiscales/maquinas-table';
import { MaquinasQuickDetailDrawer } from '@/components/maquinas-fiscales/maquinas-quick-detail-drawer';
import { maquinasFiscalesMock, maquinasFiscalesStatsMock } from '@/data/mock-maquinas-fiscales';
import type { MachineMock } from '@/types/maquinas-fiscales';
import { useDebounce } from '@/hooks/use-debounce';
import { RefreshCw, BarChart3, Cpu, Building2 } from 'lucide-react';
import { Button } from '@/components/UI/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/UI/tabs';
import { EntidadesTab } from '@/components/maquinas-fiscales/entidades-tab';

export default function MaquinasFiscalesDashboard() {
  const [loading, setLoading] = useState(true);
  const [machines, setMachines] = useState<MachineMock[]>([]);
  const [stats] = useState(maquinasFiscalesStatsMock);
  const [activeTab, setActiveTab] = useState<MaquinaTab>('todos');
  const [searchValue, setSearchValue] = useState('');
  const [selectedMachine, setSelectedMachine] = useState<MachineMock | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mainTab, setMainTab] = useState<"maquinas" | "entidades">("maquinas");

  const debouncedSearch = useDebounce(searchValue.toLowerCase(), 300);

  // Simular carga de datos
  useEffect(() => {
    const timer = setTimeout(() => {
      setMachines(maquinasFiscalesMock);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Filtrado por tab
  const tabFiltered = useMemo(() => {
    switch (activeTab) {
      case 'sin_transmitir':
        return machines.filter(m => (m.diasSinTransmitir ?? 0) >= 30);
      case 'sin_maquina':
        return machines.filter(m => m.machineState === 'no_machine');
      case 'especiales':
        return machines.filter(m => m.contribuyenteTipo === 'ESPECIAL');
      case 'todos':
      default:
        return machines;
    }
  }, [machines, activeTab]);

  // Filtrado por búsqueda
  const filteredMachines = useMemo(() => {
    if (!debouncedSearch.trim()) return tabFiltered;
    return tabFiltered.filter(m =>
      m.rif.toLowerCase().includes(debouncedSearch) ||
      m.razonsocial.toLowerCase().includes(debouncedSearch) ||
      m.serial.toLowerCase().includes(debouncedSearch)
    );
  }, [tabFiltered, debouncedSearch]);

  // Conteos para tabs
  const counts = useMemo(() => ({
    sin_transmitir: machines.filter(m => (m.diasSinTransmitir ?? 0) >= 30).length,
    sin_maquina: machines.filter(m => m.machineState === 'no_machine').length,
    especiales: machines.filter(m => m.contribuyenteTipo === 'ESPECIAL').length,
    todos: machines.length,
  }), [machines]);

  const handleRowClick = (machine: MachineMock) => {
    setSelectedMachine(machine);
    setDrawerOpen(true);
  };

  if (loading) {
    return <LoadingState message="Cargando Máquinas Fiscales..." />;
  }

  return (
    <div className="space-y-6">
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "maquinas" | "entidades")}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="maquinas" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Cpu className="mr-2 h-4 w-4" />
            Máquinas Fiscales
          </TabsTrigger>
          <TabsTrigger value="entidades" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Building2 className="mr-2 h-4 w-4" />
            Entidades
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {mainTab === "maquinas" && (
        <>
          <PageHeader
            title="Máquinas Fiscales"
            description="Monitoreo y control de máquinas fiscales del municipio Libertador"
            action={
              <div className="flex items-center gap-2">
                <Link to="/maquinas-fiscales/estadisticas">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Estadísticas
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="border-slate-700 text-slate-400 hover:text-slate-200"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            }
          />

          {/* KPIs — 8 métricas en 2 filas */}
          <MaquinasKpiCards stats={stats} />

          {/* Filtros y búsqueda */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <MaquinasFilterTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              counts={counts}
            />
            <div className="w-full sm:w-72">
              <MaquinasSearchBar value={searchValue} onValueChange={setSearchValue} />
            </div>
          </div>

          {/* Tabla */}
          {filteredMachines.length === 0 ? (
            <EmptyState
              title="Sin resultados"
              message="No se encontraron máquinas con los filtros aplicados."
            />
          ) : (
            <MaquinasTable machines={filteredMachines} onRowClick={handleRowClick} />
          )}

          {/* Drawer de detalle rápido */}
          <MaquinasQuickDetailDrawer
            machine={selectedMachine}
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
          />
        </>
      )}

      {mainTab === "entidades" && <EntidadesTab />}
    </div>
  );
}
