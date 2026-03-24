import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Taxpayer } from '@/types/taxpayer';
import { 
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
  DropdownMenu as Popover,
  DropdownMenuContent as PopoverContent,
  DropdownMenuTrigger as PopoverTrigger,
} from "@/components/UI/dropdown-menu";
import { cn } from "@/lib/utils";
import toast from 'react-hot-toast';
import { createIVA, getTaxpayerForEvents } from '@/components/utils/api/taxpayer-functions';
import { useCachedTaxpayersForEvents } from '@/hooks/useCachedData';
import Decimal from 'decimal.js';
import type { IvaReportFormData } from '@/types/taxpayer-api-forms';

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
export type { IvaReportFormData };

/**
 * IvaForm - Interfaz Premium para Registro de IVA
 */
function IvaForm() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const { taxpayersForEvents: firstPageTaxpayers, totalPages, loading: loadingFirstPage } = useCachedTaxpayersForEvents(50);
    
    const [selectedTaxpayer, setSelectedTaxpayer] = useState<Taxpayer | null>(null);
    const [loadingMonthInfo, setLoadingMonthInfo] = useState(false);
    const [decemberReached, setDecemberReached] = useState(false);
    const [nextMonthLabel, setNextMonthLabel] = useState("");
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

    const listRef = useRef<HTMLDivElement>(null);

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
    const firstPageFiltered = useMemo(
        () => (firstPageTaxpayers || []).filter((t: Taxpayer) => t.process !== "FP"),
        [firstPageTaxpayers]
    );

    const displayedFirst = isSearching ? (searchResults ?? []) : firstPageFiltered;
    const displayedExtra = isSearching ? searchAdditionalPages : additionalPages;
    const totalPagesDisplayed = isSearching ? searchTotalPages : totalPages;

    const taxpayerArray = useMemo(
        () => [...displayedFirst, ...displayedExtra],
        [displayedFirst, displayedExtra]
    );

    const hasMore = useMemo(() => {
        const loadedPagesCount = 1 + Math.floor(displayedExtra.length / 50);
        return loadedPagesCount < totalPagesDisplayed;
    }, [displayedExtra.length, totalPagesDisplayed]);

    const filteredTaxpayers = useMemo(() => {
        if (!searchValue) return taxpayerArray;
        const s = searchValue.toLowerCase();
        return taxpayerArray.filter(t => 
            t.name.toLowerCase().includes(s) || 
            t.rif.toLowerCase().includes(s)
        );
    }, [searchValue, taxpayerArray]);

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
        if (!selectedTaxpayer) {
            setDecemberReached(false);
            setNextMonthLabel("");
            setValue('date', '');
            return;
        }

        setLoadingMonthInfo(true);
        const sorted = [...(selectedTaxpayer.IVAReports || [])]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Manejar emition_date inválido o faltante
        const rawEmitionDate = selectedTaxpayer.emition_date ? new Date(selectedTaxpayer.emition_date) : new Date();
        const emitionDate = isNaN(rawEmitionDate.getTime()) ? new Date() : rawEmitionDate;
        
        let year = emitionDate.getUTCFullYear();
        let month = 1;

        if (sorted.length > 0) {
            const lastReportDate = sorted[0].date;
            if (lastReportDate && lastReportDate.includes('-')) {
                const [lastYearStr, lastMonthStr] = lastReportDate.split('-');
                year = parseInt(lastYearStr, 10);
                month = parseInt(lastMonthStr, 10) + 1;
                
                if (month > 12) {
                    setDecemberReached(true);
                    setNextMonthLabel("Año completo");
                    setValue('date', '');
                    setLoadingMonthInfo(false);
                    return;
                }
            }
        }

        setDecemberReached(false);
        const nextDate = new Date(Date.UTC(year, month - 1, 1));
        
        // Verificación final de seguridad antes de toISOString()
        if (!isNaN(nextDate.getTime())) {
            setNextMonthLabel(nextDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' }));
            setValue('date', nextDate.toISOString());
        } else {
            console.warn("No se pudo calcular la fecha siguiente para el contribuyente:", selectedTaxpayer.name);
            setNextMonthLabel("Error en fecha");
            setValue('date', '');
        }
        setLoadingMonthInfo(false);
    }, [selectedTaxpayer, setValue]);

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

            const success = await createIVA(formattedData);
            if (success) {
                toast.success("¡Declaración de IVA registrada con éxito!", { id: toastId });
                const currentTaxId = data.taxpayerId;
                const currentTax = selectedTaxpayer;
                reset();
                await refreshUser();
                setTimeout(() => {
                    setSelectedTaxpayer(currentTax);
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
                            <div className="space-y-3">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5" /> Contribuyente
                                </Label>
                                <Controller
                                    control={control}
                                    name="taxpayerId"
                                    rules={{ required: "Seleccione un contribuyente" }}
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-between bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl h-11",
                                                        !field.value && "text-slate-500"
                                                    )}
                                                >
                                                    {field.value && selectedTaxpayer
                                                        ? `${selectedTaxpayer.name} | ${selectedTaxpayer.rif}`
                                                        : "Seleccionar contribuyente..."}
                                                    <ArrowRight className="ml-2 h-4 w-4 shrink-0 opacity-50 rotate-90" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80 p-0 bg-slate-900 border-slate-800 shadow-2xl overflow-hidden rounded-xl">
                                                <div className="p-2 border-b border-slate-800 bg-slate-950/50 flex items-center gap-2">
                                                    <Search className="w-4 h-4 text-slate-500" />
                                                    <input 
                                                        className="bg-transparent border-none text-xs text-slate-200 focus:ring-0 w-full placeholder:text-slate-600" 
                                                        placeholder="Filtrar..."
                                                        value={searchValue}
                                                        onChange={(e) => setSearchValue(e.target.value)}
                                                    />
                                                </div>
                                                <div 
                                                    ref={listRef}
                                                    onScroll={handleScroll}
                                                    className="max-h-60 overflow-y-auto custom-scrollbar"
                                                >
                                                    {filteredTaxpayers.length === 0 ? (
                                                        <div className="p-4 text-xs text-slate-500 text-center">No hay resultados</div>
                                                    ) : (
                                                        filteredTaxpayers.map((t: Taxpayer) => (
                                                            <div
                                                                key={t.id}
                                                                onClick={() => {
                                                                    setSelectedTaxpayer(t);
                                                                    field.onChange(t.id);
                                                                }}
                                                                className="px-4 py-3 text-xs text-slate-300 hover:bg-indigo-600 hover:text-white cursor-pointer border-b border-slate-800/50 last:border-0"
                                                            >
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="font-semibold">{t.name}</span>
                                                                    <span className="text-[10px] opacity-70 uppercase">{t.rif} — {t.process}</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                    {isLoadingMore && (
                                                        <div className="p-3 text-[10px] text-center text-slate-500 uppercase tracking-widest animate-pulse">
                                                            Cargando más...
                                                        </div>
                                                    )}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                                {errors.taxpayerId && <p className="text-[10px] font-bold text-rose-500 uppercase">{errors.taxpayerId.message}</p>}
                            </div>

                            {selectedTaxpayer && (
                                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center gap-4 animate-in zoom-in-95 duration-300">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Periodo a Declarar</p>
                                        <p className="text-sm font-semibold text-slate-200 capitalize">
                                            {loadingMonthInfo ? "Calculando..." : decemberReached ? "Declaraciones Completas" : nextMonthLabel}
                                        </p>
                                    </div>
                                    {!decemberReached && <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Sugerido</Badge>}
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
                                disabled={isSubmitting || decemberReached || !selectedTaxpayer || loadingMonthInfo}
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
                                            <p className="text-[11px] text-slate-500">Mapeo de meses consecutivo habilitado.</p>
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