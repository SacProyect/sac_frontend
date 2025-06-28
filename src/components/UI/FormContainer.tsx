// import React from 'react'

import { JSX } from "react"

function FormContainer({ children }: { children: React.ReactNode }): JSX.Element {
    return (
        <div className='flex items-center justify-center w-full h-full sm:h-screen sm:w-full lg:full lg:h-[100vh]'>
            <div className='flex-col bg-white p-10 w-[90%] sm:w-[30rem] rounded-lg shadow-md z-10 lg:overflow-y-auto sm:max-h-full lg:max-h-[100vh]'>
                {children}
            </div>
        </div>
    )
}

export default FormContainer
