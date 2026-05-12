import { useMemo, useRef } from 'react'
import { useAuth } from '../../hooks/use-auth';
import { Control, useForm, Controller, useWatch } from 'react-hook-form';
import { Form } from 'react-aria-components'
import DateInputUI from '../UI/date-input-ui';
import { createEvent, getPendingPayments, getTaxpayerForEvents } from '../utils/api/taxpayer-functions';
import { useLoaderData, useNavigate } from 'react-router-dom';
import SelectInput from '../UI/select-input';
import { useCallback, useEffect, useState } from 'react';
import { Event } from '../../types/event';
import { Taxpayer } from '../../types/taxpayer';
import { parseDate, CalendarDate } from '@internationalized/date';
import toast from 'react-hot-toast';
import { IvaReportFormData } from '../iva/iva-form';
import { IslrReportFormData } from '../ISLR/islr-form';
import TaxpayerList from '../UI/taxpayer-list';
import { useCachedTaxpayersForEvents } from '@/hooks/useCachedData';
import { AlertTriangle, DollarSign, FileText, Loader2 } from 'lucide-react';
import { parseBs, formatBs } from '../utils/number.utils';







// Componente interno para input de monto con formateo automático
interface AmountInputProps {
    control: Control<any>;
    name: string;
    label: string;
    iconColor: string;
    error?: string;
    validate?: (value: number) => true | string;
}

function AmountInput({ control, name, label, iconColor, error, validate }: AmountInputProps) {
    const [displayValue, setDisplayValue] = useState('');
    const [focused, setFocused] = useState(false);
    const watchedAmount = useWatch({ control, name });

    useEffect(() => {
        if (focused) return;
        const n = typeof watchedAmount === 'number' ? watchedAmount : Number(watchedAmount);
        if (watchedAmount === undefined || watchedAmount === null || isNaN(n) || n === 0) {
            setDisplayValue('');
            return;
        }
        setDisplayValue(formatBs(n, 2));
    }, [watchedAmount, focused]);

    return (
        <Controller
            name={name}
            control={control}
            rules={{
                required: 'Campo obligatorio',
                validate: validate,
            }}
            render={({ field: { onChange, onBlur }, fieldState: { error: fieldError } }) => {
                const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    let raw = e.target.value.replace(/[^0-9.,]/g, '');
                    const parts = raw.split(/[.,]/);
                    if (parts.length > 2) {
                        raw = parts[0] + ',' + parts.slice(1).join('');
                    }
                    setDisplayValue(raw);
                    const numeric = parseBs(raw);
                    if (!isNaN(numeric)) {
                        onChange(numeric);
                    } else if (raw === '' || raw === ',') {
                        onChange(0);
                    }
                };

                const handleBlur = () => {
                    setFocused(false);
                    onBlur();
                    const numeric = parseBs(displayValue);
                    if (!isNaN(numeric)) {
                        setDisplayValue(formatBs(numeric, 2));
                        onChange(numeric);
                    } else {
                        setDisplayValue('');
                        onChange(0);
                    }
                };

                const handleFocus = () => {
                    setFocused(true);
                };

                const finalError = error || fieldError?.message;
                const previewNum = parseBs(displayValue);

                return (
                    <div className="space-y-1.5">
                        <label htmlFor={name} className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <DollarSign className={`w-3 h-3 ${iconColor}`} />
                            {label}
                        </label>
                        <div className="relative group">
                            <input
                                id={name}
                                type="text"
                                inputMode="decimal"
                                autoComplete="off"
                                placeholder="0,00"
                                value={displayValue}
                                onChange={handleChange}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                className={`w-full h-11 px-3 bg-slate-900/50 border rounded-xl text-slate-200 text-sm placeholder:text-slate-600 outline-none transition-all focus:ring-2 tabular-nums ${
                                    finalError
                                        ? 'border-rose-500/50 focus:ring-rose-500/20 bg-rose-500/5'
                                        : 'border-slate-700 focus:border-slate-500 focus:ring-slate-500/20'
                                }`}
                            />
                        </div>
                        {!finalError && !isNaN(previewNum) && previewNum > 0 && (
                            <p className="text-[11px] text-slate-500 px-0.5">
                                {formatBs(previewNum, 2, true)} bolívares
                            </p>
                        )}
                        {finalError && (
                            <p className="text-[11px] text-rose-400 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                {finalError}
                            </p>
                        )}
                    </div>
                );
            }}
        />
    );
}

