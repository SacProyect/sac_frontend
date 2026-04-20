import React from 'react'

interface NegativeButtonProps {
    children: React.ReactNode;
    onClick: () => void;
}

function NegativeButton({ children, onClick }: NegativeButtonProps) {
    return (
        <button
            onClick={onClick}
            className={
                `bg-red-500
                border-none 
                px-4
                py-2
                font-light
                text-center 
                no-underline 
                inline-block   
                my-1 
                cursor-pointer 
                rounded 
                w-full 
                transition 
                hover:bg-red-800 
                hover:-translate-y-1`
            }>
            {children}
        </button>
    )
}

export default NegativeButton