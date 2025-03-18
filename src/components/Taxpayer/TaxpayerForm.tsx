// import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { SubmitHandler, useForm, Controller } from 'react-hook-form';
import FormContainer from '../UI/FormContainer';
import { Form, Label, Button, DragAndDropContext } from 'react-aria-components';
import TextInput from '../UI/TextInput';
import SelectInput from '../UI/SelectInput';
import { json, useLoaderData, useNavigate } from 'react-router-dom';
import type { Item } from '../UI/SelectInput';
import { createTaxpayer } from '../utils/api/taxpayerFunctions';
import { useState } from 'react';
import { taxpayer_process, contract_type } from '../../types/taxpayer';
import toast from 'react-hot-toast';



export type NewTaxpayer = {
    providenceNum: number;
    process: taxpayer_process;
    name: string;
    rif: string;
    contract_type: contract_type;
    officerId: string;
};




function TaxpayerForm() {
    const { user } = useAuth()
    const navigate = useNavigate();

    if (!user) {
        navigate("/login")
        return null;
    }
    const official = useLoaderData() as Item[]
    const [isAlertOpen, setAlertOpen] = useState(false);
    const [rifPrefix, setRifPrefix] = useState("J")
    const {
        register,
        handleSubmit,
        reset,
        formState: { isValid, errors },
        control } = useForm({
            mode: "onSubmit",
            defaultValues: {
                providenceNum: -1,
                name: '',
                process: taxpayer_process.NA,
                rif: '',
                contract_type: contract_type.ORDINARY,
                officerId: ''
            }
        });
    const procedureArray = [
        { value: 'VDF', name: 'VDF', id: 'VDF' },
        { value: 'FP', name: 'FP', id: 'FP' },
        { value: 'AF', name: 'AF', id: 'AF' }
    ]
    const contractArray = [
        { value: 'ORDINARY', name: 'ORDINARY', id: 'ORDINARY' },
        { value: 'SPECIAL', name: 'SPECIAL', id: 'SPECIAL' },
    ]


    const onSubmit: SubmitHandler<NewTaxpayer> = async (data) => {

        try {
            if (data.officerId == "") {
                data.officerId = user.id
            }

            // Adds rif prefix to the rif numeric data
            const formattedData = {...data, rif: rifPrefix + data.rif};


            const newTaxpayer = await createTaxpayer(formattedData);
            console.log("NEW TAXPAYER: " + JSON.stringify(formattedData, null, 2));


            if (newTaxpayer && newTaxpayer.id) {
                toast.success("Contribuyente creado exitosamente")
                reset()
            }

        } catch (error) {
            toast.error("No se pudo crear el contribuyente, por favor, inténtelo de nuevo.")
            console.log(error)
        }
    }


    return (
        <>
            <FormContainer>
                <h2 className="w-full text-2xl font-bold text-center text-black mb-11">Agregar Contribuyente</h2>
                <Form onSubmit={handleSubmit(onSubmit)} className=''>
                    <div className=''>
                        <Label className=''>Nro. Providencia</Label>
                    </div>
                    <TextInput
                        placeholder={"Ingrese el numero de providencia"}
                        type='number'
                        register={{ ...register("providenceNum", { required: "Campo Obligatorio", min: { value: 0, message: "Por favor introduzca un número de providencia válido" } }) }}
                    />
                    {errors.providenceNum && <span className="text-sm text-red-600">{errors.providenceNum.message}</span>}


                    {/* Process input field */}
                    <div className='pt-2'>
                        <Controller
                            control={control}
                            name="process"
                            rules={{
                                required: "Campo obligatorio", validate: value =>
                                    Object.values(taxpayer_process).includes(value) || "Por favor, seleccione un campo válido",
                            }}
                            render={({ field }) => (
                                <SelectInput
                                    {...field}
                                    control={control}
                                    items={procedureArray}
                                    label="Procedimiento"
                                />
                            )}
                        />
                    </div>
                    {errors.process && <span className="text-sm text-red-600 ">{errors.process.message}<br></br></span>}

                    <div className='pt-2'>
                        <Label>Razón Social</Label>
                        <TextInput
                            placeholder={"Juan Pedro..."}
                            type='text'
                            register={{ ...register("name", { required: "Campo Obligatorio" }) }}
                        />
                    </div>
                    {errors.name && <span className="text-sm text-red-600">{errors.name.message}<br></br></span>}

                    <div className='pt-2'>
                        <Label>RIF</Label>
                        <div className="flex items-center justify-center">
                            <select name='person-type' onChange={(e) => setRifPrefix(e.target.value)}>
                                <option value="J" className='text-black'>J-</option>
                                <option value="V" className='text-black'>V-</option>
                                <option value="E" className='text-black'>E-</option>
                                <option value="G" className='text-black'>G-</option>
                                <option value="P" className='text-black'>P-</option>
                            </select>
                            <TextInput
                                placeholder={"Ingrese el número de RIF"}
                                type="text"
                                register={{
                                    ...register("rif", {
                                        required: "Campo Obligatorio",
                                        pattern: {
                                            value:  /^\d{9}$/, // Only 10 digits including the person letter
                                            message: "El RIF debe tener exactamente 9 dígitos numéricos"
                                        },
                                        minLength: {
                                            value: 9,
                                            message: "El RIF debe tener exactamente 9 dígitos"
                                        },
                                        maxLength: {
                                            value: 9,
                                            message: "El RIF debe tener exactamente 9 dígitos"
                                        },
                                    })
                                }}
                            />
                        </div>
                        {errors.rif && <span className="text-sm text-red-600">{errors.rif.message}</span>}
                    </div>

                    <div className='pt-2'>
                        <Controller
                            control={control}
                            name="contract_type"
                            rules={{ required: "Campo obligatorio", validate: value => value !== contract_type.ORDINARY && value !== contract_type.SPECIAL || "Por favor seleccione un tipo de contrato" }}  // Add validation rules here
                            render={({ field }) => (
                                <SelectInput
                                    {...field}
                                    control={control}
                                    items={[
                                        { id: 'SPECIAL', name: 'ESPECIAL', value: 'SPECIAL' },
                                        { id: 'ORDINARY', name: 'ORDINARIO', value: 'ORDINARY' },
                                    ]}
                                    label="Tipo Contribuyente"
                                />
                            )}
                        />
                    </div>
                    {errors.contract_type && <span className="text-sm text-red-600">{errors.contract_type.message}</span>}


                    {user.role === "ADMIN" &&
                        <SelectInput
                            control={control}
                            name={"funcionarioId"}
                            items={official}
                            label={"Funcionario"}
                        />
                    }
                    {errors.officerId && <span className="text-sm text-red-600">{errors.officerId.message}</span>}


                    <Button
                        type='submit'
                        className={
                            `w-full 
                        p-2 
                        mt-4
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
        </>
    )
}

export default TaxpayerForm