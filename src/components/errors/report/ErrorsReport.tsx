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




    // Configuration for react drop zone
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { "image/*": [] }, // Accepts only images
        multiple: true, // Allows multiple file uploads
        onDrop: (acceptedFiles) => {
            setUploadedFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
        },
    });




    // Submit form function handler
    const onSubmit: SubmitHandler<InputErrors> = async (data) => {

        if (isSubmiting) return;


        const userId = user.id

        const formData = new FormData();

        formData.append("title", data.title || "")
        formData.append("description", data.description || "")
        formData.append("type", data.type || "")
        formData.append("userId", userId || "")

        // Append image files to FormData (if any files are selected)
        uploadedFiles.forEach((file) => {
            formData.append("images", file);
        });




        try {
            setIsSubmiting(true);

            const request = await createError(formData);

            if (request) {
                toast.success("¡Error reportado exitosamente!")
                reset()
                setUploadedFiles([]);
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
        <aside className='flex flex-col w-full px-4 sm:px-8 md:px-12 lg:px-64 py-6 lg:py-32'>
            <div className='w-full h-full border-2 border-gray-200 rounded-md shadow-xl p-4 sm:p-6'>

                <div className='flex items-center justify-center w-full pt-2 sm:pt-4'>
                    <h1 className='text-xl sm:text-2xl font-bold'>Reportar error</h1>
                </div>

                <form onSubmit={handleSubmit(onSubmit, onError)} className='flex flex-col pt-4 space-y-4'>

                    {/* Title */}
                    <div className='px-2 sm:px-4 lg:px-16 space-y-1 sm:space-y-2'>
                        <div className='flex items-center space-x-1'>
                            <p className='text-sm sm:text-base font-bold'>Título del error:</p>
                        </div>
                        <input className='w-full py-1 px-2 bg-gray-200 rounded-md text-sm' {...register("title")} />
                    </div>
                    {errors.title && <p className='text-center text-red-600 text-sm'>{errors.title.message}</p>}

                    {/* Type */}
                    <div className='px-2 sm:px-4 lg:px-16 space-y-1 sm:space-y-2'>
                        <div className='flex items-center space-x-1'>
                            <p className='text-sm sm:text-base font-bold'>Tipo de error:</p>
                            <div className='text-red-600'>
                                <FaAsterisk size={5} />
                            </div>
                        </div>
                        <select className='w-full py-1 px-2 bg-gray-200 rounded-md text-sm' {...register("type")}>
                            <option>Seleccione una opción</option>
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
                    {errors.type && <p className='text-center text-red-600 text-sm'>{errors.type.message}</p>}

                    {/* Description */}
                    <div className='px-2 sm:px-4 lg:px-16 space-y-1 sm:space-y-2'>
                        <div className='flex items-center space-x-1'>
                            <p className='text-sm sm:text-base font-bold'>Descripción:</p>
                            <div className='text-red-600'>
                                <FaAsterisk size={5} />
                            </div>
                        </div>
                        <textarea
                            className="w-full h-32 sm:h-48 p-2 bg-gray-200 rounded-md resize-none text-sm"
                            {...register("description")}
                        />
                    </div>
                    {errors.description && <p className='text-center text-red-600 text-sm'>{errors.description.message}</p>}

                    {/* Drag and Drop */}
                    <div className="px-2 sm:px-4 lg:px-16">
                        <div
                            {...getRootProps()}
                            className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-md cursor-pointer border-blue-500 bg-blue-100 transition-all duration-200`}
                        >
                            <input {...getInputProps()} />
                            <div className='flex items-center px-2 text-sm'>
                                <div className='pr-2 text-blue-500'>
                                    <HiOutlineUpload size={30} />
                                </div>
                                <p className="text-gray-600">
                                    {isDragActive
                                        ? "Suelta los archivos aquí..."
                                        : "Arrastra y suelta los archivos o haz clic para seleccionarlos"}
                                </p>
                            </div>
                        </div>

                        {uploadedFiles.length > 0 && (
                            <div className="mt-4 text-sm space-y-1">
                                <p className="font-semibold">Archivos subidos:</p>
                                <ul className="max-h-24 overflow-y-auto space-y-1">
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
                    {errors.errorImages && <p className='text-center text-red-600 text-sm'>{errors.errorImages.message}</p>}

                    {/* Submit button */}
                    <div className='flex justify-end px-2 sm:px-4 lg:pr-16'>
                        <button
                            type='submit'
                            className='bg-blue-300 px-4 py-1 text-sm text-black font-light rounded-md shadow hover:bg-blue-400 transition-colors'
                        >
                            Enviar
                        </button>
                    </div>

                    {errors.userId && <p className='text-center text-red-600 text-sm'>{errors.userId.message}</p>}
                </form>
            </div>
        </aside>
    )

}