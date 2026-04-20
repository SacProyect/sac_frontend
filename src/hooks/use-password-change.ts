import { useState, useCallback } from 'react';
import { apiConnection } from '@/components/utils/api/api-connection';
import toast from 'react-hot-toast';

export interface PasswordChangePayload {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

export interface UsePasswordChangeReturn {
  changePassword: (userId: string, payload: PasswordChangePayload) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export interface PasswordRequirements {
  label: string;
  met: boolean;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirements[] = [
  { label: 'Mínimo 8 caracteres', met: false },
  { label: 'Al menos un número', met: false },
  { label: 'Al menos una mayúscula', met: false },
  { label: 'Al menos un carácter especial', met: false },
];

export const validatePassword = (password: string): PasswordRequirements[] => {
  return [
    { label: 'Mínimo 8 caracteres', met: password.length >= 8 },
    { label: 'Al menos un número', met: /\d/.test(password) },
    { label: 'Al menos una mayúscula', met: /[A-Z]/.test(password) },
    { label: 'Al menos un carácter especial', met: /[!@#$%^&*]/.test(password) },
  ];
};

export const checkAllRequirementsMet = (requirements: PasswordRequirements[]): boolean => {
  return requirements.every((req) => req.met);
};

export const usePasswordChange = (): UsePasswordChangeReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changePassword = useCallback(
    async (userId: string, payload: PasswordChangePayload): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiConnection.put(`/user/update-password/${userId}`, {
          currentPassword: payload.currentPassword,
          password: payload.password,
          confirmPassword: payload.confirmPassword,
        });

        if (response.status === 200) {
          toast.success('Contraseña actualizada exitosamente');
          return true;
        }
        return false;
      } catch (err: any) {
        const errorData = err.response?.data;

        if (err.response?.status === 401) {
          const errorMessage = errorData?.error || 'La contraseña actual es incorrecta';
          setError(errorMessage);
          toast.error(errorMessage);
        } else if (err.response?.status === 400) {
          if (errorData?.details) {
            const firstError = Object.values(errorData.details)[0];
            const errorMessage = Array.isArray(firstError) ? firstError[0] : 'Validación fallida';
            setError(errorMessage);
            toast.error(errorMessage);
          } else {
            const errorMessage = errorData?.error || 'Error de validación';
            setError(errorMessage);
            toast.error(errorMessage);
          }
        } else if (err.response?.status === 404) {
          const errorMessage = 'Usuario no encontrado';
          setError(errorMessage);
          toast.error(errorMessage);
        } else {
          const errorMessage = errorData?.error || 'Error al actualizar la contraseña';
          setError(errorMessage);
          toast.error(errorMessage);
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    changePassword,
    isLoading,
    error,
  };
};
