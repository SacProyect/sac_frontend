import React from 'react'
import { useAuth } from '../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import TextInput from '../UI/TextInput';
import FormContainer from '../UI/FormContainer';
import { Form } from 'react-aria-components'
import { Label } from 'react-aria-components';
import { Button } from 'react-aria-components';
import DateInputUI from '../UI/DateInputUI';
import { parseDate } from '@internationalized/date';
import TaxpayerCombobox from '../UI/TaxpayerCombobox';


function EventForm({ title = 'Multa', type = "multa", contribuyente = "" }) {
    const { user } = useAuth();
    const taxpayerArray = user.contribuyentes
    const {
        register,
        handleSubmit,
        watch,
        formState: { isValid },
        control } = useForm({
            defaultValues: {
                monto: '',
                contribuyenteId: `${contribuyente}`,
                fecha: parseDate(new Date().toISOString().split('T')[0]),
            }
        });
    const onSubmit = (data) => {
        console.log("culo", data)
    }
    return (
        <FormContainer>
            <h2 className="text-black text-2xl font-bold w-full text-center mb-11">Agregar {title}</h2>
            <Form onSubmit={handleSubmit(onSubmit)}>
                {
                    contribuyente == "" &&
                    <TaxpayerCombobox name={"contribuyenteId"} control={control} label={"Contribuyente"} taxpayers={taxpayerArray} />
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
                            register={{ ...register("monto", { required: "Campo Obligatroio" }) }}
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
        </FormContainer>
    )
}

export default EventForm