import React, { useState, useEffect } from 'react'
import SidebarButton from './SidebarButton'
import { useAuth } from '../../hooks/useAuth'
import NegativeButton from '../UI/NegativeButton'
import { Link } from 'react-router-dom'
import { Outlet } from 'react-router-dom'

function Sidebar() {
    const { user, logout } = useAuth()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const navOptions = user.tipo !== "ADMIN" ? [
        { name: 'Inicio', path: '/' },
        { name: 'Contribuyentes', path: '/contribuyente' },
        { name: 'Avisos', path: '/aviso' },
        { name: 'Multas', path: '/multa' },
        { name: 'Pagos', path: '/pago' },
        { name: 'Compromisos de pagos', path: '/compromiso_pago' }
    ] : [
        { name: 'Inicio', path: '/' },
        { name: 'Contribuyentes', path: '/contribuyente' },
        { name: 'Avisos', path: '/aviso' },
        { name: 'Multas', path: '/multa' },
        { name: 'Pagos', path: '/pago' },
        { name: 'Compromisos de pagos', path: '/compromiso_pago' },
        { name: "Estadísticas", path: "/" }
    ]

    const handleLogout = () => {
        logout()
    }

    useEffect(() => { console.log(user) }, [user])

    return (
        <div className="flex w-screen">
            <div className={`fixed top-0 left-0 h-screen bg-gray-800 text-gray-100 rounded-r-lg w-64 z-40 transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className="flex flex-col p-4 h-full w-full">
                    <div
                        className="bg-white bg-opacity-10 py-2 px-3 rounded-lg mb-2 text-center cursor-pointer w-fit self-center group"
                    >
                        <p className="text-lg">{user.nombre}</p>
                        <p className="text-md">{user.tipo}</p>
                        <div className="hidden group-hover:block absolute bg-gray-900 z-20 rounded-lg p-2 w-max min-w-40 -translate-x-1/4">
                            <p>Cédula: {user.cedula}</p>
                            <NegativeButton onClick={handleLogout}>
                                Cerrar sesión
                            </NegativeButton>
                        </div>
                    </div>

                    <ul>
                        {navOptions.map((opt) => (
                            <li key={opt.name}>
                                <SidebarButton route={opt.path}>{opt.name}</SidebarButton>
                            </li>
                        ))}
                    </ul>

                    <div className="justify-self-end mt-auto">
                        <NegativeButton>
                            <Link to={'/'}>
                                <p className="text-white text-lg">Aviso de Error</p>
                            </Link>
                        </NegativeButton>
                    </div>
                </div>
            </div>


            <div className="block lg:hidden fixed bottom-4 right-4 z-50">
                <button
                    className="text-white flex items-center justify-center bg-gray-800 p-3 rounded-full shadow-lg"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <span className="material-icons">menu</span>
                </button>
            </div>

            <div className="flex-1">
                <Outlet />
            </div>
        </div>
    )
}

export default Sidebar
