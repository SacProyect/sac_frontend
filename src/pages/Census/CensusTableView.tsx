import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCensusTable } from '@/hooks/useCensusTable';
import {
  getCensusTableMyCensus,
  getCensusTableMyFiscales,
  getCensusTableFiscalCensos,
  getCensusTableMyCoordinatedGroup,
  getCensusTableGroupFiscalCensos,
  getCensusTableCoordinations,
  getCensusTableCoordinacionFiscales,
  getCensusTableCoordinacionFiscalCensos,
} from '@/components/utils/api/census-table-functions';
import type {
  CensusRecordRow,
  FiscalWithStats,
  UnitWithStats,
  CensusTableParams,
} from '@/types/census-table';
import { Card } from '@/components/UI/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/UI/table';
import { Button } from '@/components/UI/button';
import { LoadingState, EmptyState, PageHeader } from '@/components/UI/v2';
import CensusStatusBadge from '@/components/census/CensusStatusBadge';
import CensusStatsBar from '@/components/census/CensusStatsBar';
import CensusPagination from '@/components/census/CensusPagination';
import CensusEditModal from '@/components/census/CensusEditModal';
import { ArrowLeft, Search, Eye, Users, Building2, Pencil } from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────────────

function aggregateStats(fiscales: FiscalWithStats[]) {
  const acc = { total: 0, DRAFT: 0, COMPLETED: 0, VERIFIED: 0 };
  for (const f of fiscales) {
    acc.total += f.census_stats.total;
    acc.DRAFT += f.census_stats.DRAFT;
    acc.COMPLETED += f.census_stats.COMPLETED;
    acc.VERIFIED += f.census_stats.VERIFIED;
  }
  return acc;
}

