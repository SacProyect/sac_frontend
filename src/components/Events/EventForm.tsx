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
}

export interface NewEvent {
    date: string;
    amount?: number;
    taxpayerId: string;
    eventId?: string;
    debt?: number;
}

export interface PendingPayments {
    id: string;
    value: string;
    name: string;
    amount: string;
    debt?: number;
}




function EventForm({ title = 'Multa', type = "FINE", taxpayer = "" }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [pendingPayments, setPendingPayments] = useState<PendingPayments[]>(useLoaderData() as PendingPayments[])
    const [selectedPayment, setSelectedPayment] = useState<PendingPayments | null>(null);
    const [isSubmiting, setIsSubmiting] = useState(false); // Handle submitting behavior
    if (!user) {
        navigate("/login");
        return null;
    }

    const taxpayerArray: Taxpayer[] = user.taxpayer

    const {
        register,
        handleSubmit,
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
        // Control to avoid several submits with the same data
        if (isSubmiting) return;


        // Detect that it is submiting so change the state
        setIsSubmiting(true);

        try {

            // Convert date to ISO 8601 format (e.g., "2025-03-17T00:00:00.000Z")
            const parsedDate = parseDate(data.date);
            const formattedDate = new Date(parsedDate.year, parsedDate.month - 1, parsedDate.day).toISOString();

            let newEvent: NewEvent;
            if (type != "payment") {
                // Define data for the api request
                newEvent = {
                    date: formattedDate,
                    amount: data.amount,
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
            

            if (!newEvent.amount || isNaN(Number(newEvent.amount))) {
                console.error("Error: Amount is required and must be a valid number.");
                toast.error("El monto debe ser un monto válido")
                return;
            }

            console.log(newEvent);

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

    if (selectedEventId) {

        useEffect(() => {
            // Find the selected payment based on eventId
            const payment = pendingPayments.find(payment => payment.id === selectedEventId);
            setSelectedPayment(payment || null); // Update the selected payment state

        }, [selectedEventId, pendingPayments]); // Trigger effect when selectedEventId or pendingPayments changes
    }





    return (
        <FormContainer>
            <h2 className="w-full text-2xl font-bold text-center text-black mb-11">Agregar {title}</h2>
            <Form onSubmit={handleSubmit(onSubmit)} className='space-y-2'>

                {/* Select the taxpayer by it's ID */}
                {
                    taxpayer == "" &&
                    <TaxpayerCombobox name={"taxpayerId"} control={control} label={"Contribuyente"} taxpayers={taxpayerArray} />
                }

                {/* If the type is payment, show the pending payments */}
                {
                    type == "payment" &&
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