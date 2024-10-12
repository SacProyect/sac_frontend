import React from 'react'
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../utils/api-connection';
import { useAuth } from '../../hooks/useAuth';
import { useEffect } from 'react';

function Login() {
    const { register, handleSubmit, errors } = useForm();
    const navigate = useNavigate();
    const { login, user } = useAuth()

    const validarLogin = async (data) => {
        try {
            const user = await signIn(Number(data.cedula), data.password)
            console.log(user)
            login(user)
        } catch (error) {
            console.error('Error al validar el login:', error);
            alert('Ocurrió un error al intentar iniciar sesión');
        }
    };
    useEffect(() => { if (user) { navigate("/") } }, [user])
    return (
        <div className='bg-slate-100 h-screen w-screen overflow-hidden'>
            <div className='bg-sac_background bg-repeat absolute z-0 pointer-events-none w-screen h-screen' />
            <div className='h-screen flex items-center justify-center'>
                <div className='flex-col bg-white p-10 w-96 rounded-lg shadow-md z-10'>
                    <h2 className="text-black text-2xl font-bold mb-5">Iniciar Sesión</h2>
                    <form onSubmit={handleSubmit(validarLogin)}>
                        <input
                            type="text"
                            {...register('cedula')}
                            placeholder="Usuario"
                            className="w-full text p-2 mb-4 border border-[#ccc] rounded-[4px] bg-slate-50 text-black"
                        />

                        <input
                            type="password"
                            {...register('password')}
                            placeholder="Contraseña"
                            className="w-full p-2 mb-4 border border-[#ccc] rounded-[4px] bg-slate-50 text-black"
                        />

                        <button
                            type="submit"
                            className="w-full p-2 bg-[#007bff] hover:bg-[#0056b3] text-white font-bold rounded-[4px] cursor-pointer"
                        >
                            Login
                        </button>
                    </form>
                </div>
            </div>
        </div >
    );
};

export default Login