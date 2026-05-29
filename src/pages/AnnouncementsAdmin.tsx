import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/UI/card';
import { Button } from '@/components/UI/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select';
import { Plus, Edit, Trash2, Search, Inbox } from 'lucide-react';
import { getAnnouncements } from '@/components/utils/api/announcements-admin-functions';
import { Announcement } from '@/types/announcements';
import { AnnouncementFormModal } from '@/components/modals/announcement-form-modal';
import { AnnouncementDeleteModal } from '@/components/modals/announcement-delete-modal';
import toast from 'react-hot-toast';

const typeBadgeStyles: Record<string, string> = {
  TOP_BAR: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  MODAL: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  TOOLTIP: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const typeLabels: Record<string, string> = {
  TOP_BAR: 'Barra Superior',
  MODAL: 'Modal',
  TOOLTIP: 'Tooltip',
};

const targetTypeLabels: Record<string, string> = {
  GLOBAL: 'Global',
  ROLE: 'Rol',
  COORDINACION: 'Coordinación',
  SPECIFIC_USER: 'Usuario Específico',
};

function formatDate(isoStr?: string): string {
  if (!isoStr) return '—';
  try {
    return new Date(isoStr).toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function AnnouncementsAdmin() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // Filter states
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTargetType, setFilterTargetType] = useState<string>('all');
  const [searchTitle, setSearchTitle] = useState('');

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch {
      toast.error('Error cargando anuncios');
    } finally {
      setLoading(false);
    }
  };

  // ── Client-side filtering (AND logic) ──
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      if (filterType !== 'all' && a.type !== filterType) return false;
      if (filterStatus === 'active' && !a.isActive) return false;
      if (filterStatus === 'inactive' && a.isActive) return false;
      if (filterTargetType !== 'all' && a.targetType !== filterTargetType) return false;
      if (searchTitle.trim()) {
        const query = searchTitle.toLowerCase().trim();
        if (!a.title.toLowerCase().includes(query)) return false;
      }
      return true;
    });
  }, [announcements, filterType, filterStatus, filterTargetType, searchTitle]);

  // ── Handlers ──
  const handleCreate = () => {
    setEditingAnnouncement(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsDeleteModalOpen(true);
  };

  const handleFormSuccess = () => {
    loadAnnouncements();
  };

  const handleDeleteSuccess = () => {
    loadAnnouncements();
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white break-words">
            Gestión de Anuncios
          </h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">
            Administra los avisos y anuncios del sistema
          </p>
        </div>
        <div className="shrink-0 w-full sm:w-auto">
          <Button
            onClick={handleCreate}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Anuncio
          </Button>
        </div>
      </div>

      {/* ── Filters ── */}
      <Card className="bg-slate-800 border-slate-700 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search by title */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Buscar por título..."
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              className="pl-9 bg-slate-900/50 border-slate-700 focus:ring-indigo-500/30 rounded-xl h-10 text-slate-200 transition-all text-sm"
            />
          </div>

          {/* Filter by type */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-200 rounded-xl h-10 text-sm">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="TOP_BAR">Barra Superior</SelectItem>
              <SelectItem value="MODAL">Modal</SelectItem>
              <SelectItem value="TOOLTIP">Tooltip</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter by status */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-200 rounded-xl h-10 text-sm">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter by targetType */}
          <Select value={filterTargetType} onValueChange={setFilterTargetType}>
            <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-200 rounded-xl h-10 text-sm">
              <SelectValue placeholder="Objetivo" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">Todos los objetivos</SelectItem>
              <SelectItem value="GLOBAL">Global</SelectItem>
              <SelectItem value="ROLE">Rol</SelectItem>
              <SelectItem value="COORDINACION">Coordinación</SelectItem>
              <SelectItem value="SPECIFIC_USER">Usuario Específico</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* ── Table ── */}
      <Card className="bg-slate-800 border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-slate-800">
              <TableHead className="text-slate-300 font-semibold text-xs uppercase tracking-wider">
                Título
              </TableHead>
              <TableHead className="text-slate-300 font-semibold text-xs uppercase tracking-wider">
                Tipo
              </TableHead>
              <TableHead className="text-slate-300 font-semibold text-xs uppercase tracking-wider hidden md:table-cell">
                Target
              </TableHead>
              <TableHead className="text-slate-300 font-semibold text-xs uppercase tracking-wider hidden lg:table-cell">
                Crítico
              </TableHead>
              <TableHead className="text-slate-300 font-semibold text-xs uppercase tracking-wider">
                Estado
              </TableHead>
              <TableHead className="text-slate-300 font-semibold text-xs uppercase tracking-wider hidden xl:table-cell">
                Fechas
              </TableHead>
              <TableHead className="text-right text-slate-300 font-semibold text-xs uppercase tracking-wider">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // ── Loading skeleton ──
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="border-slate-700">
                  <TableCell colSpan={7} className="py-3">
                    <div className="flex items-center gap-4">
                      <div className="h-4 w-1/3 bg-slate-700/50 rounded animate-pulse" />
                      <div className="h-4 w-20 bg-slate-700/50 rounded animate-pulse" />
                      <div className="h-4 w-24 bg-slate-700/50 rounded animate-pulse hidden md:block" />
                      <div className="h-4 w-16 bg-slate-700/50 rounded animate-pulse hidden lg:block" />
                      <div className="h-4 w-20 bg-slate-700/50 rounded animate-pulse" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : filteredAnnouncements.length === 0 ? (
              // ── Empty state ──
              <TableRow className="border-slate-700">
                <TableCell colSpan={7} className="py-16">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 rounded-full bg-slate-700/30 mb-4">
                      <Inbox className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-1">
                      {announcements.length === 0
                        ? 'No hay anuncios'
                        : 'No se encontraron resultados'}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-[280px]">
                      {announcements.length === 0
                        ? 'Crea tu primer anuncio para comenzar a administrar los avisos del sistema.'
                        : 'Intenta ajustar los filtros de búsqueda para encontrar lo que buscas.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // ── Data rows ──
              filteredAnnouncements.map((a) => (
                <TableRow
                  key={a.id}
                  className="border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                >
                  <TableCell className="text-slate-200 font-medium max-w-[200px] truncate">
                    {a.title}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${typeBadgeStyles[a.type] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}
                    >
                      {typeLabels[a.type] ?? a.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm hidden md:table-cell">
                    {targetTypeLabels[a.targetType] ?? a.targetType}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span
                      className={
                        a.isCritical
                          ? 'text-red-400 font-semibold text-sm'
                          : 'text-slate-500 text-sm'
                      }
                    >
                      {a.isCritical ? 'Sí' : 'No'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        a.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}
                    >
                      {a.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs hidden xl:table-cell whitespace-nowrap">
                    {formatDate(a.startsAt)} — {formatDate(a.expiresAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEdit(a)}
                        className="text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10"
                        aria-label="Editar anuncio"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDeleteClick(a)}
                        className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        aria-label="Eliminar anuncio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Results count */}
        {!loading && filteredAnnouncements.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-700/50">
            <p className="text-xs text-slate-500">
              Mostrando {filteredAnnouncements.length} de {announcements.length} anuncios
            </p>
          </div>
        )}
      </Card>

      {/* ── Modals ── */}
      <AnnouncementFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        editData={editingAnnouncement}
      />

      <AnnouncementDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
        announcement={selectedAnnouncement}
      />
    </div>
  );
}
