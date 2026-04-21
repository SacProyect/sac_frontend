import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/UI/dialog';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Search, ChevronDown, Check, Building2, User as UserIcon, Calendar, DollarSign, FileText, Filter } from 'lucide-react';
import { createEvent, getTaxpayerForEvents } from '@/components/utils/api/taxpayer-functions';
import type { Taxpayer } from '@/types/taxpayer';
import { ModalFooter } from '@/components/UI/v2';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/use-auth';
import { cn } from "@/lib/utils";

interface AddMultaModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface MultaFormData {
  taxpayerId: string;
  date: string;
  amount: string;
  description: string;
}

export function AddMultaModalV2({ isOpen, onClose, onSuccess }: AddMultaModalV2Props) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<MultaFormData>({
    taxpayerId: '',
    date: '',
    amount: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para contribuyentes con paginación
  const [taxpayers, setTaxpayers] = useState<Taxpayer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);

  // Búsqueda de contribuyentes
  const [searchTaxpayer, setSearchTaxpayer] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Taxpayer[] | null>(null);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const [searchLoading, setSearchLoading] = useState(false);

  // Filtro por año actual
  const currentYear = new Date().getFullYear();
  const [filterByCurrentYear, setFilterByCurrentYear] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Debounce para la búsqueda
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchDebounce(searchTaxpayer);
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchTaxpayer]);

  // Cargar contribuyentes iniciales cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      const loadInitialTaxpayers = async () => {
        setLoadingInitial(true);
        try {
          const response = await getTaxpayerForEvents(1, 50);
          const data = (response?.data?.data ?? []) as Taxpayer[];
          const total = response?.data?.totalPages ?? 1;

          // Filtrar por proceso "FP" y por rol si es FISCAL
          let filtered = data.filter((t: Taxpayer) => t.process !== "FP");
          if (user?.role !== 'ADMIN') {
            filtered = filtered.filter((t: Taxpayer) => t.user?.id === user?.id);
          }

          setTaxpayers(filtered);
          setTotalPages(total);
          setCurrentPage(2);
          setSearchResults(null);
          setSearchPage(1);
        } catch (error) {
          console.error('Error cargando contribuyentes:', error);
          toast.error('Error al cargar contribuyentes');
        } finally {
          setLoadingInitial(false);
        }
      };
      loadInitialTaxpayers();
      setSearchTaxpayer('');
      setSearchDebounce('');
      setIsDropdownOpen(false);
    }
  }, [isOpen, user?.id, user?.role]);

  // Buscar en el backend cuando cambia el debounce
  useEffect(() => {
    const term = searchDebounce.trim();
    if (term === '') {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    const fetchSearch = async () => {
      setSearchLoading(true);
      setIsSearching(true);
      try {
        const response = await getTaxpayerForEvents(1, 50, term);
        if (cancelled) return;
        const data = (response?.data?.data ?? []) as Taxpayer[];
        const total = response?.data?.totalPages ?? 1;

        // Filtrar por rol si es FISCAL
        let filtered = data.filter((t: Taxpayer) => t.process !== "FP");
        if (user?.role !== 'ADMIN') {
          filtered = filtered.filter((t: Taxpayer) => t.user?.id === user?.id);
        }

        setSearchResults(filtered);
        setSearchTotalPages(total);
        setSearchPage(2);
      } catch (error) {
        if (!cancelled) {
          console.error('Error buscando contribuyentes:', error);
        }
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    };
    fetchSearch();
    return () => { cancelled = true; };
  }, [searchDebounce, user?.id, user?.role]);

  // Scroll infinito - cargar más contribuyentes
  const loadMore = useCallback(async () => {
    if (loadingMore) return;

    const isSearchMode = searchDebounce.trim().length > 0;
    const pageToFetch = isSearchMode ? searchPage : currentPage;
    const totalToCheck = isSearchMode ? searchTotalPages : totalPages;

    if (pageToFetch > totalToCheck) return;

    setLoadingMore(true);
    try {
      const response = await getTaxpayerForEvents(pageToFetch, 50, isSearchMode ? searchDebounce : undefined);
      const data = (response?.data?.data ?? []) as Taxpayer[];

      // Filtrar por rol si es FISCAL
      let filtered = data.filter((t: Taxpayer) => t.process !== "FP");
      if (user?.role !== 'ADMIN') {
        filtered = filtered.filter((t: Taxpayer) => t.user?.id === user?.id);
      }

      if (isSearchMode) {
        setSearchResults(prev => [...(prev ?? []), ...filtered]);
        setSearchPage(prev => prev + 1);
      } else {
        setTaxpayers(prev => [...prev, ...filtered]);
        setCurrentPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error cargando más contribuyentes:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, searchDebounce, currentPage, searchPage, totalPages, searchTotalPages, user?.id, user?.role]);

  // Manejar scroll para carga infinita
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || loadingMore) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const threshold = 40;

    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      loadMore();
    }
  }, [loadMore, loadingMore]);


  const selectedTaxpayer = useMemo(() => {
    const allTaxpayers = isSearching && searchResults ? searchResults : taxpayers;
    return allTaxpayers.find((t) => t.id === formData.taxpayerId);
  }, [taxpayers, searchResults, formData.taxpayerId, isSearching]);

  // Helper para extraer el año de emition_date
  const getYearFromEmitionDate = (dateStr: string): number => {
    if (!dateStr) return 0;
    // Intenta parsear la fecha (formato ISO o yyyy-mm-dd)
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.getFullYear();
    }
    // Si no es una fecha válida, intenta extraer el año del string
    const match = dateStr.match(/(\d{4})/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Lista de contribuyentes a mostrar (búsqueda o normal, con filtro de año opcional)
  const displayedTaxpayers = useMemo(() => {
    const baseList = isSearching && searchResults ? searchResults : taxpayers;

    // Aplicar filtro por año actual si está activado
    if (filterByCurrentYear) {
      return baseList.filter(t => getYearFromEmitionDate(t.emition_date) === currentYear);
    }

    return baseList;
  }, [taxpayers, searchResults, isSearching, filterByCurrentYear, currentYear]);

  // Verificar si hay más páginas para cargar
  const hasMorePages = useMemo(() => {
    if (isSearching) {
      return searchPage <= searchTotalPages;
    }
    return currentPage <= totalPages;
  }, [isSearching, searchPage, searchTotalPages, currentPage, totalPages]);


  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.taxpayerId.trim()) {
      newErrors.taxpayerId = 'Contribuyente es requerido';
    }
    if (!formData.date) {
      newErrors.date = 'Fecha de Emisión es requerida';
    }
    if (!formData.amount.trim() || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Monto válido es requerido';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Motivo es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const formattedDate = new Date(formData.date).toISOString();

      const eventData = {
        date: formattedDate,
        amount: Number(formData.amount),
        taxpayerId: formData.taxpayerId,
        description: formData.description,
      };

      const result = await createEvent('fine', eventData);

      if (result) {
        toast.success('Multa creada exitosamente');
        setFormData({
          taxpayerId: '',
          date: '',
          amount: '',
          description: '',
        });
        setSearchTaxpayer('');
        setErrors({});
        onSuccess?.();
        onClose();
      } else {
        toast.error('Error al crear la multa');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la multa';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof MultaFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const formatCurrency = (value: string) => {
    const numValue = value.replace(/[^\d.]/g, '');
    return numValue ? `BS ${parseFloat(numValue).toLocaleString('es-VE')}` : '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white transition-all duration-200 w-full max-w-[calc(100%-1rem)] sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-1 sm:space-y-1.5">
          <DialogTitle className="text-white text-lg sm:text-xl">Agregar Multa</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Selector de Contribuyente - inline expandible */}
          <div className={`rounded-xl border transition-all duration-200 ${
            errors.taxpayerId
              ? 'border-rose-500/50 bg-rose-500/5'
              : isDropdownOpen
              ? 'border-indigo-500/60 bg-slate-900/80'
              : 'border-slate-700 bg-slate-900/50'
          }`}>
            {/* Botón trigger - siempre visible */}
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left"
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                  selectedTaxpayer ? 'bg-indigo-500/15 text-indigo-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  <Building2 className="w-4 h-4" />
                </div>
                {selectedTaxpayer ? (
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate leading-tight">{selectedTaxpayer.name}</p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{selectedTaxpayer.rif}</p>
                  </div>
                ) : (
                  <span className="text-slate-500 text-sm">Seleccionar contribuyente...</span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Panel expandible inline */}
            {isDropdownOpen && (
              <div className="border-t border-slate-700/60">
                {/* Barra de búsqueda + filtro */}
                <div className="px-3 py-2 space-y-2 bg-slate-950/40">
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5">
                    <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <input
                      type="text"
                      className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-slate-600"
                      placeholder="Buscar por nombre o RIF..."
                      value={searchTaxpayer}
                      onChange={(e) => setSearchTaxpayer(e.target.value)}
                      autoFocus
                    />
                    {searchTaxpayer && (
                      <button type="button" onClick={() => setSearchTaxpayer('')} className="text-slate-500 hover:text-slate-300 shrink-0">
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setFilterByCurrentYear(!filterByCurrentYear)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        filterByCurrentYear
                          ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <Filter className="w-3 h-3" />
                      Año {currentYear}
                    </button>
                    <span className="text-[10px] text-slate-600">
                      {displayedTaxpayers.length} resultado{displayedTaxpayers.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Lista */}
                <div
                  ref={listRef}
                  onScroll={handleScroll}
                  className="overflow-y-auto max-h-[200px] px-1.5 py-1.5 space-y-0.5"
                >
                  {(loadingInitial || searchLoading) ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-slate-500">
                      <span className="w-4 h-4 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></span>
                      <span className="text-xs">{loadingInitial ? 'Cargando...' : 'Buscando...'}</span>
                    </div>
                  ) : displayedTaxpayers.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      {isSearching ? 'Sin resultados para tu búsqueda' : 'No hay contribuyentes disponibles'}
                    </div>
                  ) : (
                    <>
                      {displayedTaxpayers.map((taxpayer) => {
                        const isCurrentYear = getYearFromEmitionDate(taxpayer.emition_date) === currentYear;
                        const isSelected = formData.taxpayerId === taxpayer.id;
                        return (
                          <div
                            key={taxpayer.id}
                            onClick={() => {
                              handleChange('taxpayerId', taxpayer.id);
                              setIsDropdownOpen(false);
                              setSearchTaxpayer('');
                              setFilterByCurrentYear(false);
                            }}
                            className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-300 hover:bg-slate-800/80'
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="text-xs font-semibold truncate">{taxpayer.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-[10px] text-slate-500 font-mono">{taxpayer.rif}</span>
                                <span className={`text-[10px] px-1.5 py-px rounded-full font-medium ${
                                  isCurrentYear ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700/80 text-slate-400'
                                }`}>
                                  {taxpayer.emition_date
                                    ? new Date(taxpayer.emition_date).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : 'Sin fecha'}
                                </span>
                              </div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                          </div>
                        );
                      })}
                      {loadingMore && (
                        <div className="flex justify-center py-2">
                          <span className="w-4 h-4 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          {errors.taxpayerId && (
            <p className="text-red-400 text-xs mt-1">{errors.taxpayerId}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="date" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                Fecha de Emisión
              </Label>
              <div className="relative group">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className={cn(
                    "pl-10 bg-slate-950/30 border-slate-700 focus:ring-indigo-500/30 rounded-lg sm:rounded-xl h-11 sm:h-12 text-slate-200 transition-all text-sm",
                    errors.date && "border-rose-500/50 bg-rose-500/5 text-rose-200"
                  )}
                />
              </div>
              {errors.date && <p className="text-[10px] font-bold text-rose-500 uppercase px-1">{errors.date}</p>}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="amount" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                Monto en BS
              </Label>
              <div className="relative group">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                <Input
                  id="amount"
                  type="text"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^\d.]/g, '');
                    handleChange('amount', val);
                  }}
                  className={cn(
                    "pl-10 bg-slate-950/30 border-slate-700 focus:ring-indigo-500/30 rounded-lg sm:rounded-xl h-11 sm:h-12 text-slate-200 transition-all text-sm",
                    errors.amount && "border-rose-500/50 bg-rose-500/5 text-rose-200"
                  )}
                />
              </div>
              {errors.amount && <p className="text-[10px] font-bold text-rose-500 uppercase px-1">{errors.amount}</p>}
              {!errors.amount && formData.amount && (
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider px-1">
                  Vista previa: {formatCurrency(formData.amount)}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="description" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Motivo / Descripción
            </Label>
            <div className="relative group">
              <FileText className="absolute left-3 top-3 sm:top-4 w-4 h-4 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
              <textarea
                id="description"
                placeholder="Ej: Retraso en declaración IVA..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className={cn(
                  "w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-950/30 border border-slate-700 focus:ring-1 focus:ring-indigo-500/30 rounded-lg sm:rounded-xl min-h-[80px] sm:min-h-[100px] text-slate-200 transition-all placeholder:text-slate-600 outline-none text-sm",
                  errors.description && "border-rose-500/50 bg-rose-500/5 text-rose-200"
                )}
              />
            </div>
            {errors.description && (
              <p className="text-[10px] font-bold text-rose-500 uppercase px-1">{errors.description}</p>
            )}
          </div>
        </form>

        <DialogFooter>
          <ModalFooter
            onCancel={onClose}
            onConfirm={handleSubmit}
            confirmLabel="Guardar"
            isLoading={isSubmitting}
            confirmVariant="destructive"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
