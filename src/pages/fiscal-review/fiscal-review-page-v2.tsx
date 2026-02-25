import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getFiscalsForReview } from '@/components/utils/api/taxpayerFunctions';
import type { User } from '@/types/user';
import { Card } from '@/components/UI/card';
import { Input } from '@/components/UI/input';
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/badge';
import { Search, TrendingUp } from 'lucide-react';
import { EmptyState, PageHeader } from '@/components/UI/v2';
import { TableSkeleton } from '@/components/UI/TableSkeleton';
import toast from 'react-hot-toast';

/**
 * FiscalReviewPageV2 - Revisión de Fiscales con diseño Shadcn UI v2.0
 */
export default function FiscalReviewPageV2() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fiscalArray, setFiscalArray] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchTaxpayers = async () => {
      try {
        setLoading(true);
        const response = await getFiscalsForReview(undefined, currentPage, limit);
        setFiscalArray(response.data.data || []);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      } catch (e) {
        console.error(e);
        toast.error('No se pudieron obtener los fiscales.');
      } finally {
        setLoading(false);
      }
    };

    fetchTaxpayers();
  }, [user, navigate, currentPage, limit]);

  // Filtrar fiscales
  const filteredFiscals = fiscalArray.filter((f) => {
    const q = searchValue.trim().toLowerCase();
    return (
      f.name?.toLowerCase().includes(q) ||
      f.group?.name?.toLowerCase().includes(q) ||
      f.role.toLowerCase().includes(q) ||
      f.supervisor?.name.toLowerCase().includes(q) ||
      f.personId?.toString().includes(q)
    );
  });

  // Ordenar por nombre
  const sortedFiscals = [...filteredFiscals].sort((a, b) =>
    (a.name ?? '').localeCompare(b.name ?? '')
  );

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <PageHeader
        title="Revisión de Fiscales"
        description="Consulta y análisis de desempeño de fiscales"
      />

      {/* Filtros */}
      <Card className="bg-slate-800 border-slate-700 p-4 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, cédula, grupo o supervisor..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
          />
        </div>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700 p-4 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
          <p className="text-slate-400 text-sm">Total Fiscales</p>
          <p className="text-2xl font-bold text-white mt-2">{filteredFiscals.length}</p>
        </Card>
        <Card className="bg-slate-800 border-slate-700 p-4 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
          <p className="text-slate-400 text-sm">Fiscales Activos</p>
          <p className="text-2xl font-bold text-green-400 mt-2">
            {filteredFiscals.filter((f) => f.role === 'FISCAL').length}
          </p>
        </Card>
        <Card className="bg-slate-800 border-slate-700 p-4 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
          <p className="text-slate-400 text-sm">Supervisores</p>
          <p className="text-2xl font-bold text-blue-400 mt-2">
            {filteredFiscals.filter((f) => f.role === 'SUPERVISOR').length}
          </p>
        </Card>
      </div>

      {/* Controles de Paginación */}
      <Card className="bg-slate-800 border-slate-700 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-400">
            Mostrando {loading ? '...' : fiscalArray.length > 0 ? ((currentPage - 1) * limit + 1) : 0} - {loading ? '...' : Math.min(currentPage * limit, total)} de {loading ? '...' : total} fiscales
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || loading} variant="outline" size="sm" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 disabled:opacity-50">Primera</Button>
            <Button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1 || loading} variant="outline" size="sm" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 disabled:opacity-50">Anterior</Button>
            <span className="px-4 py-1 text-sm font-medium text-slate-300">Página {currentPage} de {totalPages}</span>
            <Button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || loading} variant="outline" size="sm" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 disabled:opacity-50">Siguiente</Button>
            <Button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || loading} variant="outline" size="sm" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 disabled:opacity-50">Última</Button>
          </div>
        </div>
      </Card>

      {/* Tabla de Fiscales */}
      {loading ? (
        <Card className="bg-slate-800 border-slate-700 overflow-hidden">
          <TableSkeleton columns={6} rows={8} className="border-0 bg-transparent" skeletonClassName="bg-slate-700" />
        </Card>
      ) : sortedFiscals.length === 0 ? (
        <EmptyState title="No se encontraron fiscales" message="Intenta ajustar los filtros de búsqueda" />
      ) : (
        <Card className="bg-slate-800 border-slate-700 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 text-slate-300 font-semibold">Cédula</th>
                  <th className="text-left p-4 text-slate-300 font-semibold">Nombre</th>
                  <th className="text-left p-4 text-slate-300 font-semibold">Grupo</th>
                  <th className="text-left p-4 text-slate-300 font-semibold">Supervisor</th>
                  <th className="text-left p-4 text-slate-300 font-semibold">Rol</th>
                  <th className="text-right p-4 text-slate-300 font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody>
                {sortedFiscals
                  .filter((t) => t.id && t.personId)
                  .map((fiscal) => (
                    <tr
                      key={fiscal.id}
                      className="border-b border-slate-700 hover:bg-slate-800 transition-all duration-200"
                    >
                      <td className="p-4 text-slate-200">
                        {fiscal.personId
                          ? Number(fiscal.personId).toLocaleString()
                          : 'N/A'}
                      </td>
                      <td className="p-4 text-slate-200 font-medium">{fiscal.name ?? 'N/A'}</td>
                      <td className="p-4 text-slate-400 text-sm">
                        {fiscal.group?.name ?? 'N/A'}
                      </td>
                      <td className="p-4 text-slate-400 text-sm">
                        {fiscal.role === 'FISCAL' && fiscal.supervisor?.name
                          ? fiscal.supervisor.name
                          : fiscal.role === 'SUPERVISOR'
                          ? fiscal.name
                          : 'N/A'}
                      </td>
                      <td className="p-4">
                        <Badge
                          className={
                            fiscal.role === 'FISCAL'
                              ? 'bg-blue-900 text-blue-200'
                              : fiscal.role === 'SUPERVISOR'
                              ? 'bg-purple-900 text-purple-200'
                              : 'bg-slate-700 text-slate-300'
                          }
                        >
                          {fiscal.role}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          onClick={() => navigate(`/v2/stats/fiscal/${fiscal.id}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm transition-all duration-200"
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Ver Estadísticas
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
