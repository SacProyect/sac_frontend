import React from 'react'
import { useAuth } from '../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import TextInput from '../UI/TextInput';
import FormContainer from '../UI/FormContainer';
import { Form, Label, Button } from 'react-aria-components'
import DateInputUI from '../UI/DateInputUI';
import TaxpayerCombobox from '../UI/TaxpayerCombobox';
import { createEvent, getPendingPayments } from '../utils/api/taxpayerFunctions';
import { useLoaderData, useNavigate } from 'react-router-dom';
import SelectInput, { Item } from '../UI/SelectInput';
import { useCallback, useEffect, useState } from 'react';
import Alert from '../UI/Alert';
import { Event } from '../../types/event';
import { Taxpayer } from '../../types/taxpayer';
import { parseDate, parseDateTime, CalendarDate, parseZonedDateTime } from '@internationalized/date';
import toast from 'react-hot-toast';







export interface EventFormData {
    id: string;
    date: string;
    type: string;
    amount: number;
    taxpayerId: string;
    eventId?: string
    debt?: number,
    expires_at: string,
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
    if (!user) {
        navigate("/login");
        return null;
    }

    // console.log("Taxpayer Id receive in event form: " + taxpayerId)

    const taxpayerArray: Taxpayer[] = user.taxpayer

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
                date: new Date().toISOString().split('T')[0],  // Ensure date is a string
            }
        });

    const taxPayerWatcher = watch("taxpayerId")


    const getTaxpayerPendingPayments = useCallback(
        async () => {
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
        }, [taxPayerWatcher]
    )
    useEffect(() => { if (taxPayerWatcher != "" && type == "payment" || type == "warning" || type == "payment_compromise") { getTaxpayerPendingPayments() } }, [taxPayerWatcher])


    if (type == "payment" || type == "warning" || type == "payment_compromise") console.log("PENDING PAYMENTS: " + JSON.stringify(pendingPayments))


    // Submit form function to send the data of the form
    const onSubmit = async (data: EventFormData) => {
        // console.log("DATA FROM EVENTFORM: " + JSON.stringify(data))



        // Control to avoid several submits with the same data
        if (isSubmiting) return;


        // Detect that it is submiting so change the state
        setIsSubmiting(true);

        try {

            // Convert date to ISO 8601 format (e.g., "2025-03-17T00:00:00.000Z")
            const parsedDate = parseDate(data.date);
            const formattedDate = new Date(parsedDate.year, parsedDate.month - 1, parsedDate.day).toISOString();

            const expiresAt = new Date(parsedDate.year, parsedDate.month - 1, parsedDate.day);
            expiresAt.setDate(expiresAt.getDate() + 25);
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





    return (
        <FormContainer>
            <h2 className="w-full text-2xl font-bold text-center text-black mb-11">Agregar {title}</h2>
            <Form onSubmit={handleSubmit(onSubmit)} className='space-y-2'>

                {/* Select the taxpayer by it's ID */}
                {
                    taxpayerId == "" &&
                    <TaxpayerCombobox name={"taxpayerId"} control={control} label={"Contribuyente"} taxpayers={taxpayerArray} />
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
                    label={"Fecha de pago"}
                />


                {/* Amount input */}
                <>
                    <Label className="text-black">Monto en BS:</Label>

                    <TextInput
                        placeholder={'3500...'}
                        type='number'
                        register={{
                            ...register("amount", {
                                required: "Campo Obligatorio",
                                min: {
                                    value: 0,
                                    message: "El monto no puede ser negativo"
                                },
                                ...(type !== "fine" && {
                                    max: {
                                        value: selectedPayment?.debt ?? Infinity,
                                        message: `El monto no puede ser mayor a ${selectedPayment?.debt}`,
                                    },
                                }),
                            })
                        }}
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