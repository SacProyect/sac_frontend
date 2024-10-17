import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useForm } from 'react-hook-form';
import FormContainer from '../UI/FormContainer';
import { Form } from 'react-aria-components';
import { Label } from 'react-aria-components';
import TextInput from '../UI/TextInput';
import SelectInput from '../UI/SelectInput';
import { Button } from 'react-aria-components';
import { useState } from 'react';
import { useEffect } from 'react';
import { getFuncionarios } from '../utils/api/userFunctions';


function TaxpayerForm() {
    const { user } = useAuth()
    const [official, setOfficials] = useState([])
    const {
        register,
        handleSubmit,
        watch,
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
    const loadOfficials = async () => {
        const response = await getFuncionarios()
        const officialArray = response.map((item) => { return { value: item.id, name: `${item.nombre} C.I.:${item.cedula}`, id: item.id } })
        setOfficials(officialArray)
    }

    useEffect(() => { loadOfficials() }, [])

    const onSubmit = async () => {
        try {

        } catch (error) {

        }
    }
    return (
        <FormContainer>
            <h2 className="text-black text-2xl font-bold w-full text-center mb-11">Agregar Contribuyente</h2>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Label>Nro. Providencia</Label>
                <TextInput
                    placeholder={"Ingrese el numero de providencia"}
                    type='number'
                    register={{ ...register("nroProvidencia", { required: "Campo Obligatroio" }) }}
                />
                <SelectInput
                    control={control}
                    name="procedimiento"
                    items={procedureArray}
                    label="Procedimiento"
                />
                <Label>nombre</Label>
                <TextInput
                    placeholder={"Juan Pedro..."}
                    type='text'
                    register={{ ...register("nombre", { required: "Campo Obligatroio" }) }}
                />
                <Label>RIF</Label>
                <TextInput
                    placeholder={"9668523..."}
                    type='number'
                    register={{ ...register("RIF", { required: "Campo Obligatroio" }) }}
                />
                <SelectInput
                    control={control}
                    name="tipoContrato"
                    items={contractArray}
                    label="Tipo Contribuyente"
                />
                <SelectInput
                    control={control}
                    name={"funcionarioId"}
                    items={official}
                    label={"Funcionario"}
                />
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

export default TaxpayerForm