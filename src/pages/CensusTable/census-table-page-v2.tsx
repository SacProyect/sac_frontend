import { AutomationPromoBanner } from '@/components/subscription/automation-promo-banner';
import { useState, useEffect, useMemo } from 'react';
import { getTaxpayerCensus } from '@/components/utils/api/taxpayer-census-functions';
import { deleteTaxpayerCensus } from '@/components/utils/api/taxpayer-census-functions';
import type { TaxpayerCensus } from '@/types/taxpayer-census';
import { Card } from '@/components/UI/card';
import { Input } from '@/components/UI/input';
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
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/badge';
import { ArrowLeft, MoreHorizontal, Search, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useDebounce } from '@/hooks/use-debounce';
import { LoadingState, EmptyState, PageHeader } from '@/components/UI/v2';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
/**
 * CensusTablePageV2 - Tabla de Contribuyentes Censados con diseño Shadcn UI v2.0
 */
export default function CensusTablePageV2() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [taxpayersCensus, setTaxpayersCensus] = useState<TaxpayerCensus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taxpayerToDelete, setTaxpayerToDelete] = useState<TaxpayerCensus | null>(null);

  const debouncedSearch = useDebounce(searchValue.toLowerCase(), 300);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getTaxpayerCensus();
        setTaxpayersCensus(response.data || []);
      } catch (e) {
        console.error(e);
        toast.error('No se pudieron obtener los contribuyentes censados.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    if (!debouncedSearch.trim()) return taxpayersCensus;

    return taxpayersCensus.filter((item) => {
      const search = debouncedSearch;
      return (
        item.number.toString().includes(search) ||
        item.process?.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search) ||
        item.rif.toLowerCase().includes(search) ||
        item.type?.toLowerCase().includes(search) ||
        item.address?.toLowerCase().includes(search) ||
        item.fiscal?.name?.toLowerCase().includes(search) ||
        (item.emition_date &&
          new Date(item.emition_date).toLocaleDateString().includes(search))
      );
    });
  }, [taxpayersCensus, debouncedSearch]);

  const handleDelete = async () => {
    if (!taxpayerToDelete) return;

    try {
      const res = await deleteTaxpayerCensus(taxpayerToDelete.id);
      if (res) {
        setTaxpayersCensus((prev) => prev.filter((r) => r.id !== taxpayerToDelete.id));
        toast.success('Contribuyente eliminado correctamente.');
        setDeleteConfirmOpen(false);
        setTaxpayerToDelete(null);
      } else {
        toast.error('No se pudo eliminar el contribuyente.');
      }
    } catch (error) {
      toast.error('Error al eliminar.');
      console.error(error);
    }
  };

  if (loading) {
    return <LoadingState message="Cargando contribuyentes censados..." />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <PageHeader
        title="Tabla Censo"
        description="Gestión de contribuyentes censados"
        action={<Button variant="outline" onClick={() => navigate('/admin')} className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>}
      />

      <AutomationPromoBanner className="mb-2" />

      {/* Filtros */}
      <Card className="bg-slate-800 border-slate-700 p-4 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <Input
            placeholder="Buscar por número, nombre, RIF, proceso..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 flex-1"
          />
        </div>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700 p-4 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
          <p className="text-slate-400 text-sm">Total Censados</p>
          <p className="text-2xl font-bold text-white mt-2">{filteredData.length}</p>
        </Card>
        <Card className="bg-slate-800 border-slate-700 p-4 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
          <p className="text-slate-400 text-sm">Especiales</p>
          <p className="text-2xl font-bold text-purple-400 mt-2">
            {filteredData.filter((x) => x.type === 'SPECIAL').length}
          </p>
        </Card>
        <Card className="bg-slate-800 border-slate-700 p-4 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
          <p className="text-slate-400 text-sm">Ordinarios</p>
          <p className="text-2xl font-bold text-blue-400 mt-2">
            {filteredData.filter((x) => x.type === 'ORDINARY').length}
          </p>
        </Card>
      </div>

      {/* Tabla / Lista responsiva (sin scroll horizontal) */}
      {filteredData.length === 0 ? (
        <EmptyState title="No hay contribuyentes censados" message="Intenta ajustar los filtros de búsqueda" />
      ) : (
        <>
          {/* Vista Desktop (md y superior) - Tabla completa */}
          <Card className="hidden md:block bg-slate-800 border-slate-700 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
            <div className="overflow-x-auto">
              <Table className="min-w-full divide-y divide-slate-700">
                <TableHeader>
                  <TableRow className="bg-slate-800 hover:bg-slate-800 border-slate-700">
                    <TableHead className="text-slate-300 font-semibold text-xs sm:text-sm">Número</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-xs sm:text-sm">Proceso</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-xs sm:text-sm">Nombre</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-xs sm:text-sm">RIF</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-xs sm:text-sm">Tipo</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-xs sm:text-sm">Dirección</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-xs sm:text-sm">Fecha Emisión</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-xs sm:text-sm">Fiscal</TableHead>
                    {user?.role === 'ADMIN' && (
                      <TableHead className="text-slate-300 font-semibold text-xs sm:text-sm">Acciones</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow
                      key={item.id}
                      className="border-slate-700 hover:bg-slate-800 transition-all duration-200"
                    >
                      <TableCell className="text-slate-200 text-xs sm:text-sm">{item.number}</TableCell>
                      <TableCell className="text-slate-200 text-xs sm:text-sm">{item.process || 'N/A'}</TableCell>
                      <TableCell className="text-slate-200 font-medium text-xs sm:text-sm">{item.name}</TableCell>
                      <TableCell className="text-slate-200 font-mono text-xs sm:text-sm">{item.rif}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            item.type === 'SPECIAL'
                              ? 'bg-purple-900 text-purple-200 text-xs'
                              : 'bg-blue-900 text-blue-200 text-xs'
                          }
                        >
                          {item.type === 'SPECIAL' ? 'Especial' : 'Ordinario'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs sm:text-sm">
                        {item.address || 'N/A'}
                      </TableCell>
                      <TableCell className="text-slate-200 text-xs sm:text-sm">
                        {item.emition_date
                          ? new Date(item.emition_date).toLocaleDateString()
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="text-slate-200 text-xs sm:text-sm">
                        {item.fiscal?.name || 'N/A'}
                      </TableCell>
                      {user?.role === 'ADMIN' && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                              <DropdownMenuItem
                                onClick={() => {
                                  setTaxpayerToDelete(item);
                                  setDeleteConfirmOpen(true);
                                }}
                                className="text-red-400 focus:bg-slate-700 focus:text-red-300 cursor-pointer transition-colors"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Vista Móvil (debajo de md) - Tarjetas verticales (sin scroll horizontal) */}
          <div className="md:hidden space-y-3">
            {filteredData.map((item) => (
              <Card
                key={item.id}
                className="bg-slate-800 border-slate-700 p-4 transition-all duration-200 hover:border-slate-600 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">#{item.number}</span>
                      <span className="text-sm font-semibold text-white truncate">{item.name}</span>
                    </div>
                    <div className="mt-1 font-mono text-xs text-slate-300">{item.rif}</div>
                  </div>

                  <Badge
                    className={
                      item.type === 'SPECIAL'
                        ? 'bg-purple-900 text-purple-200 text-xs shrink-0'
                        : 'bg-blue-900 text-blue-200 text-xs shrink-0'
                    }
                  >
                    {item.type === 'SPECIAL' ? 'Especial' : 'Ordinario'}
                  </Badge>
                </div>

                <div className="mt-3 space-y-1 text-sm">
                  {item.process && (
                    <div className="flex justify-between text-slate-400">
                      <span className="text-slate-500">Proceso</span>
                      <span className="text-slate-200 text-right">{item.process}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span className="text-slate-500">Fiscal</span>
                    <span className="text-slate-200 text-right">{item.fiscal?.name || 'N/A'}</span>
                  </div>
                </div>

                {user?.role === 'ADMIN' && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-red-400 hover:text-red-300 hover:bg-red-950/40"
                      onClick={() => {
                        setTaxpayerToDelete(item);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Eliminar
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Modal de confirmación */}
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
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setTaxpayerToDelete(null);
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
