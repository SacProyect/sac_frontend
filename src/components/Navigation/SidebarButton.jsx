import React from 'react';
import { Link } from 'react-router-dom';

function SidebarButton({ children, route }) {
    return (
        <Link
            to={route}
            className={
                `bg-[#3498db]
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
                hover:bg-green-500 
                hover:-translate-y-1`
            }
        >
            <p className='text-white text-base '>
                {children}
            </p>
        </Link>
    );
}

export default SidebarButton;