import { useState, useEffect, useMemo } from 'react';
import { useTvIdleRotation } from '@/hooks/use-tv-idle-rotation';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { getFiscalsForReview } from '@/components/utils/api/taxpayer-functions';
import type { User } from '@/types/user';
import { Card } from '@/components/UI/card';
import { Input } from '@/components/UI/input';
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/badge';
import { Search, TrendingUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, Users, UserIcon, ArrowLeft } from 'lucide-react';
import { EmptyState, LoadingState, PageHeader } from '@/components/UI/v2';
import { TableSkeleton } from '@/components/UI/TableSkeleton';
import { Avatar, AvatarFallback } from '@/components/UI/avatar';
import toast from 'react-hot-toast';
import { fiscalCarteraYearNow, fiscalCarteraYearOptions } from '@/utils/fiscal-cartera-year';
import { useDebounce } from '@/hooks/use-debounce';

// Subcomponents for the 3 pages
import { useFiscalStats } from '@/hooks/use-fiscal-stats';
import { FiscalReviewPage1Resumen } from '@/components/fiscal-review/fiscal-review-page1-resumen';
import { FiscalReviewPage2Cumplimiento } from '@/components/fiscal-review/fiscal-review-page2-cumplimiento';
import { FiscalReviewPage3Reportes } from '@/components/fiscal-review/fiscal-review-page3-reportes';
import { FiscalReviewPage4Declaraciones } from '@/components/fiscal-review/fiscal-review-page4-declaraciones';
import {
  FiscalKpiBreakdownDialog,
  type FiscalKpiBreakdownRow,
} from '@/components/fiscal-review/fiscal-kpi-breakdown-dialog';
import type { FiscalKpiBreakdownCategory } from '@/components/utils/api/report-functions';
/**
 * Vista de detalles de un fiscal específico (3 páginas)
 */
