/* eslint-disable no-unused-vars */
import React from 'react'
import { useForm } from 'react-hook-form';
<<<<<<< HEAD
import { useLocation, useNavigate } from 'react-router-dom';
=======
import { useNavigate } from 'react-router-dom';
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
import { useAuth } from '../../hooks/useAuth';
import { useEffect } from 'react';
import TextInput from '../UI/TextInput';
import { signIn } from '../utils/api/userFunctions';
<<<<<<< HEAD
import toast from 'react-hot-toast';
=======
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)

function Login() {
    const { register, handleSubmit } = useForm<{ personId: string; password: string }>();
    const navigate = useNavigate();
    const { login, user } = useAuth()!;
<<<<<<< HEAD
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    const validateLogin = async (data: { personId: string; password: string }) => {
        try {

            const response = await signIn(data.personId, data.password);

            const { user, token } = response;

            login(user, token);
            toast.success("¡Inicio de sesión exitoso!")

        } catch (error: any) {
            console.error(error);
            toast.error("Ocurrió un error al intentar iniciar sesión. Verifique sus credenciales.");
=======

    const validateLogin = async (data: { personId: string; password: string }) => {
        try {

            const response = await signIn(data.personId, data.password);

            
            const { user, token } = response;

            login(user, token);
        } catch (error) {
            console.error("Error al validar el login:", error);
            alert("Ocurrió un error al intentar iniciar sesión. Verifique sus credenciales.");
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
        }
    };

    useEffect(() => {
        if (user) {
<<<<<<< HEAD
            navigate(from, { replace: true }); // If the user is already logged in
=======
            navigate("/");
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
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
<<<<<<< HEAD
                        />


                        <TextInput
                            type='password'
                            register={{ ...register('password') }}
                            placeholder="Contraseña"
=======
                        // className="w-full"
                        />


                        <TextInput
                            type='password'
                            register={{ ...register('password') }}
                            placeholder="Contraseña"
                        // className="w-full"
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
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
