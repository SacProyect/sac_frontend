import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Taxpayer } from '@/types/taxpayer';
import { 
  Check,
  ChevronDown,
  Calculator, 
  Calendar, 
  Building2, 
  ArrowRight, 
  Info, 
  DollarSign, 
  ShoppingBag, 
  Tag, 
  History,
  CheckCircle2,
  AlertCircle,
  Search
} from 'lucide-react';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/UI/card';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/UI/dropdown-menu";
import { cn } from "@/lib/utils";
import toast from 'react-hot-toast';
import { createIVA, getTaxpayerForEvents } from '@/components/utils/api/taxpayer-functions';
import { useCachedTaxpayersForEvents, invalidateCache } from '@/hooks/useCachedData';
import { getTaxpayerIvaLastDeclared, getTaxpayerIvaReports } from '@/components/utils/api/taxpayer-functions';
import Decimal from 'decimal.js';
import type { IVAReports } from '@/types/iva-reports';

const MONTH_OPTIONS_ES = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
];

function isoDateUtcNoon(y: number, month1: number): string {
    return new Date(Date.UTC(y, month1 - 1, 1, 12, 0, 0, 0)).toISOString();
}

// Campos locales del formulario (interacción con el usuario)
export interface IvaFormFields {
    taxpayerId: string;
    iva: string;
    purchases: string;
    sells: string;
    excess: string;
    date: string;
    paid: string;
}

// Interfaz para el API (lo que espera taxpayer-functions)
export interface IvaReportFormData {
    taxpayerId: string;
    iva?: Decimal;
    purchases: Decimal;
    sells: Decimal;
    excess?: Decimal;
    date: string;
    paid: Decimal;
}

/**
 * IvaForm - Interfaz Premium para Registro de IVA
 */
