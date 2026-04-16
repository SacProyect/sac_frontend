import { useState, useMemo, useEffect, useRef } from 'react';
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
import { MoreVertical, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, X, Building2, Plus, FileText, Scale } from 'lucide-react';
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
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Paginación del servidor
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalSpecial, setTotalSpecial] = useState(0);
  const [totalOrdinary, setTotalOrdinary] = useState(0);
  const limit = 50;

  // Detectar mobile/tablet (< 1024px usa vista de cards)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cerrar el panel de resultados al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const debouncedSearch = useDebounce(searchValue.toLowerCase(), 500);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, yearValue]);

  // Colapsar todos los cards al cambiar de página
  useEffect(() => {
    setExpandedRows([]);
  }, [currentPage]);

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
              className="p-4 cursor-pointer hover:bg-slate-700/60 transition-all duration-200"
              onClick={() => toggleExpandRow(item.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{item.razonSocial}</p>
                  <p className="text-xs text-slate-400 mt-1">{item.rif}</p>
                  <p className="text-xs text-slate-300 mt-2 font-mono">{item.nroProvidencia}</p>
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      item.tipo === 'Especial'
                        ? 'bg-purple-900 text-purple-200'
                        : 'bg-blue-900 text-blue-200'
                    }`}
                  >
                    {item.tipo}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
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
                    className="flex-1 text-xs h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all active:scale-95"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleView(item.originalData);
                    }}
                  >
                    Ver Detalles
                  </Button>
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
    <div className="rounded-lg border border-slate-700 overflow-x-auto">
      <div className="min-w-[700px]">
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
            Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i} className="border-slate-700">
                <TableCell><Skeleton className="h-5 w-16 bg-slate-700" /></TableCell>
                <TableCell><Skeleton className="h-5 w-14 bg-slate-700" /></TableCell>
                <TableCell><Skeleton className="h-5 min-w-[120px] bg-slate-700" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24 bg-slate-700" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16 bg-slate-700" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 min-w-[80px] bg-slate-700" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20 bg-slate-700" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24 bg-slate-700" /></TableCell>
                <TableCell className="hidden xl:table-cell"><Skeleton className="h-5 w-24 bg-slate-700" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded bg-slate-700" /></TableCell>
              </TableRow>
            ))
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
                className="border-slate-700 hover:bg-slate-800 transition-all duration-200 h-14"
              >
                <TableCell className="font-mono text-xs text-slate-300 whitespace-nowrap">
                  {item.nroProvidencia}
                </TableCell>
                <TableCell className="text-xs text-slate-400 whitespace-nowrap">{item.procedimiento}</TableCell>
                <TableCell className="text-sm text-slate-200 font-medium max-w-[160px]">
                  <span className="block truncate" title={item.razonSocial}>{item.razonSocial}</span>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-400 whitespace-nowrap">{item.rif}</TableCell>
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
                <TableCell className="text-xs text-slate-400 hidden lg:table-cell max-w-[140px]">
                  <span className="block truncate" title={item.direccion}>{item.direccion}</span>
                </TableCell>
                <TableCell className="text-xs text-slate-400 hidden md:table-cell">
                  {item.fecha ? new Date(item.fecha).toLocaleDateString('es-ES') : 'N/A'}
                </TableCell>
                <TableCell className="text-xs text-slate-400 hidden lg:table-cell whitespace-nowrap">
                  <span className="block truncate max-w-[100px]" title={item.parroquia}>{item.parroquia}</span>
                </TableCell>
                <TableCell className="text-xs text-slate-400 hidden xl:table-cell">
                  {item.fiscal}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(item.originalData)}
                    className="h-8 px-3 text-xs font-semibold text-indigo-400 hover:text-white hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 rounded-lg transition-all"
                  >
                    Ver Detalle
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Administración</h1>
          <p className="text-slate-400 mt-1">Gestión integral de contribuyentes y providencias</p>
        </div>
        
        {/* Acciones Rápidas (Ahora en el Top-Right) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full md:w-auto">
            <Button
              onClick={() => setIsAddContribuyenteOpen(true)}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-md shadow-emerald-900/30 transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 px-3 h-9 text-xs"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Contribuyente</span>
            </Button>

            <Button
              onClick={() => setIsAddAvisoOpen(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-md shadow-blue-900/30 transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 px-3 h-9 text-xs"
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Aviso</span>
            </Button>

            <Button
              onClick={() => setIsAddMultaOpen(true)}
              size="sm"
              className="bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg shadow-md shadow-red-900/30 transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 px-3 h-9 text-xs"
            >
              <Scale className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Multa</span>
            </Button>
          </div>
        </div>

      </div>

      {/* Filtros y Búsqueda (Arriba) */}
      <div className="w-full">
        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="space-y-4">
            {/* Buscador: fila completa */}
            <div className="relative" ref={searchContainerRef}>
              <label className="block text-sm font-medium text-slate-300 mb-2">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Razón Social, RIF, Nro Providencia..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 pl-9 pr-9 h-11"
                />
                {searchValue && (
                  <button
                    onClick={() => { setSearchValue(''); setSearchFocused(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Panel de resultados en tiempo real — solo en tablet/mobile */}
              {searchFocused && searchValue.trim() && isMobile && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl shadow-black/50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-slate-700 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {loading ? 'Buscando...' : `${tableData.length} resultado${tableData.length !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto overscroll-contain">
                    {loading ? (
                      <div className="space-y-1 p-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-md">
                            <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse flex-shrink-0" />
                            <div className="flex-1 space-y-1.5">
                              <div className="h-3 bg-slate-700 rounded animate-pulse w-3/4" />
                              <div className="h-2.5 bg-slate-700/60 rounded animate-pulse w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      tableData.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            navigate(`/taxpayer/${item.id}`);
                            setSearchFocused(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/80 active:bg-slate-700 transition-colors text-left border-b border-slate-700/50 last:border-0"
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                            item.tipo === 'Especial' ? 'bg-purple-900/60 text-purple-300' : 'bg-blue-900/60 text-blue-300'
                          }`}>
                            {item.tipo === 'Especial' ? 'E' : 'O'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-100 truncate">{item.razonSocial}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-400 font-mono">{item.rif}</span>
                              {item.nroProvidencia !== 'N/A' && (
                                <span className="text-xs text-slate-500">· {item.nroProvidencia}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Filtros secundarios: Año y Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Año</label>
                <Select value={yearValue} onValueChange={setYearValue}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-10 w-full">
                    <SelectValue placeholder="Seleccionar año" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Estado</label>
                <Select value={statusValue} onValueChange={(value) => setStatusValue(value as 'Todos' | 'Activos' | 'Inactivos')}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-10 w-full">
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
          </div>
        </Card>
      </div>


      {/* Cards de estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
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

      {/* Tabla - en tablet usa card expandible, en desktop usa tabla */}
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
        onSuccess={() => {}}
      />

      <AddMultaModalV2
        isOpen={isAddMultaOpen}
        onClose={() => setIsAddMultaOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