function aggregateUnitStats(units: UnitWithStats[]) {
  const acc = { total: 0, DRAFT: 0, COMPLETED: 0, VERIFIED: 0 };
  for (const u of units) {
    acc.total += u.census_stats.total;
    acc.DRAFT += u.census_stats.DRAFT;
    acc.COMPLETED += u.census_stats.COMPLETED;
    acc.VERIFIED += u.census_stats.VERIFIED;
  }
  return acc;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ── Census Table (shared between FISCAL and drill-down views) ──────

interface CensusTableProps {
  data: CensusRecordRow[];
  onEdit?: (census: CensusRecordRow) => void;
}

function CensusTable({ data, onEdit }: CensusTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-800 hover:bg-slate-800 border-slate-700">
            <TableHead className="text-slate-300 font-semibold">N° Censo</TableHead>
            <TableHead className="text-slate-300 font-semibold">Año</TableHead>
            <TableHead className="text-slate-300 font-semibold">Nombre Comercial</TableHead>
            <TableHead className="text-slate-300 font-semibold">Actividad</TableHead>
            <TableHead className="text-slate-300 font-semibold">Estado</TableHead>
            <TableHead className="text-slate-300 font-semibold">Parroquia</TableHead>
            <TableHead className="text-slate-300 font-semibold">Fecha</TableHead>
            {onEdit && <TableHead className="text-slate-300 font-semibold">Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={row.id}
              className="border-slate-700 hover:bg-slate-700/30 transition-colors"
            >
              <TableCell className="text-slate-200 font-mono text-sm">
                {row.census_number}
              </TableCell>
              <TableCell className="text-slate-200">{row.census_year}</TableCell>
              <TableCell className="text-slate-200 font-medium">
                {row.commercial_name || '—'}
              </TableCell>
              <TableCell className="text-slate-400 text-sm">
                {row.activity_type || '—'}
              </TableCell>
              <TableCell>
                <CensusStatusBadge status={row.census_status as any} />
              </TableCell>
              <TableCell className="text-slate-400 text-sm">
                {row.parish_name || '—'}
              </TableCell>
              <TableCell className="text-slate-200 text-sm">
                {formatDate(row.created_at)}
              </TableCell>
              {onEdit && (
                <TableCell>
                  {row.census_status === 'DRAFT' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(row)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Fiscal Censuses Table (for fiscales list with stats) ────────────

interface FiscalCensusesTableProps {
  data: FiscalWithStats[];
  onViewCensuses: (fiscal: FiscalWithStats) => void;
}

function FiscalCensusesTable({ data, onViewCensuses }: FiscalCensusesTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-800 hover:bg-slate-800 border-slate-700">
            <TableHead className="text-slate-300 font-semibold">Nombre</TableHead>
            <TableHead className="text-slate-300 font-semibold text-center">Censos Totales</TableHead>
            <TableHead className="text-slate-300 font-semibold text-center">Borrador</TableHead>
            <TableHead className="text-slate-300 font-semibold text-center">Completados</TableHead>
            <TableHead className="text-slate-300 font-semibold text-center">Verificados</TableHead>
            <TableHead className="text-slate-300 font-semibold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((fiscal) => (
            <TableRow
              key={fiscal.id}
              className="border-slate-700 hover:bg-slate-700/30 transition-colors"
            >
              <TableCell className="text-slate-200 font-medium">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  {fiscal.name}
                </div>
              </TableCell>
              <TableCell className="text-slate-200 text-center font-bold">
                {fiscal.census_stats.total}
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex items-center justify-center rounded-md bg-slate-600/30 px-2 py-0.5 text-xs font-medium text-slate-300">
                  {fiscal.census_stats.DRAFT}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex items-center justify-center rounded-md bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-300">
                  {fiscal.census_stats.COMPLETED}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex items-center justify-center rounded-md bg-emerald-900/40 px-2 py-0.5 text-xs font-medium text-emerald-300">
                  {fiscal.census_stats.VERIFIED}
                </span>
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewCensuses(fiscal)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Censos
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Units Table (ADMIN) ────────────────────────────────────────────

interface UnitsTableProps {
  data: UnitWithStats[];
  onViewFiscales: (unit: UnitWithStats) => void;
}

function UnitsTable({ data, onViewFiscales }: UnitsTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-800 hover:bg-slate-800 border-slate-700">
            <TableHead className="text-slate-300 font-semibold">Coordinación</TableHead>
            <TableHead className="text-slate-300 font-semibold text-center">Fiscales</TableHead>
            <TableHead className="text-slate-300 font-semibold text-center">Censos Totales</TableHead>
            <TableHead className="text-slate-300 font-semibold text-center">Borrador</TableHead>
            <TableHead className="text-slate-300 font-semibold text-center">Completados</TableHead>
            <TableHead className="text-slate-300 font-semibold text-center">Verificados</TableHead>
            <TableHead className="text-slate-300 font-semibold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((unit) => (
            <TableRow
              key={unit.id}
              className="border-slate-700 hover:bg-slate-700/30 transition-colors"
            >
              <TableCell className="text-slate-200 font-medium">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  {unit.name}
                </div>
              </TableCell>
              <TableCell className="text-slate-200 text-center">{unit.fiscal_count}</TableCell>
              <TableCell className="text-slate-200 text-center font-bold">
                {unit.census_stats.total}
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex items-center justify-center rounded-md bg-slate-600/30 px-2 py-0.5 text-xs font-medium text-slate-300">
                  {unit.census_stats.DRAFT}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex items-center justify-center rounded-md bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-300">
                  {unit.census_stats.COMPLETED}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex items-center justify-center rounded-md bg-emerald-900/40 px-2 py-0.5 text-xs font-medium text-emerald-300">
                  {unit.census_stats.VERIFIED}
                </span>
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewFiscales(unit)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Fiscales
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Main View ───────────────────────────────────────────────────────

export default function CensusTableView() {
  const { user } = useAuth();

  // Drill-down state
  const [selectedFiscalId, setSelectedFiscalId] = useState<string | null>(null);
  const [selectedFiscalName, setSelectedFiscalName] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState<string>('');

  // Reset drill-down state
  const goBackToFiscales = useCallback(() => {
    setSelectedFiscalId(null);
    setSelectedFiscalName('');
  }, []);

  const goBackToCoordinaciones = useCallback(() => {
    setSelectedGroupId(null);
    setSelectedGroupName('');
    setSelectedFiscalId(null);
    setSelectedFiscalName('');
  }, []);

  // Edit modal state
  const [editCensus, setEditCensus] = useState<CensusRecordRow | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // ── FISCAL ──────────────────────────────────────────────────────

  const fiscalCensusHook = useCensusTable<CensusRecordRow>({
    fetchFn: useCallback(
      (params: CensusTableParams) => getCensusTableMyCensus(params),
      []
    ),
    dataKey: 'censos',
    enabled: user?.role === 'FISCAL',
  });

  // ── SUPERVISOR ──────────────────────────────────────────────────

  const supervisorFiscalesHook = useCensusTable<FiscalWithStats>({
    fetchFn: useCallback(
      (params: CensusTableParams) => getCensusTableMyFiscales(params),
      []
    ),
    dataKey: 'fiscales',
    enabled: user?.role === 'SUPERVISOR' && !selectedFiscalId,
  });

  const supervisorCensosHook = useCensusTable<CensusRecordRow>({
    fetchFn: useCallback(
      (params: CensusTableParams) =>
        selectedFiscalId
          ? getCensusTableFiscalCensos(selectedFiscalId, params)
          : Promise.resolve({ success: false, data: null }),
      [selectedFiscalId]
    ),
    dataKey: 'censos',
    enabled: user?.role === 'SUPERVISOR' && !!selectedFiscalId,
  });

  // ── COORDINATOR ─────────────────────────────────────────────────

  const coordinatorFiscalesHook = useCensusTable<FiscalWithStats>({
    fetchFn: useCallback(
      (params: CensusTableParams) => getCensusTableMyCoordinatedGroup(params),
      []
    ),
    dataKey: 'fiscales',
    enabled: user?.role === 'COORDINATOR' && !selectedFiscalId,
  });

  const coordinatorCensosHook = useCensusTable<CensusRecordRow>({
    fetchFn: useCallback(
      (params: CensusTableParams) =>
        selectedFiscalId
          ? getCensusTableGroupFiscalCensos(selectedFiscalId, params)
          : Promise.resolve({ success: false, data: null }),
      [selectedFiscalId]
    ),
    dataKey: 'censos',
    enabled: user?.role === 'COORDINATOR' && !!selectedFiscalId,
  });

  // ── ADMIN ───────────────────────────────────────────────────────

  const adminCoordinationsHook = useCensusTable<UnitWithStats>({
    fetchFn: useCallback(
      (params: CensusTableParams) => getCensusTableCoordinations(params),
      []
    ),
    dataKey: 'units',
    enabled: user?.role === 'ADMIN' && !selectedGroupId,
  });

  const adminCoordinacionFiscalesHook = useCensusTable<FiscalWithStats>({
    fetchFn: useCallback(
      (params: CensusTableParams) =>
        selectedGroupId
          ? getCensusTableCoordinacionFiscales(selectedGroupId, params)
          : Promise.resolve({ success: false, data: null }),
      [selectedGroupId]
    ),
    dataKey: 'fiscales',
    enabled: user?.role === 'ADMIN' && !!selectedGroupId && !selectedFiscalId,
  });

  const adminCoordinacionCensosHook = useCensusTable<CensusRecordRow>({
    fetchFn: useCallback(
      (params: CensusTableParams) =>
        selectedGroupId && selectedFiscalId
          ? getCensusTableCoordinacionFiscalCensos(selectedGroupId, selectedFiscalId, params)
          : Promise.resolve({ success: false, data: null }),
      [selectedGroupId, selectedFiscalId]
    ),
    dataKey: 'censos',
    enabled: user?.role === 'ADMIN' && !!selectedGroupId && !!selectedFiscalId,
  });

  // ── Derive current view state ───────────────────────────────────

  const role = user?.role;

  const currentHook = useMemo(() => {
    if (role === 'FISCAL') return fiscalCensusHook;

    if (role === 'SUPERVISOR') {
      if (selectedFiscalId) return supervisorCensosHook;
      return supervisorFiscalesHook;
    }

    if (role === 'COORDINATOR') {
      if (selectedFiscalId) return coordinatorCensosHook;
      return coordinatorFiscalesHook;
    }

    if (role === 'ADMIN') {
      if (selectedGroupId && selectedFiscalId) return adminCoordinacionCensosHook;
      if (selectedGroupId) return adminCoordinacionFiscalesHook;
      return adminCoordinationsHook;
    }

    return fiscalCensusHook;
  }, [
    role,
    selectedFiscalId,
    selectedGroupId,
    fiscalCensusHook,
    supervisorFiscalesHook,
    supervisorCensosHook,
    coordinatorFiscalesHook,
    coordinatorCensosHook,
    adminCoordinationsHook,
    adminCoordinacionFiscalesHook,
    adminCoordinacionCensosHook,
  ]);

  const { data, loading, error, page, totalPages, total, statusFilter, goToPage, setStatusFilter } = currentHook;

  // ── Aggregate stats for census views ────────────────────────────

  const showStatsBar = role === 'FISCAL' || (role !== 'FISCAL' && selectedFiscalId);

  const censusStats = useMemo(() => {
    if (role === 'FISCAL') {
      // Compute from visible census data
      const acc = { total: 0, DRAFT: 0, COMPLETED: 0, VERIFIED: 0 };
      for (const row of data as CensusRecordRow[]) {
        acc.total++;
        const s = row.census_status;
        if (s === 'DRAFT') acc.DRAFT++;
        else if (s === 'COMPLETED') acc.COMPLETED++;
        else if (s === 'VERIFIED') acc.VERIFIED++;
      }
      return acc;
    }

    // For supervisor/coordinator, aggregate from fiscales list before drill-down
    if ((role === 'SUPERVISOR' || role === 'COORDINATOR') && !selectedFiscalId) {
      return aggregateStats(data as FiscalWithStats[]);
    }

    // For admin at units level
    if (role === 'ADMIN' && !selectedGroupId) {
      return aggregateUnitStats(data as UnitWithStats[]);
    }

    // For admin at fiscales level
    if (role === 'ADMIN' && selectedGroupId && !selectedFiscalId) {
      return aggregateStats(data as FiscalWithStats[]);
    }

    // Drill-down census views - aggregate from table data
    const acc = { total: 0, DRAFT: 0, COMPLETED: 0, VERIFIED: 0 };
    for (const row of data as CensusRecordRow[]) {
      acc.total++;
      const s = row.census_status;
      if (s === 'DRAFT') acc.DRAFT++;
      else if (s === 'COMPLETED') acc.COMPLETED++;
      else if (s === 'VERIFIED') acc.VERIFIED++;
    }
    return acc;
  }, [role, data, selectedFiscalId, selectedGroupId]);

  // ── Title and breadcrumb ────────────────────────────────────────

  const title = useMemo(() => {
    if (role === 'FISCAL') return 'Mis Censos';
    if (role === 'SUPERVISOR') return 'Mis Fiscales';
    if (role === 'COORDINATOR') return 'Mi Grupo Coordinado';
    if (role === 'ADMIN') return 'Coordinaciones';
    return 'Censos';
  }, [role]);

  // ── Handlers for drill-down ─────────────────────────────────────

  const handleViewFiscalCensuses = useCallback((fiscal: FiscalWithStats) => {
    setSelectedFiscalId(fiscal.id);
    setSelectedFiscalName(fiscal.name);
  }, []);

  const handleViewCoordinacionFiscales = useCallback((unit: UnitWithStats) => {
    setSelectedGroupId(unit.id);
    setSelectedGroupName(unit.name);
  }, []);

  const handleViewAdminFiscalCensuses = useCallback((fiscal: FiscalWithStats) => {
    setSelectedFiscalId(fiscal.id);
    setSelectedFiscalName(fiscal.name);
  }, []);

  // Edit modal handlers
  const handleEditCensus = useCallback((census: CensusRecordRow) => {
    setEditCensus(census);
    setEditModalOpen(true);
  }, []);

  const handleEditSaved = useCallback(() => {
    if (role === 'FISCAL') fiscalCensusHook.refresh?.();
    else if (role === 'SUPERVISOR' && selectedFiscalId) supervisorCensosHook.refresh?.();
    else if (role === 'COORDINATOR' && selectedFiscalId) coordinatorCensosHook.refresh?.();
    else if (role === 'ADMIN' && selectedGroupId && selectedFiscalId) adminCoordinacionCensosHook.refresh?.();
  }, [role, selectedFiscalId, selectedGroupId, fiscalCensusHook, supervisorCensosHook, coordinatorCensosHook, adminCoordinacionCensosHook]);

  // ── Determine if we show a status filter ────────────────────────

  const showStatusFilter =
    role === 'FISCAL' ||
    (role === 'SUPERVISOR' && !!selectedFiscalId) ||
    (role === 'COORDINATOR' && !!selectedFiscalId) ||
    (role === 'ADMIN' && !!selectedGroupId && !!selectedFiscalId);

  // ── Loading / Error / Empty ─────────────────────────────────────

  if (loading) {
    return <LoadingState message="Cargando datos..." />;
  }

  if (error) {
    return (
      <EmptyState
        title="Error al cargar datos"
        message={error}
      />
    );
  }

  if (data.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={title}
          description={
            selectedFiscalName
              ? `Censos de ${selectedFiscalName}`
              : selectedGroupName
              ? `Fiscales de ${selectedGroupName}`
              : undefined
          }
          action={
            (selectedFiscalId || selectedGroupId) ? (
              <Button
                variant="outline"
                onClick={role === 'ADMIN' && selectedFiscalId ? goBackToCoordinaciones : goBackToFiscales}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver
              </Button>
            ) : undefined
          }
        />
        <EmptyState title="No hay datos disponibles" message="No se encontraron registros para mostrar." />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <PageHeader
        title={title}
        description={
          selectedFiscalName
            ? `Censos de ${selectedFiscalName}`
            : selectedGroupName
            ? `Fiscales de ${selectedGroupName}`
            : undefined
        }
        action={
          (selectedFiscalId || selectedGroupId) ? (
            <Button
              variant="outline"
              onClick={
                role === 'ADMIN' && selectedFiscalId
                  ? goBackToCoordinaciones
                  : goBackToFiscales
              }
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </Button>
          ) : undefined
        }
      />

      {/* Stats Bar */}
      {showStatsBar && <CensusStatsBar stats={censusStats} />}

      {/* Status Filter (census-level views only) */}
      {showStatusFilter && (
        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 text-sm outline-none focus:border-slate-500"
            >
              <option value="">Todos los estados</option>
              <option value="DRAFT">Borrador</option>
              <option value="COMPLETED">Completado</option>
              <option value="VERIFIED">Verificado</option>
              <option value="IMPORTED">Importado</option>
            </select>
          </div>
        </Card>
      )}

      {/* Data Table */}
      <Card className="bg-slate-800 border-slate-700 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
        {/* FISCAL: Census table */}
        {role === 'FISCAL' && <CensusTable data={data as CensusRecordRow[]} onEdit={handleEditCensus} />}

        {/* SUPERVISOR: Fiscales list or census drill-down */}
        {role === 'SUPERVISOR' && !selectedFiscalId && (
          <FiscalCensusesTable
            data={data as FiscalWithStats[]}
            onViewCensuses={handleViewFiscalCensuses}
          />
        )}
        {role === 'SUPERVISOR' && selectedFiscalId && (
          <CensusTable data={data as CensusRecordRow[]} onEdit={handleEditCensus} />
        )}

        {/* COORDINATOR: Fiscales list or census drill-down */}
        {role === 'COORDINATOR' && !selectedFiscalId && (
          <FiscalCensusesTable
            data={data as FiscalWithStats[]}
            onViewCensuses={handleViewFiscalCensuses}
          />
        )}
        {role === 'COORDINATOR' && selectedFiscalId && (
          <CensusTable data={data as CensusRecordRow[]} onEdit={handleEditCensus} />
        )}

        {/* ADMIN: Coordinaciones / Fiscales / Census drill-down */}
        {role === 'ADMIN' && !selectedGroupId && (
          <UnitsTable
            data={data as UnitWithStats[]}
            onViewFiscales={handleViewCoordinacionFiscales}
          />
        )}
        {role === 'ADMIN' && selectedGroupId && !selectedFiscalId && (
          <FiscalCensusesTable
            data={data as FiscalWithStats[]}
            onViewCensuses={handleViewAdminFiscalCensuses}
          />
        )}
        {role === 'ADMIN' && selectedGroupId && selectedFiscalId && (
          <CensusTable data={data as CensusRecordRow[]} onEdit={handleEditCensus} />
        )}
      </Card>

      {/* Pagination */}
      <Card className="bg-slate-800 border-slate-700">
        <CensusPagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={goToPage}
        />
      </Card>

      {/* Edit Modal */}
      <CensusEditModal
        census={editCensus}
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditCensus(null); }}
        onSaved={handleEditSaved}
      />
    </div>
  );
}
