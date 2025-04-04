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
import { useDropzone } from 'react-dropzone'
import { HiOutlineUpload } from 'react-icons/hi';



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
    const [rifPrefix, setRifPrefix] = useState("J")
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);


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



    // Types for the arrays
    const procedureArray = [
        { value: 'VDF', name: 'VDF', id: 'VDF' },
        { value: 'FP', name: 'FP', id: 'FP' },
        { value: 'AF', name: 'AF', id: 'AF' }
    ]
    const contractArray = [
        { value: 'ORDINARY', name: 'ORDINARY', id: 'ORDINARY' },
        { value: 'SPECIAL', name: 'SPECIAL', id: 'SPECIAL' },
    ]


    // Submit form
    const onSubmit: SubmitHandler<NewTaxpayer> = async (data) => {
        try {

            if (user.role != "ADMIN") data.officerId = user.id;


            // Adds rif prefix to the rif numeric data

            const formData = new FormData();

            formData.append("providenceNum", data.providenceNum.toString());
            formData.append("process", data.process);
            formData.append("name", data.name);
            formData.append("rif", rifPrefix + data.rif);
            formData.append("contract_type", data.contract_type);
            formData.append("officerId", data.officerId);

            uploadedFiles.forEach((file) => {
                formData.append("pdfs", file)
            })

            const newTaxpayer = await createTaxpayer(formData);

            if (!newTaxpayer.success) {
                toast.error("No se pudo crear el contribuyente, por favor, intente de nuevo.")
            } else {
                toast.success("¡Contribuyente creado exitosamente!")
                setUploadedFiles([]);
                reset()
            }

        } catch (error) {
            toast.error("No se pudo crear el contribuyente, por favor, inténtelo de nuevo.");
        }
    }


    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            "application/pdf": [], // Accepts PDF's
            "application/msword": [], // Accepts .doc (Word 97-2003)
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [] // Accepts .docx (modern Word format)
        },
        multiple: true, // Allows multiple file uploads
        onDrop: (acceptedFiles) => {
            setUploadedFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
        },
    });


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
                                            value: /^\d{9}$/, // Only 10 digits including the person letter
                                            message: "El RIF debe tener exactamente 9 dígitos numéricos"
                                        },
                                        minLength: {
                                            value: 9,
                                            message: "El RIF debe tener exactamente 9 dígitos numéricos"
                                        },
                                        maxLength: {
                                            value: 9,
                                            message: "El RIF debe tener exactamente 9 dígitos numéricos"
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
                            rules={{
                                required: "Campo obligatorio",
                                validate: (value) =>
                                    value === contract_type.ORDINARY || value === contract_type.SPECIAL
                                        ? true
                                        : "Por favor seleccione un tipo de contrato"
                            }}
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

                    {user.role === "ADMIN" ? (
                        <SelectInput
                            control={control}
                            name={"officerId"}
                            items={official}
                            label={"Funcionario"}
                        />
                    ) : (
                        <div className="py-2">
                            <div className="py-2 mt-4 px-4 border border-[#ccc] rounded-lg bg-slate-50 w-full hover:bg-white hover:border-black hover:border-1">
                                <Label className="block text-base font-medium">{`Funcionario: ${user.name}`}</Label>
                            </div>
                        </div>
                    )}
                    {errors.officerId && <span className="text-sm text-red-600">{errors.officerId.message}</span>}

                    {/* Drag and Drop Zone */}
                    <div className=" pt-4">
                        <div
                            {...getRootProps()}
                            className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-md cursor-pointer ${"border-blue-500  bg-blue-100"
                                } transition-all duration-200`}
                        >
                            <input {...getInputProps()} />
                            {isDragActive ? (
                                <div className='flex items-center'>
                                    <div className='pr-4 text-blue-500'>
                                        <HiOutlineUpload size={50} />
                                    </div>
                                    <p className="text-sm text-blue-500">Suelta los archivos aquí...</p>
                                </div>

                            ) : (
                                <div className='flex items-center'>
                                    <div className='pr-4 text-blue-500'>
                                        <HiOutlineUpload size={50} />
                                    </div>
                                    <p className="text-sm text-gray-600">Arrastra y suelta los archivos o haz clic aquí para seleccionarlos</p>
                                </div>
                            )}
                        </div>

                        {/* Display Uploaded Files */}
                        {uploadedFiles.length > 0 && (
                            <div className="h-24 mt-4 space-y-1 ">
                                <p className="font-semibold">Archivos subidos:</p>
                                <ul className="h-16 space-y-1 overflow-y-auto text-sm text-gray-700">
                                    {uploadedFiles.map((file, index) => (
                                        <li key={index} className="flex items-center space-x-2">
                                            <span>📄 {file.name}</span>
                                            <span className="text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>


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