import React, { useState } from 'react'
import { CiCirclePlus } from "react-icons/ci";
import { useForm } from 'react-hook-form'
import { createObservation } from '../utils/api/taxpayer-functions';
import toast from 'react-hot-toast';


export interface ObservationsForm {
    taxpayerId: string
    description: string,
    date: string,
}

interface ObservationsHeaderProps {
    taxpayerId: string | undefined,
    onObservationCreated: () => void;
}


function ObservationsHeader({ taxpayerId, onObservationCreated }: ObservationsHeaderProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, reset, formState: { isValid, errors }, } = useForm<ObservationsForm>({
        mode: "onChange",
        defaultValues: {
            description: "",
            date: new Date().toISOString(),
        }
    })

    const onSubmit = async (data: ObservationsForm) => {

        if (!taxpayerId) {
            toast.error("No se ha especificado un contribuyente.");
            return;
        }

        setIsSubmitting(true); // block multiple clicks

        try {

            const payload = {
                ...data,
                taxpayerId: taxpayerId!, // force taxpayerId from props
            };

            const response = await createObservation(payload);

            if (response) {
                toast.success("¡Observación creada exitosamente!")
                reset({
                    date: new Date().toISOString(),
                    description: "",
                }),
                    onObservationCreated(); // ��� trigger the refresh in parent
            }
        } catch (e) {
            console.error("Error al crear la observación...", e)
            toast.error("Ocurrió un error al crear la observación")
        } finally {
            setIsSubmitting(false); // re-enable button
        }
    }




    return (
        <header className='w-full h-full lg:w-[82vw] lg:h-[25vh] '>
            <div className='flex items-center justify-center w-full pt-4 text-center lg:w-3/5'>
                <h1 className="text-3xl font-bold mb-8 text-[#475569] w-full">Gestión de Observaciones</h1>
            </div>

            <div className='w-full h-full lg:h-[8rem] flex items-center justify-center'>
                <div className='w-full lg:w-3/4 h-full bg-[#F1F5F9] shadow-sm'>
                    <div className='pt-4 pl-4'>
                        <div>
                            <h2 className=' text-xl font-semibold mb-4 text-[#475569]'>Nueva Observación</h2>
                        </div>
                        <form className='flex flex-col pt-2 pr-4 space-y-4 lg:space-y-0 lg:pr-0 lg:flex-row' onSubmit={handleSubmit(onSubmit)}>
                            <div className='w-full lg:w-[75%] h-[2rem] pb-8 lg:pb-0'>
                                <input className='w-full h-full py-4 pl-2 border border-gray-200 rounded-md lg:py-0' {...register("description", { required: "Se debe proporcionar una observación", minLength: { value: 20, message: "La observación debe contener más de 20 caracteres" } })}></input>
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-500 ">{errors.description.message}</p>
                                )}
                            </div>

                            <div className='w-full lg:w-[25%] h-[2rem] flex items-center justify-around  lg:mx-4 lg:px-2 bg-[#3498db] rounded-md text-sm'>
                                <div className=''>
                                    <CiCirclePlus size={15} className='text-white ' />
                                </div>
                                <div className=' lg:pr-0'>
                                    <button className='flex items-center px-0 text-white' type='submit' disabled={isSubmitting}> Agregar Observación</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default ObservationsHeader