import React from 'react'
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useEffect } from 'react';
import TextInput from '../UI/TextInput';
import { signIn } from '../utils/api/userFunctions';

function Login() {
    const { register, handleSubmit } = useForm();
    const navigate = useNavigate();
    const { login, user } = useAuth();

    const validarLogin = async (data) => {
        try {
            const { user, token } = await signIn(Number(data.cedula), data.password);
            login(user, token);
        } catch (error) {
            console.error('Error al validar el login:', error);
            alert('Ocurrió un error al intentar iniciar sesión');
        }
    };

    useEffect(() => {
        if (user) {
            navigate("/");
        }
    }, [user]);

    return (
        <div className="bg-slate-100 h-screen w-screen overflow-hidden relative">
            <div className="bg-sac_background bg-repeat absolute inset-0 z-0 pointer-events-none"></div>
            <div className="h-screen flex items-center justify-center relative z-10">
                <div className="bg-white p-6 sm:p-10 w-full max-w-md rounded-lg shadow-md mx-4">
                    <h2 className="text-black text-xl sm:text-2xl font-bold mb-6 text-center">Iniciar Sesión</h2>
                    <form onSubmit={handleSubmit(validarLogin)} className="space-y-4">
                        <TextInput
                            register={{ ...register('cedula') }}
                            placeholder="Cédula"
                            className="w-full"
                        />

                        <TextInput
                            type="password"
                            register={{ ...register('password') }}
                            placeholder="Contraseña"
                            className="w-full"
                        />

                        <button
                            type="submit"
                            className="w-full p-3 bg-blue-600 hover:bg-blue-800 text-white font-bold rounded-md transition-all"
                        >
                            Login
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;
