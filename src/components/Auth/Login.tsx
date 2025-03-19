/* eslint-disable no-unused-vars */
import React from 'react'
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useEffect } from 'react';
import TextInput from '../UI/TextInput';
import { signIn } from '../utils/api/userFunctions';

function Login() {
    const { register, handleSubmit } = useForm<{ personId: string; password: string }>();
    const navigate = useNavigate();
    const { login, user } = useAuth()!;

    const validateLogin = async (data: { personId: string; password: string }) => {
        try {

            const response = await signIn(data.personId, data.password);

            
            const { user, token } = response;

            login(user, token);
        } catch (error) {
            console.error("Error al validar el login:", error);
            alert("Ocurrió un error al intentar iniciar sesión. Verifique sus credenciales.");
        }
    };

    useEffect(() => {
        if (user) {
            navigate("/");
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
                        // className="w-full"
                        />

                        <TextInput
                            type='password'
                            register={{ ...register('password') }}
                            placeholder="Contraseña"
                        // className="w-full"
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