export function FiscalDetailsView({
  fiscalId,
  onBack,
  initialYear,
}: {
  fiscalId: string;
  onBack: () => void;
  initialYear: number;
}) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [kpiBreakdown, setKpiBreakdown] = useState<FiscalKpiBreakdownCategory | null>(null);

  const { tvSpotlightIndex } = useTvIdleRotation({
    page,
    setPage,
    totalPages: 4,
  });
  const {
    loading,
    fiscalInfo,
    fiscalPerformance,
    fiscalTaxpayers,
    fiscalMonthlyCollect,
    fiscalComplianceByProcess,
    fiscalTaxpayerCompliance,
    fiscalCollectAnalisis,
  } = useFiscalStats(selectedYear, fiscalId);

  if (loading || !fiscalInfo) return <LoadingState message="Cargando información del fiscal..." />;

  const totalAssigned = (fiscalInfo as any).totalTaxpayers ?? fiscalInfo.totalAssigned ?? fiscalInfo.totalAsignados ?? 0;
  const activeProcess = (fiscalInfo as any).totalProcess ?? 0;
  const completed = (fiscalInfo as any).totalCompleted ?? fiscalInfo.completed ?? fiscalInfo.completados ?? 0;
  const totalNotified = (fiscalInfo as any).totalNotified ?? 0;

  const initials = (fiscalInfo.fiscalName || fiscalInfo.name || fiscalInfo.nombre || 'F')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden animate-in fade-in duration-300">
       <div className="flex justify-between items-center mb-2">
          <PageHeader
            title="Exploración de Fiscal"
            description="Métricas y estadísticas detalladas para el fiscal seleccionado"
          />
         <Button variant="outline" onClick={onBack} className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent">
           <ChevronLeft className="h-4 w-4 mr-2" />
           Volver a la lista
         </Button>
       </div>

       {/* Header from the UI Image */}
       <Card className="bg-slate-800 border-slate-700 p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all shadow-md">
         <div className="flex items-center gap-4">
           <Avatar className="h-16 w-16 bg-blue-600 border-2 border-blue-500">
             <AvatarFallback className="text-white font-bold text-lg">{initials}</AvatarFallback>
           </Avatar>
           <div>
             <h2 className="text-2xl font-bold text-white">{fiscalInfo.fiscalName || fiscalInfo.name || fiscalInfo.nombre}</h2>
             <p className="text-blue-400 text-sm mt-1 font-medium">Rol: {fiscalInfo.role}</p>
           </div>
         </div>
         <div className="flex gap-4 sm:gap-6 lg:gap-8 text-center pt-4 md:pt-0">
           <button
             type="button"
             onClick={() => setKpiBreakdown('assigned')}
             className="group rounded-xl px-2 py-1 -m-1 transition-colors hover:bg-slate-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-w-[4.5rem]"
             title="Ver listado de contribuyentes"
           >
             <p className="text-xl sm:text-2xl font-bold text-green-400 group-hover:text-green-300">{totalAssigned}</p>
             <p className="text-slate-400 text-[10px] sm:text-xs mt-1 leading-tight group-hover:text-slate-300 underline-offset-2 group-hover:underline">Contribuyentes</p>
           </button>
           <button
             type="button"
             onClick={() => setKpiBreakdown('active')}
             className="group rounded-xl px-2 py-1 -m-1 transition-colors hover:bg-slate-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-w-[4.5rem]"
             title="Ver procesos activos (sin culminar)"
           >
             <p className="text-xl sm:text-2xl font-bold text-yellow-500 group-hover:text-yellow-400">{activeProcess}</p>
             <p className="text-slate-400 text-[10px] sm:text-xs mt-1 leading-tight group-hover:text-slate-300 underline-offset-2 group-hover:underline">Procesos<br className="hidden sm:block" /> Activos</p>
           </button>
           <button
             type="button"
             onClick={() => setKpiBreakdown('completed')}
             className="group rounded-xl px-2 py-1 -m-1 transition-colors hover:bg-slate-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-w-[4.5rem]"
             title="Ver procesos culminados"
           >
             <p className="text-xl sm:text-2xl font-bold text-blue-400 group-hover:text-blue-300">{completed}</p>
             <p className="text-slate-400 text-[10px] sm:text-xs mt-1 leading-tight group-hover:text-slate-300 underline-offset-2 group-hover:underline">Procesos<br className="hidden sm:block" /> Completados</p>
           </button>
           <button
             type="button"
             onClick={() => setKpiBreakdown('notified')}
             className="group rounded-xl px-2 py-1 -m-1 transition-colors hover:bg-slate-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-w-[4.5rem]"
             title="Ver procesos notificados"
           >
             <p className="text-xl sm:text-2xl font-bold text-orange-400 group-hover:text-orange-300">{totalNotified}</p>
             <p className="text-slate-400 text-[10px] sm:text-xs mt-1 leading-tight group-hover:text-slate-300 underline-offset-2 group-hover:underline">Procesos<br className="hidden sm:block" /> Notificados</p>
           </button>
         </div>
       </Card>

       <FiscalKpiBreakdownDialog
         open={kpiBreakdown !== null}
         onOpenChange={(o) => !o && setKpiBreakdown(null)}
         fiscalId={fiscalId}
         year={selectedYear}
         category={kpiBreakdown}
         fallbackTaxpayers={fiscalTaxpayers as FiscalKpiBreakdownRow[]}
       />

        {/* Page navigation arrows (top) — especially useful on mobile */}
        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 px-2 sm:px-3 h-8 sm:h-9"
          >
            <ChevronLeft className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline text-xs">Anterior</span>
          </Button>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 rounded-full transition-all ${
                  page === p
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
              >
                {p === 1 ? 'Resumen' : p === 2 ? 'Cumplimiento' : p === 3 ? 'Reportes' : 'Declaraciones'}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(p => Math.min(4, p + 1))}
            disabled={page === 4}
            className="text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 px-2 sm:px-3 h-8 sm:h-9"
          >
            <span className="hidden sm:inline text-xs">Siguiente</span>
            <ChevronRight className="h-4 w-4 sm:ml-1" />
          </Button>
        </div>

        {/* Render current page */}
        <div className="min-h-[400px]">
         {page === 1 && (
           <FiscalReviewPage1Resumen
             fiscalInfo={fiscalInfo}
             performance={fiscalPerformance}
             selectedYear={selectedYear}
             setSelectedYear={setSelectedYear}
             fiscalTaxpayers={fiscalTaxpayers}
             fiscalMonthlyCollect={fiscalMonthlyCollect}
             fiscalComplianceByProcess={fiscalComplianceByProcess}
             tvSpotlightIndex={tvSpotlightIndex}
           />
         )}
         {page === 2 && (
           <FiscalReviewPage2Cumplimiento
             fiscalInfo={fiscalInfo}
             fiscalTaxpayerCompliance={fiscalTaxpayerCompliance}
             fiscalCollectAnalisis={fiscalCollectAnalisis}
             tvSpotlightIndex={tvSpotlightIndex}
           />
         )}
         {page === 3 && <FiscalReviewPage3Reportes fiscalInfo={fiscalInfo} tvSpotlightIndex={tvSpotlightIndex} />}
         {page === 4 && <FiscalReviewPage4Declaraciones fiscalId={fiscalId} selectedYear={selectedYear} setSelectedYear={setSelectedYear} />}
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-6">
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-lg p-1.5 sm:p-2 flex items-center justify-center gap-0.5 sm:gap-1 shadow-lg backdrop-blur-sm">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-50 px-1.5 sm:px-3"
            >
              <ChevronLeft className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
            
            {[1, 2, 3, 4].map(p => (
              <Button
                key={p}
                size="sm"
                onClick={() => setPage(p)}
                className={`min-w-[32px] sm:min-w-[40px] h-8 sm:h-9 text-xs sm:text-sm transition-all ${
                  page === p 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md scale-105 sm:scale-100' 
                    : 'bg-transparent text-slate-300 hover:bg-slate-800'
                }`}
              >
                {p}
              </Button>
            ))}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setPage(p => Math.min(4, p + 1))}
              disabled={page === 4}
              className="text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-50 px-1.5 sm:px-3"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="h-4 w-4 sm:ml-1" />
            </Button>
          </div>
        </div>
    </div>
  );
}

