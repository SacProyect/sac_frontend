// import React from 'react'

function FormContainer({ children }: { children: React.ReactNode }): JSX.Element {
    return (
        <div className='flex items-center justify-center w-full h-full pt-8 pb-8 sm:h-screen sm:w-full'>
            <div className='flex-col bg-white p-10 w-[90%] sm:w-[30rem] rounded-lg shadow-md z-10 overflow-auto'>
                {children}
            </div>
        </div>
    )
}

export default FormContainer
