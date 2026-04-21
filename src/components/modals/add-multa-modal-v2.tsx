import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/UI/dialog';
import {
  Search,
  ChevronDown,
  Check,
  Building2,
  Calendar,
  AlertTriangle,
  FileText,
  Filter,
  X,
  Loader2,
} from 'lucide-react';
import { createEvent, getTaxpayerForEvents } from '@/components/utils/api/taxpayer-functions';
import type { Taxpayer } from '@/types/taxpayer';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { formatBs, parseBs } from '@/components/utils/number.utils';

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
  // Valor visual del monto (con formato es-VE)
  const [amountDisplay, setAmountDisplay] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Contribuyentes con paginación
  const [taxpayers, setTaxpayers] = useState<Taxpayer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);

  // Búsqueda
  const [searchTaxpayer, setSearchTaxpayer] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Taxpayer[] | null>(null);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const [searchLoading, setSearchLoading] = useState(false);

  // Filtro año actual
  const currentYear = new Date().getFullYear();
  const [filterByCurrentYear, setFilterByCurrentYear] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce búsqueda
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(searchTaxpayer), 500);
    return () => clearTimeout(t);
  }, [searchTaxpayer]);

  // Enfocar el input al abrir el dropdown
  useEffect(() => {
    if (isDropdownOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isDropdownOpen]);

  // Carga inicial
  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setLoadingInitial(true);
      try {
        const res = await getTaxpayerForEvents(1, 50);
        const data = (res?.data?.data ?? []) as Taxpayer[];
        const total = res?.data?.totalPages ?? 1;
        let filtered = data.filter((t) => t.process !== 'FP');
        if (user?.role !== 'ADMIN') {
          filtered = filtered.filter((t) => t.user?.id === user?.id);
        }
        setTaxpayers(filtered);
        setTotalPages(total);
        setCurrentPage(2);
        setSearchResults(null);
        setSearchPage(1);
      } catch {
        toast.error('Error al cargar contribuyentes');
      } finally {
        setLoadingInitial(false);
      }
    };
    load();
    setFormData({ taxpayerId: '', date: '', amount: '', description: '' });
    setAmountDisplay('');
    setSearchTaxpayer('');
    setSearchDebounce('');
    setIsDropdownOpen(false);
    setErrors({});
  }, [isOpen, user?.id, user?.role]);

  // Búsqueda backend
  useEffect(() => {
    const term = searchDebounce.trim();
    if (!term) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }
    let cancelled = false;
    const fetch = async () => {
      setSearchLoading(true);
      setIsSearching(true);
      try {
        const res = await getTaxpayerForEvents(1, 50, term);
        if (cancelled) return;
        const data = (res?.data?.data ?? []) as Taxpayer[];
        let filtered = data.filter((t) => t.process !== 'FP');
        if (user?.role !== 'ADMIN') {
          filtered = filtered.filter((t) => t.user?.id === user?.id);
        }
        setSearchResults(filtered);
        setSearchTotalPages(res?.data?.totalPages ?? 1);
        setSearchPage(2);
      } catch {
        /* silencioso */
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [searchDebounce, user?.id, user?.role]);

  // Scroll infinito
  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    const inSearch = searchDebounce.trim().length > 0;
    const page = inSearch ? searchPage : currentPage;
    const total = inSearch ? searchTotalPages : totalPages;
    if (page > total) return;
    setLoadingMore(true);
    try {
      const res = await getTaxpayerForEvents(page, 50, inSearch ? searchDebounce : undefined);
      const data = (res?.data?.data ?? []) as Taxpayer[];
      let filtered = data.filter((t) => t.process !== 'FP');
      if (user?.role !== 'ADMIN') {
        filtered = filtered.filter((t) => t.user?.id === user?.id);
      }
      if (inSearch) {
        setSearchResults((prev) => [...(prev ?? []), ...filtered]);
        setSearchPage((p) => p + 1);
      } else {
        setTaxpayers((prev) => [...prev, ...filtered]);
        setCurrentPage((p) => p + 1);
      }
    } catch { /* silencioso */ }
    finally { setLoadingMore(false); }
  }, [loadingMore, searchDebounce, currentPage, searchPage, totalPages, searchTotalPages, user?.id, user?.role]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || loadingMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) loadMore();
  }, [loadMore, loadingMore]);

  const selectedTaxpayer = useMemo(() => {
    const list = isSearching && searchResults ? searchResults : taxpayers;
    return list.find((t) => t.id === formData.taxpayerId);
  }, [taxpayers, searchResults, formData.taxpayerId, isSearching]);

  const getYear = (dateStr: string) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.getFullYear();
    const m = dateStr.match(/(\d{4})/);
    return m ? parseInt(m[1]) : 0;
  };

  const displayedTaxpayers = useMemo(() => {
    const base = isSearching && searchResults ? searchResults : taxpayers;
    return filterByCurrentYear ? base.filter((t) => getYear(t.emition_date) === currentYear) : base;
  }, [taxpayers, searchResults, isSearching, filterByCurrentYear, currentYear]);

  // ── Monto: formateo ───────────────────────────────────────────────────────
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9.,]/g, '');
    // Evitar múltiples separadores decimales
    const parts = raw.split(/[.,]/);
    if (parts.length > 2) raw = parts[0] + ',' + parts.slice(1).join('');
    setAmountDisplay(raw);
    const num = parseBs(raw);
    setFormData((prev) => ({ ...prev, amount: isNaN(num) ? '' : String(num) }));
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
  };

  const handleAmountBlur = () => {
    const num = parseBs(amountDisplay);
    if (!isNaN(num) && num > 0) {
      setAmountDisplay(formatBs(num, 2));
      setFormData((prev) => ({ ...prev, amount: String(num) }));
    }
  };

  // ── Formulario ─────────────────────────────────────────────────────────────
  const handleChange = (field: keyof MultaFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!formData.taxpayerId) e.taxpayerId = 'Selecciona un contribuyente';
    if (!formData.date) e.date = 'La fecha es requerida';
    if (!formData.amount || Number(formData.amount) <= 0) e.amount = 'Ingresa un monto válido';
    if (!formData.description.trim()) e.description = 'El motivo es requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const result = await createEvent('fine', {
        date: new Date(formData.date).toISOString(),
        amount: Number(formData.amount),
        taxpayerId: formData.taxpayerId,
        description: formData.description,
      });
      if (result) {
        toast.success('Multa creada exitosamente');
        onSuccess?.();
        onClose();
      } else {
        toast.error('Error al crear la multa');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al crear la multa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700/80 text-white w-full max-w-[calc(100%-1rem)] sm:max-w-md p-0 overflow-hidden gap-0">

        {/* ── Tira de color + cabecera ─────────────────────────────────── */}
        <div className="h-0.5 bg-gradient-to-r from-rose-500 via-rose-400/60 to-transparent" />

        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <DialogHeader className="flex-1 space-y-0 p-0">
            <DialogTitle className="text-base font-bold text-white leading-tight">
              Agregar Multa
            </DialogTitle>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Completa los campos para registrar la sanción
            </p>
          </DialogHeader>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider shrink-0">
            Multa
          </span>
        </div>

        {/* ── Cuerpo scrollable ────────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto custom-scrollbar max-h-[calc(90vh-140px)]"
        >
          <div className="px-5 py-5 space-y-5">

            {/* Selector de contribuyente */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Building2 className="w-3 h-3 text-rose-400" />
                Contribuyente
              </label>

              <div className={cn(
                'rounded-xl border transition-all duration-200',
                errors.taxpayerId
                  ? 'border-rose-500/50 bg-rose-500/5'
                  : isDropdownOpen
                  ? 'border-indigo-500/50 bg-slate-800/80'
                  : 'border-slate-700/80 bg-slate-800/50 hover:border-slate-600'
              )}>
                {/* Trigger */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className={cn(
                      'p-1.5 rounded-lg shrink-0 transition-colors',
                      selectedTaxpayer ? 'bg-indigo-500/15 text-indigo-400' : 'bg-slate-700/60 text-slate-500'
                    )}>
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    {selectedTaxpayer ? (
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate leading-tight">
                          {selectedTaxpayer.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {selectedTaxpayer.rif}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-sm">Seleccionar contribuyente...</span>
                    )}
                  </div>
                  <ChevronDown className={cn(
                    'w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200',
                    isDropdownOpen && 'rotate-180'
                  )} />
                </button>

                {/* Panel expandible */}
                {isDropdownOpen && (
                  <div className="border-t border-slate-700/60">
                    {/* Barra de búsqueda */}
                    <div className="px-3 pt-2.5 pb-2 space-y-2 bg-slate-950/30">
                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5">
                        <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-slate-600"
                          placeholder="Buscar por nombre o RIF..."
                          value={searchTaxpayer}
                          onChange={(e) => setSearchTaxpayer(e.target.value)}
                        />
                        {searchTaxpayer && (
                          <button
                            type="button"
                            onClick={() => setSearchTaxpayer('')}
                            className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Filtro + contador */}
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setFilterByCurrentYear(!filterByCurrentYear)}
                          className={cn(
                            'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all',
                            filterByCurrentYear
                              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                          )}
                        >
                          <Filter className="w-3 h-3" />
                          Año {currentYear}
                        </button>
                        <span className="text-[10px] text-slate-600">
                          {displayedTaxpayers.length} resultado{displayedTaxpayers.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Lista con scrollbar del sistema */}
                    <div
                      ref={listRef}
                      onScroll={handleScroll}
                      className="overflow-y-auto custom-scrollbar max-h-[200px] px-2 py-1.5 space-y-px"
                    >
                      {(loadingInitial || searchLoading) ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-slate-500">
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                          <span className="text-xs">
                            {loadingInitial ? 'Cargando contribuyentes...' : 'Buscando...'}
                          </span>
                        </div>
                      ) : displayedTaxpayers.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-500">
                          {isSearching
                            ? 'Sin resultados para tu búsqueda'
                            : 'No hay contribuyentes disponibles'}
                        </div>
                      ) : (
                        <>
                          {displayedTaxpayers.map((taxpayer) => {
                            const isCurrentYearTaxpayer = getYear(taxpayer.emition_date) === currentYear;
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
                                className={cn(
                                  'flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors',
                                  isSelected
                                    ? 'bg-indigo-500/15 text-indigo-300'
                                    : 'text-slate-300 hover:bg-slate-800'
                                )}
                              >
                                <div className="flex-1 min-w-0 pr-2">
                                  <p className="text-xs font-semibold truncate">{taxpayer.name}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      {taxpayer.rif}
                                    </span>
                                    <span className={cn(
                                      'text-[10px] px-1.5 py-px rounded-full font-medium',
                                      isCurrentYearTaxpayer
                                        ? 'bg-emerald-500/15 text-emerald-400'
                                        : 'bg-slate-700/60 text-slate-400'
                                    )}>
                                      {taxpayer.emition_date
                                        ? new Date(taxpayer.emition_date).toLocaleDateString('es-VE', {
                                            day: 'numeric', month: 'short', year: 'numeric',
                                          })
                                        : 'Sin fecha'}
                                    </span>
                                  </div>
                                </div>
                                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                              </div>
                            );
                          })}
                          {loadingMore && (
                            <div className="flex justify-center py-3">
                              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {errors.taxpayerId && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1 px-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {errors.taxpayerId}
                </p>
              )}
            </div>

            {/* Fecha + Monto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Fecha */}
              <div className="space-y-1.5">
                <label htmlFor="date" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-rose-400" />
                  Fecha de emisión
                </label>
                <div className="relative group">
                  <input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    className={cn(
                      'w-full h-11 px-3 bg-slate-800/50 border rounded-xl text-slate-200 text-sm outline-none transition-all focus:ring-2',
                      '[color-scheme:dark]',
                      errors.date
                        ? 'border-rose-500/50 focus:ring-rose-500/20 bg-rose-500/5'
                        : 'border-slate-700 hover:border-slate-600 focus:border-slate-500 focus:ring-slate-500/20'
                    )}
                  />
                </div>
                {errors.date && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    {errors.date}
                  </p>
                )}
              </div>

              {/* Monto */}
              <div className="space-y-1.5">
                <label htmlFor="amount" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className={cn('text-[10px] font-black', errors.amount ? 'text-rose-400' : 'text-rose-400')}>
                    Bs.
                  </span>
                  Monto
                </label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold pointer-events-none select-none group-focus-within:text-slate-300 transition-colors">
                    Bs.
                  </span>
                  <input
                    id="amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={amountDisplay}
                    onChange={handleAmountChange}
                    onBlur={handleAmountBlur}
                    className={cn(
                      'w-full h-11 pl-9 pr-3 bg-slate-800/50 border rounded-xl text-slate-200 text-sm placeholder:text-slate-600 outline-none transition-all focus:ring-2',
                      errors.amount
                        ? 'border-rose-500/50 focus:ring-rose-500/20 bg-rose-500/5'
                        : 'border-slate-700 hover:border-slate-600 focus:border-slate-500 focus:ring-slate-500/20'
                    )}
                  />
                </div>
                {errors.amount ? (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    {errors.amount}
                  </p>
                ) : amountDisplay && !isNaN(parseBs(amountDisplay)) ? (
                  <p className="text-[10px] text-slate-500 px-1">
                    {formatBs(parseBs(amountDisplay), 2, true)} bolívares
                  </p>
                ) : null}
              </div>
            </div>

            {/* Motivo */}
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-rose-400" />
                Motivo / Descripción
              </label>
              <div className="relative group">
                <textarea
                  id="description"
                  rows={3}
                  placeholder="Ej: Retraso en declaración de IVA del mes de marzo..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2.5 bg-slate-800/50 border rounded-xl text-slate-200 text-sm placeholder:text-slate-600 outline-none transition-all focus:ring-2 resize-none custom-scrollbar',
                    errors.description
                      ? 'border-rose-500/50 focus:ring-rose-500/20 bg-rose-500/5'
                      : 'border-slate-700 hover:border-slate-600 focus:border-slate-500 focus:ring-slate-500/20'
                  )}
                />
              </div>
              {errors.description && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {errors.description}
                </p>
              )}
            </div>

          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-800 bg-slate-900/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-10 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-semibold transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-600/40 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Registrar Multa
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
