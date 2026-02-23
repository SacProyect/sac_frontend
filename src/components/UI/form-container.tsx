// import React from 'react'

<<<<<<< HEAD
import { JSX } from "react"

function FormContainer({ children }: { children: React.ReactNode }): JSX.Element {
    return (
        <div className='flex items-center justify-center w-full h-full sm:h-full md:h-full sm:w-full lg:full lg:h-[100vh] md:my-6 lg:my-0'>
            <div className='flex-col bg-white p-10 w-[90%] sm:w-[30rem] rounded-lg shadow-md z-10 lg:overflow-y-auto sm:max-h-full lg:max-h-[98vh]'>
=======
function FormContainer({ children }) {
    return (
        <div className='flex items-center justify-center w-full h-full pt-8 pb-8 sm:h-screen sm:w-full'>
            <div className='flex-col bg-white p-10 w-[90%] sm:w-[30rem] rounded-lg shadow-md z-10 overflow-auto'>
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
                {children}
            </div>
        </div>
    )
}

export default FormContainer
