import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useForm } from 'react-hook-form';
import FormContainer from '../UI/FormContainer';
import { Form } from 'react-aria-components';
import { Label } from 'react-aria-components';
import TextInput from '../UI/TextInput';
import SelectInput from '../UI/SelectInput';
import { Button } from 'react-aria-components';
import { useLoaderData } from 'react-router-dom';
import { createTaxpayer } from '../utils/api/taxpayerFunctions';
import Alert from '../UI/Alert';
import { useState } from 'react';


function TaxpayerForm() {
    const { user } = useAuth()
    const official = useLoaderData()
    const [isAlertOpen, setAlertOpen] = useState(false);
    const {
        register,
        handleSubmit,
        reset,
        formState: { isValid },
        control } = useForm({
            defaultValues: {
                nroProvidencia: '',
                nombre: '',
                procedimiento: '',
                rif: '',
                tipoContrato: '',
                funcionarioId: ''
            }
        });
    const procedureArray = [
        { value: 'VDF', name: 'VDF', id: 'VDF' },
        { value: 'FP', name: 'FP', id: 'FP' },
        { value: 'AF', name: 'AF', id: 'AF' }
    ]
    const contractArray = [
        { value: 'ORDINARIO', name: 'ORDINARIO', id: 'ORDINARIO' },
        { value: 'ESPECIAL', name: 'ESPECIAL', id: 'ESPECIAL' },
    ]


    const onSubmit = async (data) => {
        try {
            if (data.funcionarioId == "") {
                data.funcionarioId = user.id
            }
            const newTaxpayer = await createTaxpayer(data)
            const auxTaxpayerArray = user.contribuyentes
            const auxUser = user
            if (newTaxpayer) {
                auxTaxpayerArray.push(newTaxpayer)
                auxUser.contribuyentes = auxTaxpayerArray
                setAlertOpen(true)
                reset()
            }
            setUser(auxUser)
        } catch (error) {
            console.log
        }
    }
    return (
        <>
            <FormContainer>
                <h2 className="text-black text-2xl font-bold w-full text-center mb-11">Agregar Contribuyente</h2>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Label>Nro. Providencia</Label>
                    <TextInput
                        placeholder={"Ingrese el numero de providencia"}
                        type='number'
                        register={{ ...register("nroProvidencia", { required: "Campo Obligatorio" }) }}
                    />
                    <SelectInput
                        control={control}
                        name="procedimiento"
                        items={procedureArray}
                        label="Procedimiento"
                    />
                    <Label>Razón Social</Label>
                    <TextInput
                        placeholder={"Juan Pedro..."}
                        type='text'
                        register={{ ...register("nombre", { required: "Campo Obligatorio" }) }}
                    />
                    <Label>RIF</Label>
                    <div className="flex">
                        <span className="text-black mr-2 mt-2">J-</span>
                        <TextInput
                            placeholder={"Ingrese el número de RIF"}
                            type="text"
                            maxLength="9"
                            register={{
                                ...register("rif", {
                                    required: "Campo Obligatorio",
                                    pattern: {
                                        value: /^[0-9]{9}$/, 
                                        message: "El RIF debe tener 9 dígitos numéricos"
                                    }
                                })
                            }}
                        />
                    </div>

                    <SelectInput
                        control={control}
                        name="tipoContrato"
                        items={contractArray}
                        label="Tipo Contribuyente"
                    />
                    {user.tipo === "ADMIN" &&
                        <SelectInput
                            control={control}
                            name={"funcionarioId"}
                            items={official}
                            label={"Funcionario"}
                        />
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
                    <Alert
                        message={"Contribuyente creado exitosamente..."}
                        isOpen={isAlertOpen}
                        onClose={() => setAlertOpen(false)}
                    />
                </Form>

            </FormContainer>
        </>
    )
}

export default TaxpayerForm