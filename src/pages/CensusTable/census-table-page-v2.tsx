import { useState, useEffect, useMemo } from 'react';
import { getTaxpayerCensus } from '@/components/utils/api/taxpayerCensusFunctions';
import { deleteTaxpayerCensus } from '@/components/utils/api/taxpayerCensusFunctions';
import type { TaxpayerCensus } from '@/types/taxpayerCensus';
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
import { MoreHorizontal, Search, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { LoadingState, EmptyState, PageHeader } from '@/components/UI/v2';
import toast from 'react-hot-toast';

/**
 * CensusTablePageV2 - Tabla de Contribuyentes Censados con diseño Shadcn UI v2.0
 */
export default function CensusTablePageV2() {
  const { user } = useAuth();
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
      />

      {/* Filtros */}
      <Card className="bg-slate-800 border-slate-700 p-4 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por número, nombre, RIF, proceso..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
          />
        </div>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Tabla */}
      {filteredData.length === 0 ? (
        <EmptyState title="No hay contribuyentes censados" message="Intenta ajustar los filtros de búsqueda" />
      ) : (
        <Card className="bg-slate-800 border-slate-700 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-800 hover:bg-slate-800 border-slate-700">
                  <TableHead className="text-slate-300 font-semibold">Número</TableHead>
                  <TableHead className="text-slate-300 font-semibold">Proceso</TableHead>
                  <TableHead className="text-slate-300 font-semibold">Nombre</TableHead>
                  <TableHead className="text-slate-300 font-semibold">RIF</TableHead>
                  <TableHead className="text-slate-300 font-semibold">Tipo</TableHead>
                  <TableHead className="text-slate-300 font-semibold">Dirección</TableHead>
                  <TableHead className="text-slate-300 font-semibold">Fecha Emisión</TableHead>
                  <TableHead className="text-slate-300 font-semibold">Fiscal</TableHead>
                  {user?.role === 'ADMIN' && (
                    <TableHead className="text-slate-300 font-semibold">Acciones</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow
                    key={item.id}
                    className="border-slate-700 hover:bg-slate-800 transition-all duration-200"
                  >
                    <TableCell className="text-slate-200">{item.number}</TableCell>
                    <TableCell className="text-slate-200">{item.process || 'N/A'}</TableCell>
                    <TableCell className="text-slate-200 font-medium">{item.name}</TableCell>
                    <TableCell className="text-slate-200 font-mono">{item.rif}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          item.type === 'SPECIAL'
                            ? 'bg-purple-900 text-purple-200'
                            : 'bg-blue-900 text-blue-200'
                        }
                      >
                        {item.type === 'SPECIAL' ? 'Especial' : 'Ordinario'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {item.address || 'N/A'}
                    </TableCell>
                    <TableCell className="text-slate-200 text-sm">
                      {item.emition_date
                        ? new Date(item.emition_date).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-slate-200">
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
