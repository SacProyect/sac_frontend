import React, { useState } from 'react'
import { FaAsterisk } from "react-icons/fa";
import { useForm, SubmitHandler } from 'react-hook-form';
import { app_error, Errors } from '@/types/errors';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone'
import { HiOutlineUpload } from "react-icons/hi";
import { zodResolver } from '@hookform/resolvers/zod'
import { errorsSchema } from '@/components/validations/errorsSchema';
import axios from 'axios';
import { createError } from '@/components/utils/api/reportFunctions';
import toast from 'react-hot-toast';


export interface InputErrors {
    id?: string,
    title?: string,
    description: string,
    type: "HOME" | "TAXPAYER_DETAILS" | "TAXPAYERS" | "WARNING" | "FINES" | "PAYMENT" | "PAYMENT_COMPROMISE" | "STATS" | "OTHER",
    userId: string,
    closed_at?: Date,
    error_images?: ErrorImages[],
}

interface ErrorImages {
    id?: string,
    img_src: string,
    img_alt: string,
    errorId?: string,
    error: Errors
}







export default function ErrorsReport() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // If the user is not logged, we redirect him to login
    if (!user) {
        navigate("/login")
        return null;
    }

    const { register, reset, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(errorsSchema),
        defaultValues: {
            userId: user.id || ""
        }
    });


    const [isSubmiting, setIsSubmiting] = useState(false); // Handle submitting behavior
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);




    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { "image/*": [] }, // Accepts only images
        multiple: true, // Allows multiple file uploads
        onDrop: (acceptedFiles) => {
            setUploadedFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
        },
    });




    const onSubmit: SubmitHandler<InputErrors> = async (data) => {

        if (isSubmiting) return;

        const userId = user.id

        const formattedData = {
            ...data, userId
        }

        try {
            setIsSubmiting(true);

            const request = await createError(formattedData);

            if (request) {
                toast.success("¡Error reportado exitosamente!")
                reset()
            }

        } catch (e) {
            console.error(e);
            toast.error("Ha ocurrido un error, por favor, intente nuevamente.");
        } finally {
            setIsSubmiting(false);  // Reset the isSubmiting state regardless of success or failure
        }
    }




    const onError = (errors: any) => {
        console.log("Validation errors:", errors);
    };



    return (
        <aside className='flex flex-col w-full px-64 py-32 '>
            <div className='w-full h-full border-2 border-gray-200 rounded-md shadow-xl'>

                <div className='flex items-center justify-center w-full pt-8'>
                    <h1 className='text-2xl font-bold'>Reportar error</h1>
                </div>

                <form onSubmit={handleSubmit(onSubmit, onError)} className='flex flex-col pt-4 space-y-4'>

                    <div className='px-16 space-y-2'>
                        <div className='flex items-center space-x-1'>
                            <p className='font-bold'>Título del error:</p>
                        </div>
                        <input className='w-full py-1 pl-2 bg-gray-200 rounded-md' {...register("title")}></input>
                    </div>
                    {errors.title && <p className='text-center text-red-600'>{errors.title.message}</p>}

                    <div className='px-16 space-y-2'>
                        <div className='flex items-center space-x-1'>
                            <p className='font-bold'>Tipo de error:</p>
                            <div className='text-red-600'>
                                <FaAsterisk size={5} />
                            </div>
                        </div>
                        <select className='w-full py-1 pl-2 bg-gray-200 rounded-md' {...register("type")}>
                            <option >Seleccione una opción</option>
                            <option value={app_error.HOME}>Inicio</option>
                            <option value={app_error.TAXPAYERS}>Contribuyentes</option>
                            <option value={app_error.TAXPAYER_DETAILS}>Detalles del contribuyente</option>
                            <option value={app_error.WARNING}>Avisos</option>
                            <option value={app_error.FINES}>Multas</option>
                            <option value={app_error.PAYMENT}>Pagos</option>
                            <option value={app_error.PAYMENT_COMPROMISE}>Compromiso de pago</option>
                            <option value={app_error.OTHER}>Otro</option>
                        </select>
                    </div>
                    {errors.type && <p className='text-center text-red-600'>{errors.type.message}</p>}

                    <div className='px-16 space-y-2'>
                        <div className='flex items-center space-x-1'>
                            <p className='font-bold'>Descripción:</p>
                            <div className='text-red-600'>
                                <FaAsterisk size={5} />
                            </div>
                        </div>
                        <div className='flex h-48 text-start'>
                            <textarea
                                className="w-full h-full p-2 bg-gray-200 rounded-md resize-none text-start" {...register("description")}
                            />
                        </div>
                    </div>
                    {errors.description && <p className='text-center text-red-600'>{errors.description.message}</p>}


                    {/* Drag and Drop Zone */}
                    <div className="px-16">
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
                    {errors.errorImages && <p className='text-center text-red-600'>{errors.errorImages.message}</p>}

                    <div className='flex justify-end w-full pr-16 '>
                        <button type='submit' className='font-light text-black bg-blue-300'>
                            Enviar
                        </button>
                    </div>

                </form>
            </div>
        </aside>
    )
}