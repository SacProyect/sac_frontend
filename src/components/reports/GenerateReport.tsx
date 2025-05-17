import React, { useState } from 'react';
import { CiSearch } from "react-icons/ci";
import { IoDocumentTextOutline } from "react-icons/io5";
import ReportModal from './ReportModal';



function GenerateReport() {
    const [showReportModal, setShowReportModal] = useState(false);

    // Dummy data for demonstration; replace with real data as needed.
    const taxpayerData = { rif: 'J478477845', name: 'Victor Enrique Rivas Rios' };
    const fineData: { id: number; description: string; amount: number }[] = [/* ...your fines data... */];
    const taxSummaryData: { [key: string]: any }[] = [/* ...your tax summary data... */];





    return (
        <section className='w-full h-full'>

            {/* Header */}
            <div className='pl-4 pt-4'>
                <h1 className='text-xl text-[#1F2937] font-semibold'>Generar Reportes</h1>
            </div>


            {/* Container */}
            <div className='px-4 py-4'>
                <div className='w-full h-full p-4 border border-gray-200 shadow-xl rounded-md'>

                    {/* Search input */}
                    <div className='w-full'>
                        <h2 className='text-gray-500'>Buscar contribuyente</h2>
                        <div className='w-full pt-4 flex items-center'>
                            <div className='w-[90%] flex items-center gap-2 px-3 py-1 bg-white border rounded-md'>
                                <CiSearch size={18} className="text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o RIF"
                                    className="flex-1 bg-transparent focus:outline-none text-sm placeholder-gray-400"
                                />
                            </div>
                            <div className='lg:w-[5%] px-4'>
                                <button className='px-4 py-1 bg-[#3498DB] text-white'>Buscar</button>
                            </div>
                        </div>
                    </div>

                    {/* Map Filtered Taxpayers */}
                    <div className='w-full h-[48vh] pt-4'>
                        <div className='flex items-center w-full bg-gray-200 rounded-tr-md rounded-tl-md  px-4 py-1 font-medium'>
                            <div className='w-1/3'>
                                <p className=''>RIF</p>
                            </div>
                            <div className='w-1/3'>
                                <p className=''>Nombre</p>
                            </div>
                            <div className='w-1/3 flex justify-end'>
                                <p className=''>Acción</p>
                            </div>
                        </div>
                        <div className='w-full border-b border-r border-l rounded-br-md rounded-bl-md flex  px-2 py-2'>
                            <div className='w-1/3'>
                                <p className='p-1'>J478477845</p>
                            </div>
                            <div className='w-1/3'>
                                <p className='p-1'>Victor Enrique Rivas Rios</p>
                            </div>
                            <div className='w-1/3 flex justify-end'>
                                <button className='p-1 m-0 border border-gray-200 px-2 font-medium' onClick={() => setShowReportModal(true)}>Ver Reporte</button>
                            </div>
                        </div>
                    </div>

                    {/* Group Reports Header*/}
                    <div className='pt-4 space-y-2'>
                        <h2 className='text-gray-500 font-semibold'>Reportes por grupo</h2>
                        <p className='text-gray-500 text-xs'>Seleccione un grupo para generar un reporte completo</p>
                    </div>

                    {/* Generate Group Report */}
                    <div className='w-full grid grid-cols-3 gap-y-2 gap-x-2 pt-4'>

                        {/* Card */}
                        <div className='w-full h-[4rem] flex border rounded-md px-4 items-center justify-between'>
                            <div className='w-[90%] '>
                                <p className='text-gray-500 font-semibold'>GRUPO 1</p>
                                <p className='text-gray-500 text-xs'>42 contribuyentes</p>
                            </div>
                            <div className='w-[10%] flex items-center'>
                                <button className='p-2 rounded-full text-blue-600 bg-blue-300'>
                                    <IoDocumentTextOutline size={15} />
                                </button>
                            </div>
                        </div>
                        <div className='w-full h-[4rem] flex border rounded-md px-4 items-center justify-between'>
                            <div className='w-[90%] '>
                                <p className='text-gray-500 font-semibold'>GRUPO 1</p>
                                <p className='text-gray-500 text-xs'>42 contribuyentes</p>
                            </div>
                            <div className='w-[10%] flex items-center'>
                                <button className='p-2 rounded-full text-blue-600 bg-blue-300'>
                                    <IoDocumentTextOutline size={15} />
                                </button>
                            </div>
                        </div>
                        <div className='w-full h-[4rem] flex border rounded-md px-4 items-center justify-between'>
                            <div className='w-[90%] '>
                                <p className='text-gray-500 font-semibold'>GRUPO 1</p>
                                <p className='text-gray-500 text-xs'>42 contribuyentes</p>
                            </div>
                            <div className='w-[10%] flex items-center'>
                                <button className='p-2 rounded-full text-blue-600 bg-blue-300'>
                                    <IoDocumentTextOutline size={15} />
                                </button>
                            </div>
                        </div>
                        <div className='w-full h-[4rem] flex border rounded-md px-4 items-center justify-between'>
                            <div className='w-[90%] '>
                                <p className='text-gray-500 font-semibold'>GRUPO 1</p>
                                <p className='text-gray-500 text-xs'>42 contribuyentes</p>
                            </div>
                            <div className='w-[10%] flex items-center'>
                                <button className='p-2 rounded-full text-blue-600 bg-blue-300'>
                                    <IoDocumentTextOutline size={15} />
                                </button>
                            </div>
                        </div>
                        <div className='w-full h-[4rem] flex border rounded-md px-4 items-center justify-between'>
                            <div className='w-[90%] '>
                                <p className='text-gray-500 font-semibold'>GRUPO 1</p>
                                <p className='text-gray-500 text-xs'>42 contribuyentes</p>
                            </div>
                            <div className='w-[10%] flex items-center'>
                                <button className='p-2 rounded-full text-blue-600 bg-blue-300'>
                                    <IoDocumentTextOutline size={15} />
                                </button>
                            </div>
                        </div>
                        <div className='w-full h-[4rem] flex border rounded-md px-4 items-center justify-between'>
                            <div className='w-[90%] '>
                                <p className='text-gray-500 font-semibold'>GRUPO 1</p>
                                <p className='text-gray-500 text-xs'>42 contribuyentes</p>
                            </div>
                            <div className='w-[10%] flex items-center'>
                                <button className='p-2 rounded-full text-blue-600 bg-blue-300'>
                                    <IoDocumentTextOutline size={15} />
                                </button>
                            </div>
                        </div>
                        <div className='w-full h-[4rem] flex border rounded-md px-4 items-center justify-between'>
                            <div className='w-[90%] '>
                                <p className='text-gray-500 font-semibold'>GRUPO 1</p>
                                <p className='text-gray-500 text-xs'>42 contribuyentes</p>
                            </div>
                            <div className='w-[10%] flex items-center'>
                                <button className='p-2 rounded-full text-blue-600 bg-blue-300'>
                                    <IoDocumentTextOutline size={15} />
                                </button>
                            </div>
                        </div>


                    </div>

                </div>
            </div>

            {showReportModal && (
                <ReportModal
                    taxpayer={taxpayerData.name}
                    // fineData={fineData}
                    // taxSummary={taxSummaryData}
                    onClose={() => setShowReportModal(false)}
                />
            )}

        </section>
    )
}

export default GenerateReport