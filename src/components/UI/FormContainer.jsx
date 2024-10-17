import React from 'react'

function FormContainer({ children }) {
    return (

        <div className='h-screen flex items-center justify-center w-4/5'>
            <div className='flex-col bg-white p-10 w-[30rem] rounded-lg shadow-md z-10'>
                {children}
            </div>
        </div>

    )
}

export default FormContainer