import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/UI/card';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';
import {
  Select,
  SelectContent,  
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/UI/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/UI/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/UI/dialog';
import { Button as DialogButton } from '@/components/UI/button';
import { MoreVertical, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { Taxpayer } from '@/types/taxpayer';
import { Skeleton } from '@/components/UI/skeleton';
import { contract_type } from '@/types/taxpayer';
import { getTaxpayers, deleteTaxpayer } from '@/components/utils/api/taxpayer-functions';
import { AddContribuyenteModalV2, AddMultaModalV2, AddAvisoModalV2 } from '@/components/modals';
import type { ContribuyenteTableData } from '@/types/v2';
import toast from 'react-hot-toast';
import { useDebounce } from '@/hooks/use-debounce';

/**
 * AdminPageV2 - Vista de Administración con diseño Shadcn UI v2.0
 * 
 * Combina:
 * - Estructura visual de v0_reference (AdminTable, AdminFilters, cards)
 * - Lógica real de HomePage.tsx (API calls, estados, funciones)
 */
export default function AdminPageV2() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [taxpayers, setTaxpayers] = useState<Taxpayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [yearValue, setYearValue] = useState('Todos');
  const [statusValue, setStatusValue] = useState<'Todos' | 'Activos' | 'Inactivos'>('Todos');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taxpayerToDelete, setTaxpayerToDelete] = useState<Taxpayer | null>(null);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isAddContribuyenteOpen, setIsAddContribuyenteOpen] = useState(false);
  const [isAddAvisoOpen, setIsAddAvisoOpen] = useState(false);
  const [isAddMultaOpen, setIsAddMultaOpen] = useState(false);

  // Paginación del servidor
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalSpecial, setTotalSpecial] = useState(0);
  const [totalOrdinary, setTotalOrdinary] = useState(0);
  const limit = 50;

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debounce para búsqueda
  const debouncedSearch = useDebounce(searchValue.toLowerCase(), 500);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, yearValue]);

  // Cargar contribuyentes con paginación del servidor
  useEffect(() => {
    const loadTaxpayers = async () => {
      try {
        setLoading(true);
        const yearFilter = yearValue !== 'Todos' ? parseInt(yearValue, 10) : undefined;
        const searchFilter = debouncedSearch.trim() || undefined;
        const response = await getTaxpayers(currentPage, limit, yearFilter, searchFilter);
        setTaxpayers(response.data ?? []);
        setTotal(response.total ?? 0);
        setTotalPages(response.totalPages ?? 1);
        setTotalSpecial(response.totalSpecial ?? 0);
        setTotalOrdinary(response.totalOrdinary ?? 0);
      } catch (e) {
        console.error(e);
        toast.error('No se pudieron obtener los contribuyentes.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadTaxpayers();
    }
  }, [user, currentPage, debouncedSearch, yearValue]);

  // El filtro por status (Activos/Inactivos) se aplica localmente
  // ya que el backend no soporta ese filtro aún
  const filteredData = useMemo(() => {
    if (statusValue === 'Todos') return taxpayers;
    return taxpayers.filter(item =>
      statusValue === 'Activos' ? item.status === true : item.status === false
    );
  }, [taxpayers, statusValue]);

  // Generar años disponibles
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return ['Todos', ...Array.from({ length: currentYear - 2022 }, (_, i) => (2023 + i).toString())];
  }, []);

  // Mapear Taxpayer a formato de tabla
  const mapTaxpayerToTableData = (item: Taxpayer): ContribuyenteTableData => ({
    id: item.id,
    nroProvidencia: item.providenceNum?.toString() || 'N/A',
    procedimiento: item.process || 'N/A',
    razonSocial: item.name || 'N/A',
    rif: item.rif || 'N/A',
    tipo: item.contract_type === contract_type.SPECIAL ? 'Especial' : 'Ordinario',
    direccion: item.address || 'N/A',
    fecha: item.emition_date || '',
    parroquia: item.parish?.name || 'N/A',
    fiscal: item.user?.name || 'N/A',
    originalData: item, // Guardar referencia al objeto original
  });

  const tableData: ContribuyenteTableData[] = filteredData.map(mapTaxpayerToTableData);

  // Handlers
  const handleView = (item: ContribuyenteTableData) => {
    navigate(`/taxpayer/${item.id}`);
  };

  const handleEdit = (item: ContribuyenteTableData) => {
    // Navegar a la página de edición o abrir modal
    navigate(`/taxpayer/${item.id}`);
  };

  const handleDeleteClick = (item: ContribuyenteTableData) => {
    const taxpayer = item.originalData || taxpayers.find((t) => t.id === item.id);
    if (taxpayer) {
      setTaxpayerToDelete(taxpayer);
      setDeleteConfirmOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!taxpayerToDelete) return;

    try {
      await deleteTaxpayer(taxpayerToDelete.id);
      toast.success('Contribuyente eliminado correctamente');
      setTaxpayers((prev) => prev.filter((t) => t.id !== taxpayerToDelete.id));
      setDeleteConfirmOpen(false);
      setTaxpayerToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error('Error al eliminar el contribuyente');
    }
  };

  const toggleExpandRow = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]
    );
  };

  // Componente de tabla para mobile
  const MobileTable = () => (
    <div className="space-y-4">
      {tableData.map((item) => {
        const isExpanded = expandedRows.includes(item.id);
        return (
          <div
            key={item.id}
            className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden"
          >
            <div
              className="p-4 cursor-pointer hover:bg-slate-700 transition-all duration-200"
              onClick={() => toggleExpandRow(item.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-semibold text-white truncate">{item.razonSocial}</p>
                  <p className="text-xs text-slate-400 mt-1">{item.rif}</p>
                  <p className="text-xs text-slate-300 mt-2 font-mono">{item.nroProvidencia}</p>
                </div>
                <div className="text-right ml-2">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      item.tipo === 'Especial'
                        ? 'bg-purple-900 text-purple-200'
                        : 'bg-blue-900 text-blue-200'
                    }`}
                  >
                    {item.tipo}
                  </span>
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="bg-slate-900 border-t border-slate-700 p-4 space-y-3">
                <div>
                  <p className="text-xs text-slate-400">Dirección</p>
                  <p className="text-sm text-slate-200">{item.direccion}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Parroquia</p>
                    <p className="text-slate-200">{item.parroquia}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Fiscal</p>
                    <p className="text-slate-200">{item.fiscal}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Fecha</p>
                  <p className="text-slate-200">
                    {item.fecha ? new Date(item.fecha).toLocaleDateString('es-ES') : 'N/A'}
                  </p>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-700">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-8 bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleView(item.originalData);
                    }}
                  >
                    Ver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-8 bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(item.originalData);
                    }}
                  >
                    Editar
                  </Button>
                  {user?.role === 'ADMIN' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1 text-xs h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(item.originalData);
                      }}
                    >
                      Borrar
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Componente de tabla para desktop
  const DesktopTable = () => (
    <div className="rounded-lg border border-slate-700 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-800 hover:bg-slate-800 border-slate-700">
            <TableHead className="text-slate-300 font-semibold">Nro Providencia</TableHead>
            <TableHead className="text-slate-300 font-semibold">Procedimiento</TableHead>
            <TableHead className="text-slate-300 font-semibold">Razón Social</TableHead>
            <TableHead className="text-slate-300 font-semibold">RIF</TableHead>
            <TableHead className="text-slate-300 font-semibold">Tipo</TableHead>
            <TableHead className="text-slate-300 font-semibold hidden lg:table-cell">
              Dirección
            </TableHead>
            <TableHead className="text-slate-300 font-semibold hidden md:table-cell">Fecha</TableHead>
            <TableHead className="text-slate-300 font-semibold hidden lg:table-cell">Parroquia</TableHead>
            <TableHead className="text-slate-300 font-semibold hidden xl:table-cell">Fiscal</TableHead>
            <TableHead className="text-slate-300 font-semibold text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-slate-400 py-8">
                Cargando...
              </TableCell>
            </TableRow>
          ) : tableData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-slate-400 py-8">
                No se encontraron contribuyentes
              </TableCell>
            </TableRow>
          ) : (
            tableData.map((item) => (
              <TableRow
                key={item.id}
                className="border-slate-700 hover:bg-slate-800 transition-all duration-200"
              >
                <TableCell className="font-mono text-xs text-slate-300">
                  {item.nroProvidencia}
                </TableCell>
                <TableCell className="text-xs text-slate-400">{item.procedimiento}</TableCell>
                <TableCell className="text-sm text-slate-200 font-medium">
                  {item.razonSocial}
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-400">{item.rif}</TableCell>
                <TableCell>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      item.tipo === 'Especial'
                        ? 'bg-purple-900 text-purple-200'
                        : 'bg-blue-900 text-blue-200'
                    }`}
                  >
                    {item.tipo}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-slate-400 hidden lg:table-cell">
                  {item.direccion}
                </TableCell>
                <TableCell className="text-xs text-slate-400 hidden md:table-cell">
                  {item.fecha ? new Date(item.fecha).toLocaleDateString('es-ES') : 'N/A'}
                </TableCell>
                <TableCell className="text-xs text-slate-400 hidden lg:table-cell">
                  {item.parroquia}
                </TableCell>
                <TableCell className="text-xs text-slate-400 hidden xl:table-cell">
                  {item.fiscal}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-white bg-slate-800/80 border border-slate-700/50 rounded-full hover:bg-indigo-600 hover:border-indigo-500 hover:text-white transition-all shadow-md">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32 bg-slate-800 border-slate-700">
                      <DropdownMenuItem
                        onClick={() => handleView(item.originalData)}
                        className="text-slate-300 focus:bg-slate-700 focus:text-white transition-colors"
                      >
                        Ver Detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleEdit(item.originalData)}
                        className="text-slate-300 focus:bg-slate-700 focus:text-white transition-colors"
                      >
                        Editar
                      </DropdownMenuItem>
                      {user?.role === 'ADMIN' && (
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(item.originalData)}
                          className="text-destructive focus:bg-slate-700 focus:text-red-300 transition-colors"
                        >
                          Borrar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Administración</h1>
          <p className="text-slate-400 mt-2">Gestión integral de contribuyentes y providencias</p>
        </div>

        {/* Acciones Rápidas y Filtros */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <Card className="bg-slate-800 border-slate-700 p-4 flex-1">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Buscar</label>
              <Input
                placeholder="Razón Social, RIF, Nro Providencia..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Año</label>
              <Select value={yearValue} onValueChange={setYearValue}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Seleccionar año" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Estado</label>
              <Select value={statusValue} onValueChange={(value) => setStatusValue(value as 'Todos' | 'Activos' | 'Inactivos')}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Activos">Activos</SelectItem>
                  <SelectItem value="Inactivos">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          </Card>

          {/* Desktop: Show all buttons in a row */}
          <div className="hidden lg:flex gap-2 flex-shrink-0">
            <Button
              onClick={() => setIsAddContribuyenteOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md transition-all duration-200"
            >
              Agregar Contribuyente
            </Button>
            <Button
              onClick={() => setIsAddAvisoOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-all duration-200"
            >
              Agregar Aviso
            </Button>
            <Button
              onClick={() => setIsAddMultaOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-all duration-200"
            >
              Agregar Multa
            </Button>
            <Button
              onClick={() => navigate('/index-iva')}
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-md transition-all duration-200"
            >
              Actualizar IVA
            </Button>
          </div>

          {/* Mobile/Tablet: Show dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="lg:hidden w-full">
              <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-md flex items-center justify-center gap-2 h-11">
                Acciones Rápidas
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
              <DropdownMenuItem
                onClick={() => setIsAddContribuyenteOpen(true)}
                className="gap-2 cursor-pointer text-emerald-400 focus:bg-slate-700 focus:text-emerald-300"
              >
                <span className="text-lg">➕</span>
                Agregar Contribuyente
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsAddAvisoOpen(true)}
                className="gap-2 cursor-pointer text-blue-400 focus:bg-slate-700 focus:text-blue-300"
              >
                <span className="text-lg">🔔</span>
                Agregar Aviso
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsAddMultaOpen(true)}
                className="gap-2 cursor-pointer text-red-400 focus:bg-slate-700 focus:text-red-300"
              >
                <span className="text-lg">⚠️</span>
                Agregar Multa
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('/index-iva')}
                className="gap-2 cursor-pointer text-violet-400 focus:bg-slate-700 focus:text-violet-300"
              >
                <span className="text-lg">📊</span>
                Actualizar Índices IVA
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Cards de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700 p-4 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
            <p className="text-slate-400 text-sm">Total Contribuyentes</p>
            <p className="text-2xl font-bold text-white mt-2">{loading ? '—' : total.toLocaleString()}</p>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-4 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
            <p className="text-slate-400 text-sm">Especiales</p>
            <p className="text-2xl font-bold text-purple-400 mt-2">
              {loading ? '—' : totalSpecial.toLocaleString()}
            </p>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-4 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
            <p className="text-slate-400 text-sm">Ordinarios</p>
            <p className="text-2xl font-bold text-blue-400 mt-2">
              {loading ? '—' : totalOrdinary.toLocaleString()}
            </p>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-4 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
            <p className="text-slate-400 text-sm">Activos (pág.)</p>
            <p className="text-2xl font-bold text-green-400 mt-2">
              {filteredData.filter((x) => x.status === true).length}
            </p>
          </Card>
        </div>

        {/* Controles de Paginación */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2">
          <p className="text-sm text-slate-400">
            {loading ? 'Cargando...' : total > 0 ? (
              <>Vista <span className="text-indigo-400 font-bold">{((currentPage - 1) * limit + 1)}–{Math.min(currentPage * limit, total)}</span> de <span className="text-slate-200 font-bold">{total.toLocaleString()}</span> contribuyentes</>
            ) : '0 resultados'}
          </p>
          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || loading}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-20 transition-all"
              title="Primera página"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-20 transition-all"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 min-w-[110px] text-center">
              <span className="text-xs font-bold text-slate-300">Pág. {currentPage} / {totalPages}</span>
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || loading}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-20 transition-all"
              title="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || loading}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-20 transition-all"
              title="Última página"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabla */}
        {isMobile ? <MobileTable /> : <DesktopTable />}


        {/* Modal de confirmación de eliminación */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription className="text-slate-400">
                ¿Está seguro que desea eliminar al contribuyente{' '}
                <strong>{taxpayerToDelete?.name}</strong>? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogButton
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setTaxpayerToDelete(null);
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              >
                Cancelar
              </DialogButton>
              <DialogButton
                variant="destructive"
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Eliminar
              </DialogButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modales de Acciones Rápidas */}
        <AddContribuyenteModalV2
          isOpen={isAddContribuyenteOpen}
          onClose={() => setIsAddContribuyenteOpen(false)}
          onSuccess={async () => {
            try {
              const yearFilter = yearValue !== 'Todos' ? parseInt(yearValue, 10) : undefined;
              const searchFilter = debouncedSearch.trim() || undefined;
              const response = await getTaxpayers(currentPage, limit, yearFilter, searchFilter);
              setTaxpayers(response.data ?? []);
              setTotal(response.total ?? 0);
              setTotalPages(response.totalPages ?? 1);
              setTotalSpecial(response.totalSpecial ?? 0);
              setTotalOrdinary(response.totalOrdinary ?? 0);
            } catch (e) {
              console.error(e);
            }
          }}
        />

        <AddAvisoModalV2
          isOpen={isAddAvisoOpen}
          onClose={() => setIsAddAvisoOpen(false)}
          onSuccess={() => {
            // Opcional: refrescar datos si es necesario
          }}
        />

        <AddMultaModalV2
          isOpen={isAddMultaOpen}
          onClose={() => setIsAddMultaOpen(false)}
          onSuccess={() => {
            // Opcional: refrescar datos si es necesario
          }}
        />
      </div>
  );
}
