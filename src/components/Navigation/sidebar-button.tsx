import { Link } from 'react-router-dom';
import { ReactNode } from 'react';

interface SidebarButtonProps {
    children: ReactNode;
    route: string;
    onClick?: () => void;
}

function SidebarButton({ children, route, onClick }: SidebarButtonProps) {
    return (
        <Link
            to={route}
            onClick={onClick} // <- aquí se dispara el cierre del menú
            className={`
                bg-[#3498db]
                border-none 
                px-4
                lg:py-1
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
                hover:-translate-y-1
            `}
        >
<<<<<<< HEAD
            <p className='text-base text-white'>
=======
            <p className='text-base text-white '>
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
                {children}
            </p>
        </Link>
    );
}

export default SidebarButton;
