import { useMemo, useRef } from 'react'
import { useAuth } from '../../hooks/use-auth';
import { Control, useForm } from 'react-hook-form';
import TextInput from '../UI/text-input';
import FormContainer from '../UI/form-container';
import { Form, Label, Button } from 'react-aria-components'
import DateInputUI from '../UI/date-input-ui';
import TaxpayerCombobox from '../UI/taxpayer-combobox';
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






    return (
        <FormContainer>
            <h2 className="w-full text-2xl font-bold text-center text-black mb-11">Agregar {title}</h2>
            <Form onSubmit={handleSubmit(onSubmit)} className='space-y-2'>

                {/* Select the taxpayer by it's ID */}
                {
                    taxpayerId == "" &&
                    <TaxpayerList
                        name={"taxpayerId"}
                        control={control as Control<EventFormData | IvaReportFormData | IslrReportFormData>}
                        label={"Contribuyente"}
                        taxpayers={taxpayerArray}
                        onSearchChange={setSearch}
                        searchLoading={searchLoading}
                        placeholder="Buscar contribuyente..."
                        onLoadMore={loadMore}
                        hasMore={hasMore}
                        loadingMore={loadingMore}
                    />
                }

                {/* If the type is payment, show the pending payments */}
                {
                    (type === "payment" || type === "payment_compromise" || type === "warning") &&
                    <>
                        <SelectInput
                            control={control}
                            name={"eventId"}
                            label={"Pagos Pendientes"}
                            items={pendingPayments}
                        />
                    </>
                }

                {/* Select Date */}
                <DateInputUI
                    name="date"
                    control={control}
                    label={type === "payment" ? "Fecha de pago" : "Fecha de emisión"}
                />

                {/* Description */}
                {type === "fine" && (
                    <div className="w-full">
                        <label htmlFor="description" className="block mb-1 text-sm font-medium text-gray-700">
                            Motivo de la multa
                        </label>
                        <input
                            id="description"
                            type="text"
                            {...register("description", { required: "Debe introducir un motivo para la multa" })}
                            className="w-full h-12 px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-200 focus:border-blue-400"
                            placeholder="Ingrese una descripción"
                        />
                    </div>
                )}
                {errors.description && (
                    <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
                )}


                {/* Amount input */}
                <>
                    <Label className="text-black">Monto en BS:</Label>

                    <input
                        type="text"
                        inputMode="decimal"
                        placeholder="3500..."
                        {...register("amount", {
                            required: "Campo Obligatorio",
                            validate: (num: number) => {
                                if (isNaN(num)) return "Debe ser un número válido";
                                if (num < 0) return "El monto no puede ser negativo";
                                if (type !== "fine" && selectedPayment && num > (selectedPayment.debt ?? Infinity)) {
                                    return `El monto no puede ser mayor a ${selectedPayment.debt}`;
                                }
                                return true;
                            },
                            setValueAs: (value: string | number) => {
                                const normalized = String(value).replace(/,/g, ".");
                                return parseFloat(normalized);
                            },
                        })}
                        className="w-full h-12 px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-200 focus:border-blue-400"
                    />
                </>

                {errors.amount && (
                    <p className='text-sm text-red-500'> {errors.amount.message}</p>
                )}


                {/* Show acumulated debt */}
                {
                    (type == "payment" || type == "payment_compromise" || type == "warning") &&
                    <>
                        {selectedPayment && (
                            <p>Deuda a pagar: {selectedPayment.debt?.toString()} </p>
                        )}
                    </>
                }


                {/* Submit Button */}
                <div className='pt-4'>
                    <Button
                        type='submit'
                        isDisabled={!isValid}
                        className={
                            `w-full 
                                p-2 
                                bg-[#007bff] 
                                hover:bg-[#0056b3] 
                                text-white font-bold 
                                rounded-lg 
                                cursor-pointer 
                                disabled:bg-gray-400`
                        }
                    >
                        Enviar
                    </Button>
                </div>
            </Form>
        </FormContainer>
    )
}

export default EventForm