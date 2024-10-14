import React from 'react'

function FormContainer({ children }) {
    return (
        <div className='bg-slate-100 h-screen w-screen overflow-hidden'>
            <div className='h-screen flex items-center justify-center'>
                <div className='flex-col bg-white p-10 w-[30rem] rounded-lg shadow-md z-10'>
                    {children}
                </div>
            </div>
        </div>
    )
}

export default FormContainer