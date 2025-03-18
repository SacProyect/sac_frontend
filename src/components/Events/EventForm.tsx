<<<<<<< HEAD
import { useRef } from 'react'
import { useAuth } from '../../hooks/useAuth';
import { Control, useForm } from 'react-hook-form';
=======
import React from 'react'
import { useAuth } from '../../hooks/useAuth';
import { useForm } from 'react-hook-form';
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
import TextInput from '../UI/TextInput';
import FormContainer from '../UI/FormContainer';
import { Form, Label, Button } from 'react-aria-components'
import DateInputUI from '../UI/DateInputUI';
import TaxpayerCombobox from '../UI/TaxpayerCombobox';
<<<<<<< HEAD
import { createEvent, getPendingPayments, getTaxpayerForEvents } from '../utils/api/taxpayerFunctions';
import { useLoaderData, useNavigate } from 'react-router-dom';
import SelectInput from '../UI/SelectInput';
import { useCallback, useEffect, useState } from 'react';
import { Event } from '../../types/event';
import { Taxpayer } from '../../types/taxpayer';
import { parseDate, CalendarDate } from '@internationalized/date';
import toast from 'react-hot-toast';
import { IvaReportFormData } from '../iva/IvaForm';
import { IslrReportFormData } from '../ISLR/IslrForm';
import TaxpayerList from '../UI/TaxpayerList';
=======
import { createEvent, getPendingPayments } from '../utils/api/taxpayerFunctions';
import { useLoaderData, useNavigate } from 'react-router-dom';
import SelectInput, { Item } from '../UI/SelectInput';
import { useCallback, useEffect, useState } from 'react';
import Alert from '../UI/Alert';
import { Event } from '../../types/event';
import { Taxpayer } from '../../types/taxpayer';
import { parseDate, parseDateTime, CalendarDate, parseZonedDateTime } from '@internationalized/date';
import toast from 'react-hot-toast';
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)







export interface EventFormData {
    id: string;
<<<<<<< HEAD
    date: CalendarDate;
=======
    date: string;
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
    type: string;
    amount: number;
    taxpayerId: string;
    eventId?: string
    debt?: number,
<<<<<<< HEAD
    expires_at: string,
    description?: string;
=======
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
}

export interface NewEvent {
    date: string;
    amount?: number;
    taxpayerId: string;
    eventId?: string;
    debt?: number;
<<<<<<< HEAD
    expires_at?: string;
    fineEventId?: string;

=======
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
}

export interface PendingPayments {
    id: string;
    value: string;
    name: string;
    amount: string;
    debt?: number;
<<<<<<< HEAD
    expires_at: string;
=======
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
}