export interface EventFormData {
    id: string;
    date: CalendarDate;
    type: string;
    amount: number;
    taxpayerId: string;
    eventId?: string
    debt?: number,
    expires_at: string,
    description?: string;
}

export interface NewEvent {
    date: string;
    amount?: number;
    taxpayerId: string;
    eventId?: string;
    debt?: number;
    expires_at?: string;
    fineEventId?: string;
    description?: string;
}

export interface PendingPayments {
    id: string;
    value: string;
    name: string;
    amount: string;
    debt?: number;
    expires_at: string;
}




function EventForm({ title = 'Multa', type = "FINE", taxpayerId = "" }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [pendingPayments, setPendingPayments] = useState<PendingPayments[]>(useLoaderData() as PendingPayments[])
    const [selectedPayment, setSelectedPayment] = useState<PendingPayments | null>(null);
    const [isSubmiting, setIsSubmiting] = useState(false); // Handle submitting behavior
    const [hasFetchedPayments, setHasFetchedPayments] = useState(false);
    const [search, setSearch] = useState('');
    const [searchDebounce, setSearchDebounce] = useState('');
    const [searchResults, setSearchResults] = useState<Taxpayer[] | null>(null);
    const [searchAdditionalPages, setSearchAdditionalPages] = useState<Taxpayer[]>([]);
    const [searchPage, setSearchPage] = useState(2);
    const [searchTotalPages, setSearchTotalPages] = useState(1);
    const [searchLoading, setSearchLoading] = useState(false);
    const [additionalPages, setAdditionalPages] = useState<Taxpayer[]>([]);
    const [currentPage, setCurrentPage] = useState(2);
    const [loadingMore, setLoadingMore] = useState(false);

    const { taxpayersForEvents: firstPageTaxpayers, totalPages, loading: loadingTaxpayers } = useCachedTaxpayersForEvents(50);
    const firstPageFiltered = useMemo(
        () => (firstPageTaxpayers || []).filter((t: Taxpayer) => t.process !== "FP"),
        [firstPageTaxpayers]
    );

    const isSearching = searchDebounce.trim() !== '';
    const displayedFirst = isSearching ? (searchResults ?? []) : firstPageFiltered;
    const displayedExtra = isSearching ? searchAdditionalPages : additionalPages;
    const totalPagesDisplayed = isSearching ? searchTotalPages : totalPages;
    const taxpayerArray = useMemo(
        () => [...displayedFirst, ...displayedExtra],
        [displayedFirst, displayedExtra]
    );
    const loadedPagesCount = 1 + Math.floor(displayedExtra.length / 50);
    const hasMore = loadedPagesCount < totalPagesDisplayed;

    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearchDebounce(search);
        }, 500);
        return () => clearTimeout(timeout);
    }, [search]);

    // Sin búsqueda: se usa la primera página del cache. Con búsqueda: se pide página 1 al backend
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

    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
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
            setLoadingMore(false);
        }
    }, [hasMore, loadingMore, searchDebounce, isSearching, searchPage, currentPage]);

    if (!user) {
        navigate("/login");
        return null;
    }

    const {
        register,
        handleSubmit,
        formState: { isValid, errors },
        watch,
        control,
        trigger,
        reset } = useForm<EventFormData>({
            mode: "onChange",
            defaultValues: {
                amount: 0.00,
                date: parseDate(new Date().toISOString().split('T')[0]),  // Default CalendarDate
                description: ""
            }
        });

    const taxPayerWatcher = watch("taxpayerId")


    const getTaxpayerPendingPayments = useCallback(
        async () => {

            const taxpayerToQuery = taxpayerId || taxPayerWatcher;
            if (!taxpayerToQuery) return;

            // console.log("taxPayerWatcher: " + taxPayerWatcher)
            const auxPayments = taxpayerId == "" ? await getPendingPayments((taxPayerWatcher)) : await getPendingPayments(taxpayerId)

            const filteredPayments = auxPayments.filter((event: Event) => {
                if (type === "payment_compromise") {
                    if (!event.expires_at) return false;
                    const currentDate = new Date();

                    const expirationDate = new Date(event.expires_at);

                    return expirationDate <= currentDate;
                }
                return true;
            })


            const mappedPayments = filteredPayments.map((event: Event) => { return { id: event.id, value: event.id, name: `${event.type} ${event.date.split("T")[0]} ${event.taxpayer} monto de la multa: ${event.amount}`, debt: event.debt } })
            setPendingPayments(mappedPayments)
            setHasFetchedPayments(true);
        }, [taxPayerWatcher]
    )
    useEffect(() => {
        if (taxPayerWatcher != "" && type === "payment" || type === "warning" || type === "payment_compromise") { getTaxpayerPendingPayments() }
    }, [taxPayerWatcher])




    // Submit form function to send the data of the form
    const onSubmit = async (data: EventFormData) => {
        // console.log("DATA FROM EVENTFORM: " + JSON.stringify(data))



        // Control to avoid several submits with the same data
        if (isSubmiting) return;


        // Detect that it is submiting so change the state
        setIsSubmiting(true);

        try {

            // Convert date to ISO 8601 format (e.g., "2025-03-17T00:00:00.000Z")

            // console.log(typeof data.date);

            const parsedDate = data.date;
            const formattedDate = new Date(parsedDate.year, parsedDate.month - 1, parsedDate.day).toISOString();

            const expiresAt = new Date(parsedDate.year, parsedDate.month - 1, parsedDate.day);
            expiresAt.setDate(expiresAt.getDate() + 15);
            const formattedExpiresAt = expiresAt.toISOString();

            let newEvent: NewEvent;

            if (type == "payment") {
                newEvent = {
                    date: formattedDate,
                    amount: data.amount,
                    taxpayerId: taxpayerId != "" ? taxpayerId : data.taxpayerId,
                    eventId: data.eventId,
                    debt: data.debt,
                };
            } else if (type == "fine") {
                newEvent = {
                    date: formattedDate,
                    amount: data.amount,
                    taxpayerId: taxpayerId != "" ? taxpayerId : data.taxpayerId,
                    ...(data.description && { description: data.description }),
                };
            } else {
                // Define data for the api request
                newEvent = {
                    date: formattedDate,
                    amount: data.amount,
                    taxpayerId: taxpayerId != "" ? taxpayerId : data.taxpayerId,
                    expires_at: formattedExpiresAt,
                    fineEventId: data.eventId,
                };
            }




            if (!newEvent.amount || isNaN(Number(newEvent.amount))) {
                console.error("Error: Amount is required and must be a valid number.");
                toast.error("El monto debe ser un monto válido")
                return;
            }


            // Create the event using the api passing the type of the event and the information
            const createdEvent = await createEvent(type, newEvent);


            // If an event is created, show a succesful message
            if (createdEvent) {

                const messages: Record<string, string> = {
                    "Multa": "¡Multa creada exitosamente!",
                    "Aviso": "¡Aviso creado exitosamente!",
                    "Compromiso de pago": "¡Compromiso de pago creado exitosamente!",
                    "Pago": "¡Pago reportado exitosamente!"
                };

                toast.success(messages[title] || "¡Evento creado exitosamente!");

                reset({
                    amount: 0,
                    date: new Date().toISOString().split('T')[0],
                    taxpayerId: "",
                    eventId: "",
                    description: ""
                });

                setSelectedPayment(null);

                // Refresh pending payments after submitting a payment
                await getTaxpayerPendingPayments();
            }
        } catch (error) {
            console.error("Error creating event:", error);
            toast.error("Ha ocurrido un error, por favor, intente de nuevo.")
        } finally {
            // After the API call the submit function is ready to call again
            setIsSubmiting(false);
        }
    };


    // Watch for changes to the selected eventId
    const selectedEventId = watch("eventId");

    useEffect(() => {
        if (selectedEventId) {
            const payment = pendingPayments.find(payment => payment.id === selectedEventId);
            setSelectedPayment(payment || null);
            trigger("amount");
        }
    }, [selectedEventId, pendingPayments]);

    function toastWarning(message: string) {
        toast(message, {
            icon: '⚠️',
            style: {
                border: '1px solid #facc15',
                background: '#fef3c7',
                color: '#92400e'
            }
        });
    }

    const alreadyWarnedRef = useRef(false);

    useEffect(() => {
        // console.log("pendingPayments:", pendingPayments);

        if (type === "fine" || !hasFetchedPayments) return;

        // If there is no selected taxpayer and there are no pending payments for any taxpayer
        if (
            !taxPayerWatcher &&
            pendingPayments &&
            pendingPayments.length === 0 &&
            !alreadyWarnedRef.current
        ) {
            toastWarning("No hay pagos pendientes para los contribuyentes disponibles");
            alreadyWarnedRef.current = true; // show as shown
        }

        // If there is a taxpayer shown and doesn't have any pending payments
        if (
            taxPayerWatcher &&
            pendingPayments &&
            pendingPayments.length === 0
        ) {
            toastWarning("No hay pagos pendientes para el contribuyente seleccionado");
            alreadyWarnedRef.current = true; // Show as shown
        }
    }, [pendingPayments, taxPayerWatcher, type, hasFetchedPayments]);






    const typeConfig: Record<string, { accent: string; iconColor: string; badgeColor: string }> = {
        fine:              { accent: 'border-red-500/40',    iconColor: 'text-red-400',    badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20' },
        warning:           { accent: 'border-blue-500/40',   iconColor: 'text-blue-400',   badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
        payment:           { accent: 'border-emerald-500/40',iconColor: 'text-emerald-400',badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
        payment_compromise:{ accent: 'border-amber-500/40',  iconColor: 'text-amber-400',  badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    };
    const cfg = typeConfig[type] ?? typeConfig['fine'];

    return (
        <Form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Contribuyente */}
            {taxpayerId === "" && (
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Contribuyente
                    </label>
                    <TaxpayerList
                        name={"taxpayerId"}
                        control={control as Control<EventFormData | IvaReportFormData | IslrReportFormData>}
                        label={""}
                        taxpayers={taxpayerArray}
                        onSearchChange={setSearch}
                        searchLoading={searchLoading}
                        placeholder="Buscar contribuyente..."
                        onLoadMore={loadMore}
                        hasMore={hasMore}
                        loadingMore={loadingMore}
                    />
                </div>
            )}

            {/* Pagos pendientes */}
            {(type === "payment" || type === "payment_compromise" || type === "warning") && (
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Pagos Pendientes
                    </label>
                    <SelectInput
                        control={control}
                        name={"eventId"}
                        label={""}
                        items={pendingPayments}
                    />
                    {selectedPayment && (
                        <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                            Deuda a pagar: <span className="font-bold">{selectedPayment.debt?.toLocaleString('es-VE')} Bs.</span>
                        </p>
                    )}
                </div>
            )}

            {/* Fecha + Monto en grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fecha */}
                <div className="space-y-1.5">
                    <DateInputUI
                        name="date"
                        control={control}
                        label={type === "payment" ? "Fecha de pago" : "Fecha de emisión"}
                    />
                </div>

                {/* Monto */}
                <AmountInput
                    control={control}
                    name="amount"
                    label="Monto en Bs."
                    iconColor={cfg.iconColor}
                    error={errors.amount?.message}
                    validate={(num: number) => {
                        if (isNaN(num)) return "Debe ser un número válido";
                        if (num < 0) return "El monto no puede ser negativo";
                        if (type !== "fine" && selectedPayment && num > (selectedPayment.debt ?? Infinity)) {
                            return `No puede superar ${formatBs(selectedPayment.debt)} Bs.`;
                        }
                        return true;
                    }}
                />
            </div>

            {/* Motivo */}
            {type === "fine" && (
                <div className="space-y-1.5">
                    <label htmlFor="description" className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <FileText className={`w-3 h-3 ${cfg.iconColor}`} />
                        Motivo de la multa
                    </label>
                    <div className="relative group">
                        <textarea
                            id="description"
                            rows={3}
                            {...register("description", { required: "Debe indicar el motivo de la multa" })}
                            placeholder="Ej: Retraso en declaración de IVA del mes de marzo..."
                            className={`w-full px-3 py-2.5 bg-slate-900/50 border rounded-xl text-slate-200 text-sm placeholder:text-slate-600 outline-none transition-all focus:ring-2 resize-none ${
                                errors.description
                                    ? 'border-rose-500/50 focus:ring-rose-500/20 bg-rose-500/5'
                                    : 'border-slate-700 focus:border-slate-500 focus:ring-slate-500/20'
                            }`}
                        />
                    </div>
                    {errors.description && (
                        <p className="text-[11px] text-rose-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            {errors.description.message}
                        </p>
                    )}
                </div>
            )}

            {/* Botón enviar */}
            <div className="pt-2">
                <button
                    type="submit"
                    disabled={!isValid || isSubmiting}
                    className={`w-full h-11 flex items-center justify-center gap-2 font-semibold text-sm rounded-xl transition-all duration-200 ${
                        !isValid || isSubmiting
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-[0.98]'
                    }`}
                >
                    {isSubmiting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        `Registrar ${title}`
                    )}
                </button>
            </div>
        </Form>
    )
}

export default EventForm