import  { useState, useEffect } from 'react'
import SidebarButton from './SidebarButton'
import { useAuth } from '../../hooks/useAuth'
import NegativeButton from '../UI/NegativeButton'
import { Link } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

function Sidebar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate();


    if (!user) {
        navigate("/login");
        return null;
    }

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const navOptions = user.role !== "ADMIN" ? [
        { name: 'Inicio', path: '/' },
        { name: 'Contribuyentes', path: '/taxpayer' },
        { name: 'Avisos', path: '/warning' },
        { name: 'Multas', path: '/fine' },
        { name: 'Pagos', path: '/payment' },
        { name: 'Compromisos de pagos', path: '/payment_compromise' }
    ] : [
        { name: 'Inicio', path: '/' },
        { name: 'Contribuyentes', path: '/taxpayer' },
        { name: 'Avisos', path: '/warning' },
        { name: 'Multas', path: '/fine' },
        { name: 'Pagos', path: '/payment' },
        { name: 'Compromisos de pagos', path: '/payment_compromise' },
        { name: "Estadísticas", path: "/" }
    ]

    const handleLogout = () => {
        logout()
    }

    useEffect(() => { console.log(user) }, [user])

    return (
        <div className="flex w-screen">
            <div className={`fixed top-0 left-0 h-screen bg-gray-800 text-gray-100 rounded-r-lg w-64 z-40 transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className="flex flex-col w-full h-full p-4">
                    <div
                        className="self-center px-3 py-2 mb-2 text-center bg-white rounded-lg cursor-pointer bg-opacity-10 w-fit group"
                    >
                        <p className="text-lg">{user.name}</p>
                        <p className="text-md">{user.role}</p>
                        <div className="absolute z-20 hidden p-2 bg-gray-900 rounded-lg group-hover:block w-max min-w-40 -translate-x-1/4">
                            <p>Cédula: {user.personId}</p>
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

                    <div className="mt-auto justify-self-end">
                        <NegativeButton onClick={() => {}}>
                            <Link to={'/'}>
                                <p className="text-lg text-white">Aviso de Error</p>
                            </Link>
                        </NegativeButton>
                    </div>
                </div>
            </div>


            <div className="fixed z-50 block lg:hidden bottom-4 right-4">
                <button
                    className="flex items-center justify-center p-3 text-white bg-gray-800 rounded-full shadow-lg"
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