function IvaForm() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const { taxpayersForEvents: firstPageTaxpayers, totalPages, loading: loadingFirstPage } = useCachedTaxpayersForEvents(50);
    
    const [selectedTaxpayer, setSelectedTaxpayer] = useState<Taxpayer | null>(null);
    const [loadingMonthInfo, setLoadingMonthInfo] = useState(false);
    const [nextMonthLabel, setNextMonthLabel] = useState("");
    const [periodYear, setPeriodYear] = useState(() => new Date().getUTCFullYear());
    const [periodMonth, setPeriodMonth] = useState(1);
    const [searchValue, setSearchValue] = useState("");
    const [searchDebounce, setSearchDebounce] = useState("");
    // Pagination states
    const [searchResults, setSearchResults] = useState<Taxpayer[] | null>(null);
    const [searchAdditionalPages, setSearchAdditionalPages] = useState<Taxpayer[]>([]);
    const [searchPage, setSearchPage] = useState(2);
    const [searchTotalPages, setSearchTotalPages] = useState(1);
    const [searchLoading, setSearchLoading] = useState(false);
    const [additionalPages, setAdditionalPages] = useState<Taxpayer[]>([]);
    const [currentPage, setCurrentPage] = useState(2);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const currentYear = new Date().getUTCFullYear();
    const listRef = useRef<HTMLDivElement>(null);
    const [dateParts, setDateParts] = useState<{ year: string; day: string; month: string }>({
        year: String(currentYear),
        day: "1",
        month: String(new Date().getUTCMonth() + 1),
    });
    const { 
        register,
        handleSubmit,
        control,
        setValue,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<IvaFormFields>({
        mode: "onChange",
        defaultValues: {
            taxpayerId: "",
            date: "",
            iva: "0",
            purchases: "0",
            sells: "0",
            paid: "0",
            excess: "0",
        },
    });

    const watchValues = watch();

    // Unified list of taxpayers
    const isSearching = searchDebounce.trim() !== '';
    
    const taxpayerArray = useMemo(() => {
        console.log('[DEBUG] IvaForm - Role:', user?.role);
        const firstPageFiltered = (firstPageTaxpayers || []).filter((t: Taxpayer) => t.process !== "FP");
        const displayedFirst = isSearching ? (searchResults ?? []) : firstPageFiltered;
        const displayedExtra = isSearching ? searchAdditionalPages : additionalPages;
        const allFetched = [...displayedFirst, ...displayedExtra];

        if (user?.role === 'ADMIN') {
            return allFetched;
        } else {
            // Fiscal role: Filter by user.id
            const filtered = allFetched.filter(t => t.user?.id === user?.id);
            return filtered;
        }
    }, [user, firstPageTaxpayers, searchResults, searchAdditionalPages, additionalPages, isSearching, searchDebounce]);

    const hasMore = useMemo(() => {
        const displayedExtra = isSearching ? searchAdditionalPages : additionalPages;
        const totalPagesDisplayed = isSearching ? searchTotalPages : totalPages;
        const loadedPagesCount = 1 + Math.floor(displayedExtra.length / 50);
        return loadedPagesCount < totalPagesDisplayed;
    }, [isSearching, searchAdditionalPages, additionalPages, searchTotalPages, totalPages]);

    /**
     * Filtrado de contribuyentes:
     * - Si hay búsqueda del backend activa, mostramos los resultados directamente SIN filtrar localmente.
     * - Solo filtramos localmente cuando NO hay búsqueda del backend (modo paginación simple).
     */
    const filteredTaxpayers = useMemo(() => {
        // Si hay búsqueda del backend activa, mostrar resultados directamente
        if (isSearching) {
            return taxpayerArray;
        }
        // Solo filtrar localmente cuando NO hay búsqueda del backend
        if (!searchValue) return taxpayerArray;
        const s = searchValue.toLowerCase();
        return taxpayerArray.filter(t =>
            t.name.toLowerCase().includes(s) ||
            t.rif.toLowerCase().includes(s)
        );
    }, [searchValue, taxpayerArray, isSearching]);

    const yearOptions = useMemo(
        () => Array.from({ length: 7 }, (_, i) => String(currentYear + 2 - i)),
        [currentYear]
    );

    const monthOptions = useMemo(
        () => [
            { value: "1", label: "Enero" },
            { value: "2", label: "Febrero" },
            { value: "3", label: "Marzo" },
            { value: "4", label: "Abril" },
            { value: "5", label: "Mayo" },
            { value: "6", label: "Junio" },
            { value: "7", label: "Julio" },
            { value: "8", label: "Agosto" },
            { value: "9", label: "Septiembre" },
            { value: "10", label: "Octubre" },
            { value: "11", label: "Noviembre" },
            { value: "12", label: "Diciembre" },
        ],
        []
    );

    const dayOptions = useMemo(() => {
        const y = Number(dateParts.year);
        const m = Number(dateParts.month);
        if (!y || !m) return [];
        const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
        return Array.from({ length: days }, (_, i) => String(i + 1));
    }, [dateParts.year, dateParts.month]);


    const loadMoreTaxpayers = useCallback(async () => {
        if (!hasMore || isLoadingMore) return;
        setIsLoadingMore(true);
        const term = searchDebounce.trim() || undefined;
        const pageToFetch = isSearching ? searchPage : currentPage;
        try {
            const response = await getTaxpayerForEvents(pageToFetch, 50, term);
            const data = (response?.data?.data ?? []) as Taxpayer[];
            const filtered = data.filter((t: Taxpayer) => t.process !== "FP");
            if (isSearching) {
                setSearchAdditionalPages(prev => [...prev, ...filtered]);
                setSearchPage(prev => prev + 1);
            } else {
                setAdditionalPages(prev => [...prev, ...filtered]);
                setCurrentPage(prev => prev + 1);
            }
        } catch (e) {
            toast.error("No se pudieron cargar más contribuyentes.");
        } finally {
            setIsLoadingMore(false);
        }
    }, [hasMore, isLoadingMore, searchDebounce, isSearching, searchPage, currentPage]);

    const handleScroll = useCallback(() => {
        const el = listRef.current;
        if (!el || !hasMore || isLoadingMore) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        const threshold = 40;
        if (scrollTop + clientHeight >= scrollHeight - threshold) {
            loadMoreTaxpayers();
        }
    }, [hasMore, isLoadingMore, loadMoreTaxpayers]);

    // Search debounce effect
    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearchDebounce(searchValue);
        }, 500);
        return () => clearTimeout(timeout);
    }, [searchValue]);

    // Fetch search results when searchDebounce changes
    useEffect(() => {
        const term = searchDebounce.trim();
        if (term === '') {
            setSearchResults(null);
            setSearchAdditionalPages([]);
            setSearchPage(2);
            setAdditionalPages([]);
            setCurrentPage(2);
            return;
        }
        let cancelled = false;
        const fetchSearchFirst = async () => {
            setSearchLoading(true);
            try {
                const response = await getTaxpayerForEvents(1, 50, term);
                if (cancelled) return;
                const data = (response?.data?.data ?? []) as Taxpayer[];
                const filtered = data.filter((t: Taxpayer) => t.process !== "FP");
                setSearchResults(filtered);
                setSearchTotalPages(response?.data?.totalPages ?? 1);
                setSearchAdditionalPages([]);
                setSearchPage(2);
            } catch (e) {
                if (!cancelled) toast.error("No se pudieron obtener los contribuyentes.");
            } finally {
                if (!cancelled) setSearchLoading(false);
            }
        };
        fetchSearchFirst();
        return () => { cancelled = true; };
    }, [searchDebounce]);

    const fiscalBalance = useMemo(() => {
        try {
            const sells = new Decimal(watchValues.sells.replace(',', '.') || 0);
            const purchases = new Decimal(watchValues.purchases.replace(',', '.') || 0);
            return sells.minus(purchases);
        } catch {
            return new Decimal(0);
        }
    }, [watchValues.sells, watchValues.purchases]);

    useEffect(() => {
        if (!user) navigate("/login");
    }, [user, navigate]);

    useEffect(() => {
        if (!selectedTaxpayer) return;
        const year = Number(dateParts.year);
        const month = Number(dateParts.month);
        const day = Number(dateParts.day);

        if (!year || !month || !day) {
            setValue("date", "");
            return;
        }

        const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
        const safeDay = Math.min(day, maxDay);
        if (safeDay !== day) {
            setDateParts(prev => ({ ...prev, day: String(safeDay) }));
            return;
        }

        const selectedDate = new Date(Date.UTC(year, month - 1, safeDay));
        setValue("date", selectedDate.toISOString());
    }, [dateParts, selectedTaxpayer, setValue]);

    useEffect(() => {
        if (!selectedTaxpayer) {
            setNextMonthLabel("");
            setValue('date', '');
            return;
        }

        const getMonthStartUTC = (date: Date) =>
            new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

        const parseReportMonth = (dateInput: string) => {
            const asDate = new Date(dateInput);
            if (!isNaN(asDate.getTime())) return getMonthStartUTC(asDate);

            const periodMatch = /^(\d{4})-(\d{2})/.exec(dateInput);
            if (!periodMatch) return null;

            const parsedYear = Number(periodMatch[1]);
            const parsedMonthIndex = Number(periodMatch[2]) - 1;
            if (Number.isNaN(parsedYear) || Number.isNaN(parsedMonthIndex)) return null;
            return new Date(Date.UTC(parsedYear, parsedMonthIndex, 1));
        };

        const calculateNextPendingPeriod = async () => {
            setLoadingMonthInfo(true);
            try {
                const lastDeclaredInfo = await getTaxpayerIvaLastDeclared(selectedTaxpayer.id);
                if (lastDeclaredInfo?.nextToDeclare) {
                    const nextPeriod = new Date(Date.UTC(
                        lastDeclaredInfo.nextToDeclare.year,
                        lastDeclaredInfo.nextToDeclare.month - 1,
                        1
                    ));

                    setNextMonthLabel(
                        lastDeclaredInfo.nextToDeclare.label ||
                        nextPeriod.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
                    );
                    setPeriodYear(nextPeriod.getUTCFullYear());
                    setPeriodMonth(nextPeriod.getUTCMonth() + 1);
                    setDateParts({
                        year: String(nextPeriod.getUTCFullYear()),
                        month: String(nextPeriod.getUTCMonth() + 1),
                        day: "1",
                    });
                    setValue('date', isoDateUtcNoon(nextPeriod.getUTCFullYear(), nextPeriod.getUTCMonth() + 1));
                    return;
                }

                const reports = await getTaxpayerIvaReports(selectedTaxpayer.id);
                const safeReports = Array.isArray(reports) && reports.length > 0
                    ? reports
                    : (selectedTaxpayer.IVAReports || []);

                const parsedPeriods = safeReports
                    .map((r) => parseReportMonth(String(r.date)))
                    .filter((d): d is Date => d !== null);

                const lastDeclaredPeriod = parsedPeriods.length > 0
                    ? new Date(Math.max(...parsedPeriods.map((d) => d.getTime())))
                    : null;

                const emissionRaw = selectedTaxpayer.emition_date ? new Date(selectedTaxpayer.emition_date) : new Date();
                const emissionDate = isNaN(emissionRaw.getTime()) ? new Date() : emissionRaw;
                const emissionPeriod = getMonthStartUTC(emissionDate);
                const currentPeriod = getMonthStartUTC(new Date());

                const nextPeriod = lastDeclaredPeriod
                    ? new Date(Date.UTC(lastDeclaredPeriod.getUTCFullYear(), lastDeclaredPeriod.getUTCMonth() + 1, 1))
                    : emissionPeriod;

                if (nextPeriod.getTime() > currentPeriod.getTime()) {
                    setNextMonthLabel("Al día");
                    setPeriodYear(currentPeriod.getUTCFullYear());
                    setPeriodMonth(currentPeriod.getUTCMonth() + 1);
                    setDateParts({
                        year: String(currentPeriod.getUTCFullYear()),
                        month: String(currentPeriod.getUTCMonth() + 1),
                        day: "1",
                    });
                    setValue('date', isoDateUtcNoon(currentPeriod.getUTCFullYear(), currentPeriod.getUTCMonth() + 1));
                    return;
                }

                setNextMonthLabel(
                    nextPeriod.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
                );
                setPeriodYear(nextPeriod.getUTCFullYear());
                setPeriodMonth(nextPeriod.getUTCMonth() + 1);
                setDateParts({
                    year: String(nextPeriod.getUTCFullYear()),
                    month: String(nextPeriod.getUTCMonth() + 1),
                    day: "1",
                });
                setValue('date', isoDateUtcNoon(nextPeriod.getUTCFullYear(), nextPeriod.getUTCMonth() + 1));
            } catch (e) {
                console.error("Error calculando próximo período IVA:", e);
                setNextMonthLabel("Sin sugerencia");
            } finally {
                setLoadingMonthInfo(false);
            }
        };

        void calculateNextPendingPeriod();
    }, [selectedTaxpayer, setValue]);

    const applyManualPeriod = useCallback(
        (y: number, m: number) => {
            const clampedY = Math.min(2100, Math.max(1990, y));
            const clampedM = Math.min(12, Math.max(1, m));
            setPeriodYear(clampedY);
            setPeriodMonth(clampedM);
            setValue('date', isoDateUtcNoon(clampedY, clampedM));
        },
        [setValue]
    );

    const onSubmit = async (data: IvaFormFields) => {
        const toastId = toast.loading("Guardando declaración fiscal...");
        try {
            const formattedData: IvaReportFormData = {
                taxpayerId: data.taxpayerId,
                date: data.date,
                iva: new Decimal(data.iva.replace(",", ".") || 0),
                purchases: new Decimal(data.purchases.replace(",", ".") || 0),
                sells: new Decimal(data.sells.replace(",", ".") || 0),
                paid: new Decimal(data.paid.replace(",", ".") || 0),
                excess: data.excess ? new Decimal(data.excess.replace(",", ".")) : undefined,
            };

            const created = await createIVA(formattedData);
            if (created) {
                invalidateCache('taxpayersForEvents');
                const mergedReport: IVAReports = {
                    id: created.id,
                    date: typeof created.date === 'string' ? created.date : new Date(created.date).toISOString(),
                    iva: created.iva != null ? Number(created.iva) : undefined,
                    purchases: Number(created.purchases),
                    sells: Number(created.sells),
                    paid: Number(created.paid),
                    excess: created.excess != null ? Number(created.excess) : undefined,
                    taxpayerId: created.taxpayerId,
                };
                toast.success("¡Declaración de IVA registrada con éxito!", { id: toastId });
                const currentTaxId = data.taxpayerId;
                reset();
                await refreshUser();
                setTimeout(() => {
                    setSelectedTaxpayer((prev) =>
                        prev && prev.id === currentTaxId
                            ? { ...prev, IVAReports: [...(prev.IVAReports || []), mergedReport] }
                            : prev
                    );
                    setValue("taxpayerId", currentTaxId);
                }, 100);
            }
        } catch (e: any) {
            toast.error(e.message || "Error al procesar la declaración", { id: toastId });
        }
    };

    if (!user) return null;

    return (
        <div className="w-full flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="w-full max-w-4xl bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-2xl overflow-hidden rounded-3xl">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                    {/* Panel Izquierdo: Formulario */}
                    <div className="lg:col-span-7 p-6 sm:p-8 space-y-8 bg-slate-900/40">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-indigo-400">
                                <Calculator className="w-5 h-5" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Registro Fiscal</span>
                            </div>
                            <CardTitle className="text-3xl font-bold text-white">Declaración de IVA</CardTitle>
                            <CardDescription className="text-slate-400">
                                Ingrese los totales correspondientes al periodo fiscal actual.
                            </CardDescription>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <input type="hidden" {...register('date', { required: true })} />
                            <div className="space-y-3">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5" /> Contribuyente
                                </Label>
                                <Controller
                                    control={control}
                                    name="taxpayerId"
                                    rules={{ required: "Seleccione un contribuyente" }}
                                    render={({ field }) => (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                  "w-full justify-between bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl h-12 px-4 transition-all duration-200",
                                                  !field.value && "text-slate-500"
                                                )}
                                              >
                                                <div className="flex items-center gap-3 truncate">
                                                  <Building2 className={cn("h-4 w-4 shrink-0 transition-colors", field.value ? "text-indigo-400" : "text-slate-500")} />
                                                  <span className="truncate">
                                                    {field.value && selectedTaxpayer
                                                      ? `${selectedTaxpayer.name}`
                                                      : "Seleccionar contribuyente..."}
                                                  </span>
                                                </div>
                                                <ChevronDown className="h-4 w-4 shrink-0 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent 
                                              className="w-[var(--radix-dropdown-menu-trigger-width)] p-0 bg-slate-900 border-slate-700 shadow-2xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                                              align="start"
                                            >
                                              {/* Buscador Premium */}
                                              <div className="p-3 border-b border-slate-800 bg-slate-950/40 sticky top-0 z-10">
                                                <div className="relative group">
                                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                                  <Input 
                                                    className="bg-slate-900 border-slate-800 text-xs text-slate-200 pl-9 h-9 w-full rounded-lg focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600" 
                                                    placeholder="Buscar por nombre o RIF..."
                                                    value={searchValue}
                                                    onChange={(e) => setSearchValue(e.target.value)}
                                                    autoFocus
                                                  />
                                                </div>
                                              </div>

                                              {/* Lista de Resultados */}
                                              <div 
                                                ref={listRef}
                                                onScroll={handleScroll}
                                                className="max-h-72 overflow-y-auto custom-scrollbar p-1"
                                              >
                                                {filteredTaxpayers.length === 0 ? (
                                                  <div className="py-10 px-4 text-center">
                                                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                                                      <Search className="h-6 w-6 text-slate-600" />
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-400">No se encontraron resultados</p>
                                                    <p className="text-[10px] text-slate-600 mt-1">Intenta con otro término de búsqueda</p>
                                                  </div>
                                                ) : (
                                                  <div className="grid grid-cols-1 gap-0.5">
                                                    {filteredTaxpayers.map((t: Taxpayer) => (
                                                      <button
                                                        key={t.id}
                                                        type="button"
                                                        onClick={() => {
                                                          setSelectedTaxpayer(t);
                                                          field.onChange(t.id);
                                                        }}
                                                        className={cn(
                                                          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all duration-200 group",
                                                          field.value === t.id 
                                                            ? "bg-indigo-600/10 text-indigo-300" 
                                                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                                                        )}
                                                      >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                          <div className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                                                            field.value === t.id ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300"
                                                          )}>
                                                            <Building2 className="h-4 w-4" />
                                                          </div>
                                                          <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-semibold truncate leading-tight">{t.name}</span>
                                                            <div className="flex items-center gap-2 text-[10px] font-mono opacity-60">
                                                              <span>{t.rif}</span>
                                                              <span className="w-1 h-1 rounded-full bg-slate-600" />
                                                              <span className="uppercase">{t.process}</span>
                                                              <span className="uppercase">{new Date(t.emition_date).toLocaleDateString('es-VE', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                            </div>
                                                          </div>
                                                        </div>
                                                        {field.value === t.id && (
                                                          <Check className="h-4 w-4 text-indigo-400 shrink-0 animate-in zoom-in duration-200" />
                                                        )}
                                                      </button>
                                                    ))}
                                                  </div>
                                                )}
                                                
                                                {isLoadingMore && (
                                                  <div className="p-4 flex items-center justify-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-rotate" />
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                      Cargando más...
                                                    </span>
                                                  </div>
                                                )}
                                              </div>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                />
                                {errors.taxpayerId && <p className="text-[10px] font-bold text-rose-500 uppercase">{errors.taxpayerId.message}</p>}
                            </div>

                            {selectedTaxpayer && (
                                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col gap-4 animate-in zoom-in-95 duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Periodo sugerido</p>
                                            <p className="text-sm font-semibold text-slate-200 capitalize">
                                                {loadingMonthInfo ? "Calculando..." : nextMonthLabel || "Sin sugerencia"}
                                            </p>
                                        </div>
                                        {!loadingMonthInfo && !!nextMonthLabel && nextMonthLabel !== "Sin sugerencia" && (
                                            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                                                Sugerido
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Periodo a Declarar</p>
                                        <p className="text-sm font-semibold text-slate-200 capitalize">
                                            {loadingMonthInfo ? "Calculando..." : nextMonthLabel || "—"}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Ajuste manual (Año / Día / Mes)
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            <select
                                                value={dateParts.year}
                                                onChange={(e) => setDateParts(prev => ({ ...prev, year: e.target.value }))}
                                                className="h-11 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-200 px-3 text-sm"
                                            >
                                                {yearOptions.map((y) => (
                                                    <option key={y} value={y} className="bg-slate-900 text-slate-200">
                                                        {y}
                                                    </option>
                                                ))}
                                            </select>
                                            <select
                                                value={dateParts.day}
                                                onChange={(e) => setDateParts(prev => ({ ...prev, day: e.target.value }))}
                                                className="h-11 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-200 px-3 text-sm"
                                            >
                                                {dayOptions.map((d) => (
                                                    <option key={d} value={d} className="bg-slate-900 text-slate-200">
                                                        {d.padStart(2, "0")}
                                                    </option>
                                                ))}
                                            </select>
                                            <select
                                                value={dateParts.month}
                                                onChange={(e) => setDateParts(prev => ({ ...prev, month: e.target.value }))}
                                                className="h-11 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-200 px-3 text-sm"
                                            >
                                                {monthOptions.map((m) => (
                                                    <option key={m.value} value={m.value} className="bg-slate-900 text-slate-200">
                                                        {m.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    {nextMonthLabel && !loadingMonthInfo && (
                                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Sugerido</Badge>
                                    )}
                                </div>
                            )}

                            {selectedTaxpayer && !loadingMonthInfo && (
                                <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ajuste manual del periodo</p>
                                    <p className="text-[11px] text-slate-500">
                                        Puede declarar cualquier mes (incluidos anteriores al sugerido). El mes se interpreta en calendario UTC, alineado con el servidor.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-slate-500">Año</Label>
                                            <Input
                                                type="number"
                                                min={1990}
                                                max={2100}
                                                className="bg-slate-950/50 border-slate-800 rounded-xl h-10 text-slate-200"
                                                value={periodYear}
                                                onChange={(e) => {
                                                    const v = parseInt(e.target.value, 10);
                                                    if (!Number.isNaN(v)) applyManualPeriod(v, periodMonth);
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-slate-500">Mes</Label>
                                            <select
                                                className="w-full h-10 rounded-xl border border-slate-800 bg-slate-950/50 px-3 text-sm text-slate-200"
                                                value={periodMonth}
                                                onChange={(e) => applyManualPeriod(periodYear, parseInt(e.target.value, 10))}
                                            >
                                                {MONTH_OPTIONS_ES.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Monto de IVA (BS)</Label>
                                    <div className="relative group">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                        <Input
                                            {...register("iva", { 
                                                required: true,
                                                onChange: (e) => {
                                                    const val = e.target.value;
                                                    if (val.length > 1 && val.startsWith("0") && val[1] !== "." && val[1] !== ",") {
                                                        setValue("iva", val.substring(1));
                                                    }
                                                }
                                            })}
                                            onFocus={(e) => e.target.select()}
                                            onBlur={(e) => { if (e.target.value.trim() === "") setValue("iva", "0"); }}
                                            className="pl-10 bg-slate-950/30 border-slate-800 focus:ring-indigo-500/50 rounded-xl h-11 text-slate-200"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Monto Pagado (BS)</Label>
                                    <div className="relative group">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                                        <Input
                                            {...register("paid", { 
                                                required: true,
                                                onChange: (e) => {
                                                    const val = e.target.value;
                                                    if (val.length > 1 && val.startsWith("0") && val[1] !== "." && val[1] !== ",") {
                                                        setValue("paid", val.substring(1));
                                                    }
                                                }
                                            })}
                                            onFocus={(e) => e.target.select()}
                                            onBlur={(e) => { if (e.target.value.trim() === "") setValue("paid", "0"); }}
                                            className="pl-10 bg-slate-950/30 border-slate-800 focus:ring-emerald-500/50 rounded-xl h-11 text-slate-200 font-mono"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Ventas Brutas (BS)</Label>
                                    <div className="relative group">
                                        <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                        <Input
                                            {...register("sells", { 
                                                required: true,
                                                onChange: (e) => {
                                                    const val = e.target.value;
                                                    if (val.length > 1 && val.startsWith("0") && val[1] !== "." && val[1] !== ",") {
                                                        setValue("sells", val.substring(1));
                                                    }
                                                }
                                            })}
                                            onFocus={(e) => e.target.select()}
                                            onBlur={(e) => { if (e.target.value.trim() === "") setValue("sells", "0"); }}
                                            className="pl-10 bg-slate-950/30 border-slate-800 focus:ring-indigo-500/50 rounded-xl h-11 text-slate-200"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Compras Brutas (BS)</Label>
                                    <div className="relative group">
                                        <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                        <Input
                                            {...register("purchases", { 
                                                required: true,
                                                onChange: (e) => {
                                                    const val = e.target.value;
                                                    if (val.length > 1 && val.startsWith("0") && val[1] !== "." && val[1] !== ",") {
                                                        setValue("purchases", val.substring(1));
                                                    }
                                                }
                                            })}
                                            onFocus={(e) => e.target.select()}
                                            onBlur={(e) => { if (e.target.value.trim() === "") setValue("purchases", "0"); }}
                                            className="pl-10 bg-slate-950/30 border-slate-800 focus:ring-indigo-500/50 rounded-xl h-11 text-slate-200"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Crédito Fiscal / Excedente (BS)</Label>
                                <div className="relative group">
                                    <History className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                    <Input
                                        {...register("excess", {
                                            onChange: (e) => {
                                                const val = e.target.value;
                                                if (val.length > 1 && val.startsWith("0") && val[1] !== "." && val[1] !== ",") {
                                                    setValue("excess", val.substring(1));
                                                }
                                            }
                                        })}
                                        onFocus={(e) => e.target.select()}
                                        onBlur={(e) => { if (e.target.value.trim() === "") setValue("excess", "0"); }}
                                        className="pl-10 bg-slate-950/30 border-slate-800 focus:ring-indigo-500/50 rounded-xl h-11 text-slate-200"
                                        placeholder="0.00 (Opcional)"
                                    />
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                disabled={isSubmitting || !selectedTaxpayer || loadingMonthInfo || !watchValues.date}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-6 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:grayscale"
                            >
                                {isSubmitting ? "Procesando..." : "Guardar Declaración"}
                            </Button>
                        </form>
                    </div>

                    <div className="lg:col-span-5 p-8 bg-slate-950/50 backdrop-blur-md border-l border-slate-800/50 flex flex-col justify-between">
                        <div className="space-y-8">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Info className="w-4 h-4" /> Resumen Fiscal
                            </h3>

                            <div className="space-y-6">
                                <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <p className="text-xs font-medium text-slate-400">Balance del Periodo</p>
                                        <Badge variant={fiscalBalance.isPositive() ? "outline" : "destructive"} className={cn("bg-opacity-10 text-[10px]", fiscalBalance.isPositive() && "text-emerald-400 border-emerald-500/20 bg-emerald-500/10")}>
                                            {fiscalBalance.isPositive() ? "Débito (+)" : "Crédito (-)"}
                                        </Badge>
                                    </div>
                                    <p className={cn(
                                        "text-3xl font-mono font-bold tracking-tighter",
                                        fiscalBalance.isPositive() ? "text-white" : "text-rose-400"
                                    )}>
                                        {new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(fiscalBalance.toNumber())}
                                    </p>
                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div className={cn("h-full transition-all duration-500", fiscalBalance.isPositive() ? "bg-emerald-500" : "bg-rose-500")} style={{ width: '65%' }} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-semibold text-slate-300">Validación Activa</p>
                                            <p className="text-[11px] text-slate-500">Periodo sugerido según último IVA cargado; puede ajustar el mes manualmente arriba.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-semibold text-slate-300">Aviso</p>
                                            <p className="text-[11px] text-slate-500">Asegúrese de cargar el comprobante bancario después.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-800/50">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                                <Building2 className="w-5 h-5 text-indigo-400 shrink-0" />
                                <div className="overflow-hidden">
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Base Imponible</p>
                                    <p className="text-xs text-slate-400 truncate">Calculada sobre registros de ventas.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default IvaForm;