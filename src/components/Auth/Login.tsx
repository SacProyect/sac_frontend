/* eslint-disable no-unused-vars */
import React from 'react'
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useEffect } from 'react';
import TextInput from '../UI/TextInput';
import { signIn } from '../utils/api/userFunctions';
import toast from 'react-hot-toast';

function Login() {
    const { register, handleSubmit } = useForm<{ personId: string; password: string }>();
    const navigate = useNavigate();
    const { login, user } = useAuth()!;
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    const validateLogin = async (data: { personId: string; password: string }) => {
        try {

            const response = await signIn(data.personId, data.password);

            const { user, token } = response;

            login(user, token);
            toast.success("¡Inicio de sesión exitoso!")

        } catch (error: any) {
            console.error("Error al validar el login:", error);
            toast.error("Ocurrió un error al intentar iniciar sesión. Verifique sus credenciales.");
        }
    };

    useEffect(() => {
        if (user) {
            navigate(from, { replace: true }); // If the user is already logged in
        }
    }, [user]);

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-slate-100">
            <div className="absolute inset-0 z-0 bg-repeat pointer-events-none bg-sac_background"></div>
            <div className="relative z-10 flex items-center justify-center h-screen">
                <div className="w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-md sm:p-10">
                    <h2 className="mb-6 text-xl font-bold text-center text-black sm:text-2xl">Iniciar Sesión</h2>
                    <form onSubmit={handleSubmit(validateLogin)} className="space-y-4">
                        <TextInput
                            register={{ ...register('personId') }}
                            placeholder="Cédula"
                        />


                        <TextInput
                            type='password'
                            register={{ ...register('password') }}
                            placeholder="Contraseña"
                        />

                        <button
                            type="submit"
                            className="w-full p-3 font-bold text-white transition-all bg-blue-600 rounded-md hover:bg-blue-800"
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