// ── Helper utilities ──────────────────────────────────────
const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const roleAvatarColor = (role: string) =>
  role === 'FISCAL'
    ? 'bg-blue-600 text-blue-100'
    : role === 'SUPERVISOR'
    ? 'bg-purple-600 text-purple-100'
    : 'bg-slate-600 text-slate-200';

const roleBorderClass = (role: string) =>
  role === 'FISCAL'
    ? 'border-l-blue-500/40'
    : role === 'SUPERVISOR'
    ? 'border-l-purple-500/40'
    : 'border-l-transparent';

const roleBadgeClass = (role: string) =>
  role === 'FISCAL'
    ? 'bg-blue-900/50 text-blue-200 border-blue-800'
    : role === 'SUPERVISOR'
    ? 'bg-purple-900/50 text-purple-200 border-purple-800'
    : 'bg-slate-700 text-slate-300 border-slate-600';

/**
 * FiscalReviewPageV2 - Revisión de Fiscales con Orquestador de 3 Páginas
 */
export default function FiscalReviewPageV2() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fiscalArray, setFiscalArray] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [selectedFiscalId, setSelectedFiscalId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(fiscalCarteraYearNow());

  // Paginación del servidor
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const debouncedSearch = useDebounce(searchValue.toLowerCase(), 500);

  // Resetear página al buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedYear]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchFiscals = async () => {
      try {
        setLoading(true);
        // Always request fiscals filtered by active year to avoid IDs without cases.
        const response = await getFiscalsForReview(selectedYear, currentPage, limit);
        setFiscalArray(response.data || []);
        setTotal(response.total ?? 0);
        setTotalPages(response.totalPages ?? 1);
      } catch (e) {
        console.error(e);
        toast.error('No se pudieron obtener los fiscales.');
      } finally {
        setLoading(false);
      }
    };

    fetchFiscals();
  }, [user, navigate, currentPage, selectedYear]);

  // Filtro local solo para búsqueda instantánea
  // IMPORTANTE: debe estar ANTES de cualquier return condicional (Reglas de Hooks)
  const displayFiscals = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return [...fiscalArray].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    return fiscalArray
      .filter(f =>
        f.name?.toLowerCase().includes(q) ||
        f.group?.name?.toLowerCase().includes(q) ||
        f.supervisor?.name?.toLowerCase().includes(q) ||
        f.group?.coordinator?.name?.toLowerCase().includes(q) ||
        f.personId?.toString().includes(q)
      )
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }, [fiscalArray, searchValue]);

  if (loading) {
    return <LoadingState message="Cargando fiscales..." />;
  }

  if (selectedFiscalId) {
    return (
      <FiscalDetailsView
        fiscalId={selectedFiscalId}
        onBack={() => setSelectedFiscalId(null)}
        initialYear={selectedYear}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden animate-in fade-in duration-300">
      <PageHeader
        title="Revisión de Fiscales"
        description="Consulta y análisis de desempeño de la plantilla fiscal"
        action={<Button variant="outline" onClick={() => navigate('/admin')} className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>}
      />

      {/* Filtros */}
      <Card className="bg-slate-800 border-slate-700 p-4 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <div className="flex items-center gap-2 w-full">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre, cédula, grupo o supervisor..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="h-10 min-w-[120px] rounded-md border border-slate-600 bg-slate-700 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {fiscalCarteraYearOptions().map((year) => (
              <option key={year} value={year}>
                Año {year}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700 p-4 transition-all duration-200 border-l-4 border-l-blue-500 hover:border-slate-600 hover:shadow-md">
          <p className="text-slate-400 text-sm">Total Fiscales</p>
          <p className="text-2xl font-bold text-white mt-2">{loading ? '—' : total}</p>
        </Card>
        <Card className="bg-slate-800 border-slate-700 p-4 transition-all duration-200 border-l-4 border-l-green-500 hover:border-slate-600 hover:shadow-md">
          <p className="text-slate-400 text-sm">Fiscales (pág.)</p>
          <p className="text-2xl font-bold text-green-400 mt-2">
            {displayFiscals.filter((f) => f.role === 'FISCAL').length}
          </p>
        </Card>
        <Card className="bg-slate-800 border-slate-700 p-4 transition-all duration-200 border-l-4 border-l-purple-500 hover:border-slate-600 hover:shadow-md">
          <p className="text-slate-400 text-sm">Supervisores (pág.)</p>
          <p className="text-2xl font-bold text-purple-400 mt-2">
            {displayFiscals.filter((f) => f.role === 'SUPERVISOR').length}
          </p>
        </Card>
      </div>

      {/* Paginación + Tabla */}
      {displayFiscals.length === 0 && !loading ? (
        <EmptyState title="No se encontraron fiscales" message="Intenta ajustar los filtros de búsqueda" />
      ) : (
        <>
          {/* Controles de paginación */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-1">
            <p className="text-sm text-slate-400">
              {loading ? 'Cargando...' : total > 0 ? (
                <>Vista <span className="text-indigo-400 font-bold">{((currentPage - 1) * limit + 1)}–{Math.min(currentPage * limit, total)}</span> de <span className="text-slate-200 font-bold">{total}</span> fiscales</>
              ) : '0 resultados'}
            </p>
            <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-sm">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || loading}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-20 transition-all" title="Primera página">
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-20 transition-all" title="Anterior">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 min-w-[120px] text-center">
                <span className="text-xs font-bold text-blue-300 bg-blue-900/30 px-3 py-1 rounded-full">
                  Pág. {currentPage} / {totalPages}
                </span>
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || loading}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-20 transition-all" title="Siguiente">
                <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || loading}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-20 transition-all" title="Última página">
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile: Card layout — hidden on md+, shown on small screens */}
          <div className="block md:hidden space-y-3">
            {displayFiscals
              .filter((t) => t.id && t.personId)
              .map((fiscal) => {
                const initials = getInitials(fiscal.name ?? '');
                return (
                  <div
                    key={fiscal.id}
                    onClick={() => setSelectedFiscalId(fiscal.id)}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 hover:bg-slate-700/50 transition-all duration-200 cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar / initials circle — colored by role */}
                      <Avatar className="h-10 w-10 shrink-0 mt-0.5">
                        <AvatarFallback className={`text-xs font-bold ${roleAvatarColor(fiscal.role)}`}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        {/* Top: Name + Cédula */}
                        <div className="min-w-0">
                          <p className="text-slate-200 font-medium text-sm truncate">{fiscal.name ?? 'N/A'}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            <UserIcon className="h-3 w-3 inline mr-1" />
                            {fiscal.personId ? Number(fiscal.personId).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                        {/* Middle: Grupo + Coordinator / Supervisor */}
                        <div className="mt-2 space-y-0.5">
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Users className="h-3 w-3 shrink-0" />
                            {fiscal.group?.name ?? 'N/A'}
                          </p>
                          {fiscal.group?.coordinator?.name && (
                            <p className="text-[11px] text-slate-500 pl-4">
                              Coordinador: {fiscal.group.coordinator.name}
                            </p>
                          )}
                          {fiscal.role === 'FISCAL' && fiscal.supervisor?.name && (
                            <p className="text-[11px] text-slate-500 pl-4">
                              Supervisor: {fiscal.supervisor.name}
                            </p>
                          )}
                        </div>
                        {/* Bottom: Rol badge + full-width action button */}
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <Badge className={roleBadgeClass(fiscal.role)}>
                            {fiscal.role}
                          </Badge>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFiscalId(fiscal.id);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3 transition-all"
                          >
                            <Eye className="h-3.5 w-3.5 sm:mr-1.5" />
                            <span className="hidden sm:inline">Estadísticas</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Desktop: Table — hidden on small screens, shown on md+ */}
          <div className="hidden md:block">
            <Card className="bg-slate-800 border-slate-700 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-slate-700 bg-slate-800/95 backdrop-blur-sm">
                      <th className="text-left p-3 md:p-4 text-slate-300 font-semibold text-sm">Cédula</th>
                      <th className="text-left p-3 md:p-4 text-slate-300 font-semibold text-sm">Nombre</th>
                      <th className="text-left p-3 md:p-4 text-slate-300 font-semibold text-sm">Grupo</th>
                      <th className="text-left p-3 md:p-4 text-slate-300 font-semibold text-sm hidden md:table-cell">Coordinador</th>
                      <th className="text-left p-3 md:p-4 text-slate-300 font-semibold text-sm hidden lg:table-cell">Supervisor</th>
                      <th className="text-left p-3 md:p-4 text-slate-300 font-semibold text-sm">Rol</th>
                      <th className="text-right p-3 md:p-4 text-slate-300 font-semibold text-sm">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayFiscals
                      .filter((t) => t.id && t.personId)
                      .map((fiscal) => (
                        <tr
                          key={fiscal.id}
                          className={`border-b border-slate-700 hover:shadow-sm transition-all duration-200 border-l-2 ${roleBorderClass(fiscal.role)} hover:bg-slate-700/50`}
                        >
                          {/* Cédula — with User icon */}
                          <td className="p-3 md:p-4 text-slate-200 text-sm font-mono tabular-nums">
                            <UserIcon className="h-3.5 w-3.5 text-slate-500 inline mr-1.5" />
                            {fiscal.personId ? Number(fiscal.personId).toLocaleString() : 'N/A'}
                          </td>
                          {/* Nombre — with avatar + subtext */}
                          <td className="p-3 md:p-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-7 w-7 shrink-0">
                                <AvatarFallback className={`text-[10px] font-bold ${roleAvatarColor(fiscal.role)}`}>
                                  {getInitials(fiscal.name ?? '')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-slate-200 font-medium text-sm">{fiscal.name ?? 'N/A'}</p>
                                <p className="text-[10px] text-slate-500">ID: {fiscal.id?.slice(0, 8) ?? ''}</p>
                              </div>
                            </div>
                          </td>
                          {/* Grupo — with Users icon */}
                          <td className="p-3 md:p-4 text-slate-400 text-sm">
                            <Users className="h-3.5 w-3.5 text-slate-500 inline mr-1.5" />
                            {fiscal.group?.name ?? 'N/A'}
                          </td>
                          {/* Coordinador */}
                          <td className="p-3 md:p-4 text-slate-400 text-sm hidden md:table-cell">
                            {fiscal.group?.coordinator?.name ?? 'N/A'}
                          </td>
                          {/* Supervisor */}
                          <td className="p-3 md:p-4 text-slate-400 text-sm hidden lg:table-cell">
                            {fiscal.role === 'FISCAL' && fiscal.supervisor?.name
                              ? fiscal.supervisor.name
                              : fiscal.role === 'SUPERVISOR'
                              ? fiscal.name
                              : 'N/A'}
                          </td>
                          {/* Rol badge */}
                          <td className="p-3 md:p-4">
                            <Badge className={roleBadgeClass(fiscal.role)}>
                              {fiscal.role}
                            </Badge>
                          </td>
                          {/* Acción — with Eye icon + hover scale */}
                          <td className="p-3 md:p-4 text-right">
                            <Button
                              onClick={() => setSelectedFiscalId(fiscal.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm transition-all shadow-md hover:shadow-lg px-2 md:px-4 hover:scale-105"
                            >
                              <Eye className="h-4 w-4 md:mr-2" />
                              <span className="hidden md:inline">Ver Estadísticas</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
