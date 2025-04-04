import { useAuth } from '@/hooks/useAuth'
import React from 'react'
import { useNavigate } from 'react-router-dom';


function ContributionsHeader() {
    const { user } = useAuth()
    const navigate = useNavigate()

    if (!user) {
        navigate("/login")
        return null;
    }



    return (
        <header className='w-full'>
            <div className='pt-8 pl-8'>
                <h1 className='text-2xl font-semibold'>Estadísticas de grupo</h1>
                {user.role === "ADMIN" &&
                    <div className=''> 
                        <p>Seleccione un grupo para ver sus estadísticas.</p>
                    </div>
                }
            </div>
        </header>
    )
}

export default ContributionsHeader