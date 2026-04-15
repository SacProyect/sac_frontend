import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { getFiscalsForReview } from '@/components/utils/api/taxpayer-functions';
import type { User } from '@/types/user';
import { Card } from '@/components/UI/card';
import { Input } from '@/components/UI/input';
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/badge';
import { Search, TrendingUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { EmptyState, LoadingState, PageHeader } from '@/components/UI/v2';
import { TableSkeleton } from '@/components/UI/TableSkeleton';
import { Avatar, AvatarFallback } from '@/components/UI/avatar';
import toast from 'react-hot-toast';
import { useDebounce } from '@/hooks/use-debounce';

// Subcomponents for the 3 pages
import { useFiscalStats } from '@/hooks/use-fiscal-stats';
import { FiscalReviewPage1Resumen } from '@/components/fiscal-review/fiscal-review-page1-resumen';
import { FiscalReviewPage2Cumplimiento } from '@/components/fiscal-review/fiscal-review-page2-cumplimiento';
import { FiscalReviewPage3Reportes } from '@/components/fiscal-review/fiscal-review-page3-reportes';

/**
 * Vista de detalles de un fiscal específico (3 páginas)
 */
function FiscalDetailsView({
  fiscalId,
  onBack,
  initialYear,
}: {
  fiscalId: string;
  onBack: () => void;
  initialYear: number;
}) {
  const [page, setPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState(initialYear);
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
         <Button variant="outline" onClick={onBack} className="border-slate-600 text-slate-300 bg-transparent hover:bg-slate-700">
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
             <p className="text-blue-400 text-sm mt-1 font-medium">ID: {fiscalInfo.id || fiscalInfo.fiscalId}</p>
           </div>
         </div>
         <div className="flex gap-4 sm:gap-6 lg:gap-8 text-center pt-4 md:pt-0">
           <div>
             <p className="text-xl sm:text-2xl font-bold text-green-400">{totalAssigned}</p>
             <p className="text-slate-400 text-[10px] sm:text-xs mt-1 leading-tight">Contribuyentes</p>
           </div>
           <div>
             <p className="text-xl sm:text-2xl font-bold text-yellow-500">{activeProcess}</p>
             <p className="text-slate-400 text-[10px] sm:text-xs mt-1 leading-tight">Procesos<br className="hidden sm:block" /> Activos</p>
           </div>
           <div>
             <p className="text-xl sm:text-2xl font-bold text-blue-400">{completed}</p>
             <p className="text-slate-400 text-[10px] sm:text-xs mt-1 leading-tight">Procesos<br className="hidden sm:block" /> Completados</p>
           </div>
           <div>
             <p className="text-xl sm:text-2xl font-bold text-orange-400">{totalNotified}</p>
             <p className="text-slate-400 text-[10px] sm:text-xs mt-1 leading-tight">Procesos<br className="hidden sm:block" /> Notificados</p>
           </div>
         </div>
       </Card>

       {/* Render current page */}
       <div className="min-h-[400px]">
        {page === 1 && <FiscalReviewPage1Resumen fiscalInfo={fiscalInfo} performance={fiscalPerformance} selectedYear={selectedYear} setSelectedYear={setSelectedYear} fiscalTaxpayers={fiscalTaxpayers} fiscalMonthlyCollect={fiscalMonthlyCollect} fiscalComplianceByProcess={fiscalComplianceByProcess} />}
        {page === 2 && <FiscalReviewPage2Cumplimiento fiscalInfo={fiscalInfo} fiscalTaxpayerCompliance={fiscalTaxpayerCompliance} fiscalCollectAnalisis={fiscalCollectAnalisis} />}
         {page === 3 && <FiscalReviewPage3Reportes fiscalInfo={fiscalInfo} />}
       </div>

       {/* Pagination */}
       <div className="flex justify-center mt-6">
         <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 flex items-center justify-center gap-1 shadow-lg">
           <Button 
             variant="ghost" 
             size="sm" 
             onClick={() => setPage(p => Math.max(1, p - 1))}
             disabled={page === 1}
             className="text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-50 mx-1"
           >
             <ChevronLeft className="h-4 w-4 mr-1" />
             Anterior
           </Button>
           
           {[1, 2, 3].map(p => (
             <Button
               key={p}
               size="sm"
               onClick={() => setPage(p)}
               className={`w-10 transition-colors ${page === p ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' : 'bg-transparent text-slate-300 hover:bg-slate-800'}`}
             >
               {p}
             </Button>
           ))}
           
           <Button 
             variant="ghost" 
             size="sm" 
             onClick={() => setPage(p => Math.min(3, p + 1))}
             disabled={page === 3}
             className="text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-50 mx-1"
           >
             Siguiente
             <ChevronRight className="h-4 w-4 ml-1" />
           </Button>
         </div>
       </div>
    </div>
  );
}

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
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

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
            {[2024, 2025, 2026].map((year) => (
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
            <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-700">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || loading}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-20 transition-all" title="Primera página">
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-20 transition-all" title="Anterior">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 min-w-[110px] text-center">
                <span className="text-xs font-bold text-slate-300">Pág. {currentPage} / {totalPages}</span>
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

          <Card className="bg-slate-800 border-slate-700 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
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
                      <tr key={fiscal.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-all duration-200">
                        <td className="p-3 md:p-4 text-slate-200 text-sm">
                          {fiscal.personId ? Number(fiscal.personId).toLocaleString() : 'N/A'}
                        </td>
                        <td className="p-3 md:p-4 text-slate-200 font-medium text-sm">{fiscal.name ?? 'N/A'}</td>
                        <td className="p-3 md:p-4 text-slate-400 text-sm">{fiscal.group?.name ?? 'N/A'}</td>
                        <td className="p-3 md:p-4 text-slate-400 text-sm hidden md:table-cell">{fiscal.group?.coordinator?.name ?? 'N/A'}</td>
                        <td className="p-3 md:p-4 text-slate-400 text-sm hidden lg:table-cell">
                          {fiscal.role === 'FISCAL' && fiscal.supervisor?.name
                            ? fiscal.supervisor.name
                            : fiscal.role === 'SUPERVISOR'
                            ? fiscal.name
                            : 'N/A'}
                        </td>
                        <td className="p-3 md:p-4">
                          <Badge className={fiscal.role === 'FISCAL'
                            ? 'bg-blue-900/50 text-blue-200 border-blue-800'
                            : fiscal.role === 'SUPERVISOR'
                            ? 'bg-purple-900/50 text-purple-200 border-purple-800'
                            : 'bg-slate-700 text-slate-300 border-slate-600'
                          }>
                            {fiscal.role}
                          </Badge>
                        </td>
                        <td className="p-3 md:p-4 text-right">
                          <Button
                            onClick={() => setSelectedFiscalId(fiscal.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm transition-all shadow-md hover:shadow-lg px-2 md:px-4"
                          >
                            <TrendingUp className="h-4 w-4 md:mr-2" />
                            <span className="hidden md:inline">Ver Estadísticas</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </Card>
        </>
      )}
    </div>
  );
}