<<<<<<< HEAD
function EventForm({ title = 'Multa', type = "FINE", taxpayerId = "" }) {
=======
function EventForm({ title = 'Multa', type = "FINE", taxpayer = "" }) {
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
    const { user } = useAuth();
    const navigate = useNavigate();
    const [pendingPayments, setPendingPayments] = useState<PendingPayments[]>(useLoaderData() as PendingPayments[])
    const [selectedPayment, setSelectedPayment] = useState<PendingPayments | null>(null);
    const [isSubmiting, setIsSubmiting] = useState(false); // Handle submitting behavior
<<<<<<< HEAD
    const [hasFetchedPayments, setHasFetchedPayments] = useState(false);
    const [taxpayerArray, setTaxpayerArray] = useState<Taxpayer[]>([]);
=======
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
    if (!user) {
        navigate("/login");
        return null;
    }

<<<<<<< HEAD
    useEffect(() => {
        const fetchTaxpayers = async () => {
            try {
                const response = await getTaxpayerForEvents();
                const filtered = response.data.filter((t: Taxpayer) => t.process !== "FP");
                setTaxpayerArray(filtered);
            } catch (e) {
                toast.error("No se pudieron obtener los contribuyentes.");
            }
        };

        fetchTaxpayers();
    }, []);
=======
    const taxpayerArray: Taxpayer[] = user.taxpayer
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)

    const {
        register,
        handleSubmit,
<<<<<<< HEAD
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



=======
        formState: { isValid },
        watch,
        control,
        reset } = useForm<EventFormData>({
            defaultValues: {
                amount: 0.00,
                date: new Date().toISOString().split('T')[0],  // Ensure date is a string
            }
        });


    const taxPayerWatcher = watch("taxpayerId")

    const getTaxpayerPendingPayments = useCallback(
        async () => {
            const auxPayments = await getPendingPayments((taxPayerWatcher))
            const mappedPayments = auxPayments.map((event: Event) => { return { id: event.id, value: event.id, name: `${event.type} ${event.date.split("T")[0]} ${event.taxpayer} `, amount: event.amount, debt: event.debt } })
            setPendingPayments(mappedPayments)
        }, [taxPayerWatcher]
    )
    useEffect(() => { if (taxPayerWatcher != "" && type == "payment") { getTaxpayerPendingPayments() } }, [taxPayerWatcher])


    if (type == "payment") console.log("PENDING PAYMENTS: " + JSON.stringify(pendingPayments))


    const onSubmit = async (data: EventFormData) => {
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
        // Control to avoid several submits with the same data
        if (isSubmiting) return;


        // Detect that it is submiting so change the state
        setIsSubmiting(true);

        try {

            // Convert date to ISO 8601 format (e.g., "2025-03-17T00:00:00.000Z")
<<<<<<< HEAD

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
=======
            const parsedDate = parseDate(data.date);
            const formattedDate = new Date(parsedDate.year, parsedDate.month - 1, parsedDate.day).toISOString();

            let newEvent: NewEvent;
            if (type != "payment") {
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
                // Define data for the api request
                newEvent = {
                    date: formattedDate,
                    amount: data.amount,
<<<<<<< HEAD
                    taxpayerId: taxpayerId != "" ? taxpayerId : data.taxpayerId,
                    expires_at: formattedExpiresAt,
                    fineEventId: data.eventId,
                };
            }




=======
                    taxpayerId: data.taxpayerId,
                };
            } else {
                newEvent = {
                    date: formattedDate,
                    amount: data.amount,
                    taxpayerId: data.taxpayerId,
                    eventId: data.eventId,
                    debt: data.debt,
                };
            }

>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
            if (!newEvent.amount || isNaN(Number(newEvent.amount))) {
                console.error("Error: Amount is required and must be a valid number.");
                toast.error("El monto debe ser un monto válido")
                return;
            }

<<<<<<< HEAD
=======
            console.log(newEvent);
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)

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
<<<<<<< HEAD
                    description: ""
                });

                setSelectedPayment(null);

                // Refresh pending payments after submitting a payment
                await getTaxpayerPendingPayments();
=======
                });
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
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

<<<<<<< HEAD
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


=======
    if (selectedEventId) {

        useEffect(() => {
            // Find the selected payment based on eventId
            const payment = pendingPayments.find(payment => payment.id === selectedEventId);
            setSelectedPayment(payment || null); // Update the selected payment state

        }, [selectedEventId, pendingPayments]); // Trigger effect when selectedEventId or pendingPayments changes
    }

>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)




    return (
        <FormContainer>
            <h2 className="w-full text-2xl font-bold text-center text-black mb-11">Agregar {title}</h2>
            <Form onSubmit={handleSubmit(onSubmit)} className='space-y-2'>

                {/* Select the taxpayer by it's ID */}
                {
<<<<<<< HEAD
                    taxpayerId == "" &&
                    <TaxpayerList name={"taxpayerId"} control={control as Control<EventFormData | IvaReportFormData | IslrReportFormData>} label={"Contribuyente"} taxpayers={taxpayerArray} />
=======
                    taxpayer == "" &&
                    <TaxpayerCombobox name={"taxpayerId"} control={control} label={"Contribuyente"} taxpayers={taxpayerArray} />
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
                }

                {/* If the type is payment, show the pending payments */}
                {
<<<<<<< HEAD
                    (type === "payment" || type === "payment_compromise" || type === "warning") &&
=======
                    type == "payment" &&
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
                    <>
                        <SelectInput
                            control={control}
                            name={"eventId"}
                            label={"Pagos Pendientes"}
                            items={pendingPayments}
                        />
                    </>
                }

<<<<<<< HEAD
=======

>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
                {/* Select Date */}
                <DateInputUI
                    name="date"
                    control={control}
<<<<<<< HEAD
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
=======
                    label={"Fecha de pago"}
                />


                {/* Amount input */}
                <>
                    <Label className="text-black">Monto</Label>

                    <TextInput
                        placeholder={'3500...'}
                        type='number'
                        register={{ ...register("amount", { required: "Campo Obligatorio" }) }}
                    />
                </>


                {/* Show acumulated debt */}
                {
                    type == "payment" &&
                    <>
                        {selectedPayment && (
                            <p>Deuda acumulada: {selectedPayment.debt?.toString()} </p>
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
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