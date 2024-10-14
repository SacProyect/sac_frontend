import React from 'react'
import SidebarButton from './SidebarButton'
import { useAuth } from '../../hooks/useAuth'
import NegativeButton from '../UI/NegativeButton'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

function Sidebar() {
    const { user, logout } = useAuth()
    const navOptions = user.tipo != "ADMIN" ? [
        {
            name: 'Buscar', path: '/'
        }, {
            name: 'Contribuyentes', path: '/contribuyente'
        }, {
            name: 'Avisos', path: '/aviso'
        }, {
            name: 'Multas', path: '/multa'
        }, {
            name: 'Pagos', path: '/pago'
        }, {
            name: 'Compromisos de pagos', path: '/compromiso_pago'
        }
    ] : [
        {
            name: 'Buscar', path: '/'
        }, {
            name: 'Contribuyentes', path: '/contribuyente'
        }, {
            name: 'Avisos', path: '/aviso'
        }, {
            name: 'Multas', path: '/multa'
        }, {
            name: 'Pagos', path: '/pago'
        }, {
            name: 'Compromisos de pagos', path: '/compromiso_pago'
        }, {
            name: "Estadísticas", path: "/"

        }
    ]
    const handleLogout = () => {
        logout();
    };
    useEffect(() => { console.log(user) }, [user])
    return (
        <div>
            <div className="fixed top-0 left-0 h-screen w-64 bg-[#2c3e50] text-white rounded-r-[25px] z-10 justify-start">
                <div className="flex flex-col p-6 h-full ">
                    <div
                        className='bg-white bg-opacity-10 py-2 px-3 rounded-lg mb-4 text-center cursor-pointer w-fit self-center group'
                    >
                        <p className='text-base'
                        >
                            {user.nombre}
                        </p>
                        <p className='text-sm'>
                            {user.tipo}
                        </p>
                        <div className='hidden group-hover:block absolute bg-[#34495e] z-20 rounded-lg p-2 -translate-x-1/2 w-max min-w-40 left-1/2'>
                            <p>Cédula: {user.cedula}</p>
                            <NegativeButton
                                onClick={handleLogout}>
                                Cerrar sesion
                            </NegativeButton>
                        </div>
                    </div>

                    <ul>
                        {navOptions.map((opt) =>
                            <li key={opt.name}>
                                <SidebarButton route={opt.path}>
                                    {opt.name}
                                </SidebarButton>
                            </li>)}
                    </ul>
                    <div className='justify-self-end mt-auto'>
                        <NegativeButton>
                            <Link to={'/'}>
                                <p className='text-white text-base'>
                                    Aviso de Error
                                </p>
                            </Link>
                        </NegativeButton>
                    </div>

                </div>


            </div>
            <Outlet />
        </div>
    )
}

export default Sidebar