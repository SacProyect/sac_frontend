import { useState, useEffect, useMemo } from 'react';
import { PageHeader, LoadingState, EmptyState } from '@/components/UI/v2';
import { ControlesKpiCards } from '@/components/controles-ingreso/controles-kpi-cards';
import { ControlesFilterBar, type ControlesTab } from '@/components/controles-ingreso/controles-filter-bar';
import { ControlesTable } from '@/components/controles-ingreso/controles-table';
import { listControles, getControlesStats, createControl } from '@/components/utils/api/controles-ingreso-functions';
import type { ControlIngreso, Coordinacion } from '@/types/controles-ingreso';
import { useDebounce } from '@/hooks/use-debounce';
import { Plus } from 'lucide-react';
import { Button } from '@/components/UI/button';
import { NuevoControlDialog } from '@/components/controles-ingreso/nuevo-control-dialog';
import type { CreateControlPayload } from '@/components/utils/api/controles-ingreso-functions';

function toLowerStatus(s: string): string {
  return s.toLowerCase();
}

export default function ControlesDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [controls, setControls] = useState<ControlIngreso[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<ControlesTab>('todos');
  const [searchValue, setSearchValue] = useState('');
  const [coordinacionFilter, setCoordinacionFilter] = useState<Coordinacion | 'all'>('all');
  const [showNuevoControl, setShowNuevoControl] = useState(false);

  const debouncedSearch = useDebounce(searchValue.toLowerCase(), 300);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [controlsRes, statsRes] = await Promise.all([
          listControles({ pageSize: 200 }),
          getControlesStats(),
        ]);
        if (!cancelled) {
          setControls(controlsRes.data.map((c: any) => ({
            ...c,
            status: toLowerStatus(c.status),
            coordination_id: c.coordination_id,
          })));
          setStats(statsRes.stats);
        }
      } catch (err) {
        console.error('Error loading controles:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleNuevoControl = async (payload: CreateControlPayload) => {
    try {
      const res = await createControl(payload);
      if (res.success) {
        setControls(prev => [{ ...res.item, status: toLowerStatus(res.item.status) }, ...prev]);
        setShowNuevoControl(false);
      }
    } catch (err) {
      console.error('Error creating control:', err);
    }
  };

  // Filtrado por tab
  const tabFiltered = useMemo(() => {
    if (activeTab === 'todos') return controls;
    return controls.filter(c => c.status === activeTab);
  }, [controls, activeTab]);

  // Filtrado por coordinación
  const coordFiltered = useMemo(() => {
    if (coordinacionFilter === 'all') return tabFiltered;
    return tabFiltered.filter(c => c.coordination_id === coordinacionFilter);
  }, [tabFiltered, coordinacionFilter]);

  // Filtrado por búsqueda
  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return coordFiltered;
    return coordFiltered.filter(c =>
      c.subject_rif.toLowerCase().includes(debouncedSearch) ||
      c.subject_name.toLowerCase().includes(debouncedSearch) ||
      c.number.toLowerCase().includes(debouncedSearch)
    );
  }, [coordFiltered, debouncedSearch]);

  // Conteos para tabs
  const counts = useMemo(() => ({
    todos: controls.length,
    borrador: controls.filter(c => c.status === 'borrador').length,
    en_revision: controls.filter(c => c.status === 'en_revision').length,
    emitido: controls.filter(c => c.status === 'emitido').length,
    notificado: controls.filter(c => c.status === 'notificado').length,
    cerrado: controls.filter(c => c.status === 'cerrado').length,
    reemitido: controls.filter(c => c.status === 'reemitido').length,
  }), [controls]);

  if (loading) {
    return <LoadingState message="Cargando Controles de Ingreso..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Controles de Ingresos"
        description="Gestión operativa de controles de ingreso y oficios"
        action={
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => setShowNuevoControl(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Control
          </Button>
        }
      />

      {stats && <ControlesKpiCards stats={stats} />}

      <ControlesFilterBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        coordinacionFilter={coordinacionFilter}
        onCoordinacionChange={setCoordinacionFilter}
        counts={counts}
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          message="No se encontraron controles con los filtros aplicados."
        />
      ) : (
        <ControlesTable controls={filtered} />
      )}

      <NuevoControlDialog
        open={showNuevoControl}
        onOpenChange={setShowNuevoControl}
        onSubmit={handleNuevoControl}
      />
    </div>
  );
}
