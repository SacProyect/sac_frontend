import React from 'react'
import { useAuth } from '../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import TextInput from '../UI/TextInput';
import FormContainer from '../UI/FormContainer';
import { Form } from 'react-aria-components'
import { Label } from 'react-aria-components';
import { Button } from 'react-aria-components';
import DateInputUI from '../UI/DateInputUI';
import TaxpayerCombobox from '../UI/TaxpayerCombobox';
import { createEvent, getPendingPayments } from '../utils/api/taxpayerFunctions';
import { parseDateTime } from '@internationalized/date';
import { useLoaderData } from 'react-router-dom';
import SelectInput from '../UI/SelectInput';
import { useState } from 'react';
import { useCallback } from 'react';
import { useEffect } from 'react';
import Alert from '../UI/Alert';


function EventForm({ title = 'Multa', type = "multa", contribuyente = "" }) {
    const { user } = useAuth();
    const taxpayerArray = user.contribuyentes
    const [pendingPayments, setPendingPayments] = useState(useLoaderData())
    const [isAlertOpen, setAlertOpen] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { isValid },
        watch,
        control } = useForm({
            defaultValues: {
                eventoId: "",
                monto: '',
                contribuyenteId: `${contribuyente}`,
                fecha: parseDateTime(new Date().toISOString().split('T')[0]),
            }
        });
    const taxPayerWatcher = watch("contribuyenteId")
    const getTaxpayerPendingPayments = useCallback(
        async () => {
            const auxPayments = await getPendingPayments(parseInt(taxPayerWatcher))
            const mappedPayments = auxPayments.map((event) => { return { id: event.id, value: event.id, name: `${event.tipo} ${event.fecha.split("T")[0]} ${event.contribuyente}` } })
            setPendingPayments(mappedPayments)
        }, [taxPayerWatcher]
    )
    useEffect(() => { if (taxPayerWatcher != "" && type == "pago") { getTaxpayerPendingPayments() } }, [taxPayerWatcher])
    const onSubmit = async (data) => {
        try {
            data.fecha = data.fecha.toDate();
            data.monto == "" ? delete data.monto : data.monto
            data.eventoId == "" ? delete data.eventoId : data.eventoId
            console.log(data)
            const newEvent = await createEvent(type, data)
            if (newEvent) {
                setAlertOpen(true)
                reset()
            }
        } catch (error) {

        }
    }
    return (
        <FormContainer>
            <h2 className="text-black text-2xl font-bold w-full text-center mb-11">Agregar {title}</h2>
            <Form onSubmit={handleSubmit(onSubmit)}>
                {
                    contribuyente == "" &&
                    <TaxpayerCombobox name={"contribuyenteId"} control={control} label={"Contribuyente"} taxpayers={taxpayerArray} />
                }
                {
                    type == "pago" &&
                    <>
                        <SelectInput
                            control={control}
                            name={"eventoId"}
                            label={"Pagos Pendientes"}
                            items={pendingPayments}
                        />
                    </>
                }
                <DateInputUI
                    name="fecha"
                    control={control}
                    label={"Fecha de pago"}
                />
                {type !== "aviso" &&
                    <>
                        <Label className="text-black">Monto</Label>

                        <TextInput
                            placeholder={'3500...'}
                            type='number'
                            register={{ ...register("monto", { required: "Campo Obligatorio" }) }}
                        />
                    </>
                }
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
            </Form>
            <Alert
                message={`${title} creado exitosamente...`}
                isOpen={isAlertOpen}
                onClose={() => setAlertOpen(false)}
            />
        </FormContainer>
    )
}

export default EventForm