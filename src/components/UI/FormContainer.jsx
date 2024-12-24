import React from 'react'

function FormContainer({ children }) {
    return (
        <div className='h-auto sm:h-screen flex items-center justify-center w-full sm:w-full pt-8 pb-8'>
            <div className='flex-col bg-white p-10 w-[90%] sm:w-[30rem] rounded-lg shadow-md z-10 overflow-auto'>
                {children}
            </div>
        </div>
    )
}

export default FormContainer
