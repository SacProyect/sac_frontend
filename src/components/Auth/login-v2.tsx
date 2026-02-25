import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { signIn } from '../utils/api/user-functions';
import toast from 'react-hot-toast';

/**
 * LoginV2 - Componente de Login con diseño Shadcn UI v2.0
 * Basado en V0_reference/app/auth/login/page.tsx
 */
export default function LoginV2() {
  const { register, handleSubmit, formState: { errors } } = useForm<{ personId: string; password: string }>();
  const navigate = useNavigate();
  const { login, user } = useAuth()!;
  const location = useLocation();
  const from = location.state?.from?.pathname || "/v2/admin";
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateLogin = async (data: { personId: string; password: string }) => {
    setError('');
    setIsLoading(true);

    if (!data.personId || !data.password) {
      setError('Por favor complete todos los campos');
      setIsLoading(false);
      return;
    }

    if (data.personId.length < 5) {
      setError('Cédula inválida');
      setIsLoading(false);
      return;
    }

    try {
      const response = await signIn(data.personId, data.password);
      const { user, token } = response;
      login(user, token);
      toast.success("¡Inicio de sesión exitoso!");
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error(error);
      setError("Ocurrió un error al intentar iniciar sesión. Verifique sus credenciales.");
      toast.error("Ocurrió un error al intentar iniciar sesión. Verifique sus credenciales.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 flex-col items-center justify-center p-12">
        <div className="text-center max-w-md">
          <div className="mb-8 flex justify-center">
            <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-3xl font-bold text-white">S.A.C</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Sistema de Administración</h1>
          <p className="text-blue-200 text-lg mb-8">Gestión integral de administración fiscal y contribuyentes</p>
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
              <div>
                <p className="text-white font-semibold">Seguridad Enterprise</p>
                <p className="text-blue-300 text-sm">Autenticación segura y cifrada</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
              <div>
                <p className="text-white font-semibold">Gestión Centralizada</p>
                <p className="text-blue-300 text-sm">Administra contribuyentes y reportes en un solo lugar</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
              <div>
                <p className="text-white font-semibold">Análisis Avanzados</p>
                <p className="text-blue-300 text-sm">Reportes y estadísticas en tiempo real</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full min-h-screen lg:min-h-0 lg:w-1/2 bg-slate-950 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Bienvenido de nuevo</h2>
            <p className="text-slate-400">Inicia sesión para acceder al sistema</p>
          </div>

          <form onSubmit={handleSubmit(validateLogin)} className="space-y-6">
            {/* Cédula Input */}
            <div className="space-y-2">
              <Label htmlFor="personId" className="text-slate-300">
                Cédula de Identidad
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                <Input
                  id="personId"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej: 12345678"
                  {...register('personId', {
                    required: 'La cédula es requerida',
                    minLength: { value: 5, message: 'Cédula inválida' }
                  })}
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>
              {errors.personId && (
                <p className="text-red-400 text-xs">{errors.personId.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingresa tu contraseña"
                  {...register('password', {
                    required: 'La contraseña es requerida'
                  })}
                  className="pl-10 pr-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 min-w-[44px] min-h-[44px] -m-1 flex items-center justify-center text-slate-500 hover:text-slate-300 touch-manipulation"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs">{errors.password.message}</p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold min-h-[48px] touch-manipulation"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center">
            <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
              ¿Olvidó su contraseña?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
