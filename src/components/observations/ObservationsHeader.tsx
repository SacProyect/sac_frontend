import React from 'react'
import { CiCirclePlus } from "react-icons/ci";

function ObservationsHeader() {








    return (
        <header className=' w-full h-full lg:w-[82vw] lg:h-[25vh] '>
            <div className='flex items-center justify-center pt-4 lg:w-2/3'>
                <h1 className="text-3xl font-bold mb-8 text-[#475569]">Gestión de Observaciones</h1>
            </div>

            <div className='w-full h-[8rem] flex items-center justify-center'>
                <div className='w-2/3 h-full bg-[#F1F5F9] shadow-sm'>
                    <div className='pt-4 pl-4'>
                        <div>
                            <h2 className=' text-xl font-semibold mb-4 text-[#475569]'>Nueva Observación</h2>
                        </div>
                        <div className='flex pt-2'>
                            <div className='w-[70%] h-[2rem]'>
                                <input className='w-full h-full border border-gray-200 rounded-sm'></input>
                            </div>
                            <div className='w-[30%] h-[2rem] flex items-center justify-around mx-2 bg-[#3498db] rounded-md text-sm'>
                                <div className='pl-2'>
                                    <CiCirclePlus size={15} className='text-white ' />
                                </div>
                                <button className='flex items-center text-white '> Agregar Observación</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default ObservationsHeader