import { useState } from 'react';
import { Card } from '@/components/UI/card';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiConnection } from '@/components/utils/api/apiConnection';
import toast from 'react-hot-toast';

export function SecurityTabV2() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const passwordRequirements = [
    { label: 'Mínimo 8 caracteres', met: newPassword.length >= 8 },
    { label: 'Al menos un número', met: /\d/.test(newPassword) },
    { label: 'Al menos una mayúscula', met: /[A-Z]/.test(newPassword) },
    { label: 'Al menos un carácter especial', met: /[!@#$%^&*]/.test(newPassword) },
  ];

  const allRequirementsMet = passwordRequirements.every((req) => req.met);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (!allRequirementsMet) {
      toast.error('La nueva contraseña no cumple con los requisitos');
      return;
    }

    if (!passwordsMatch) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setIsSubmitting(true);

    try {
      // Llamar API para cambiar contraseña
      // Nota: La API actual requiere el ID del usuario y solo la nueva contraseña
      // Si necesitas validar la contraseña actual, necesitarías un endpoint diferente
      const response = await apiConnection.patch(`/user/update-password/${user?.id}`, {
        password: newPassword,
      });

      if (response.status === 200) {
        setSuccessMessage('Contraseña actualizada exitosamente');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast.success('Contraseña actualizada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error: any) {
      console.error('Error cambiando contraseña:', error);
      toast.error(error.response?.data?.error || 'Error al actualizar la contraseña');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700 p-6 space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Cambiar Contraseña</h3>
        <p className="text-slate-400 text-sm">
          Actualiza tu contraseña regularmente para mantener tu cuenta segura
        </p>
      </div>

      <form onSubmit={handleChangePassword} className="space-y-6">
        {/* Current Password */}
        <div className="space-y-2">
          <Label htmlFor="current-password" className="text-slate-300">
            Contraseña Actual
          </Label>
          <div className="relative">
            <Input
              id="current-password"
              type={showPasswords.current ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Ingresa tu contraseña actual"
              className="pr-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() =>
                setShowPasswords({ ...showPasswords, current: !showPasswords.current })
              }
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300"
              disabled={isSubmitting}
            >
              {showPasswords.current ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <Label htmlFor="new-password" className="text-slate-300">
            Contraseña Nueva
          </Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPasswords.new ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Ingresa una contraseña nueva"
              className="pr-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() =>
                setShowPasswords({ ...showPasswords, new: !showPasswords.new })
              }
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300"
              disabled={isSubmitting}
            >
              {showPasswords.new ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Password Requirements */}
        {newPassword.length > 0 && (
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-slate-300">Requisitos de contraseña:</p>
            {passwordRequirements.map((req) => (
              <div key={req.label} className="flex items-center gap-2">
                {req.met ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <X className="h-4 w-4 text-red-400" />
                )}
                <span
                  className={`text-sm ${
                    req.met ? 'text-green-400' : 'text-slate-400'
                  }`}
                >
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-slate-300">
            Confirmar Contraseña
          </Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirma tu nueva contraseña"
              className={`pr-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 ${
                confirmPassword.length > 0 && !passwordsMatch ? 'border-red-600' : ''
              }`}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() =>
                setShowPasswords({
                  ...showPasswords,
                  confirm: !showPasswords.confirm,
                })
              }
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300"
              disabled={isSubmitting}
            >
              {showPasswords.confirm ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-xs text-red-400">Las contraseñas no coinciden</p>
          )}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
            <p className="text-green-400 text-sm">{successMessage}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={
              !currentPassword ||
              !newPassword ||
              !confirmPassword ||
              !allRequirementsMet ||
              !passwordsMatch ||
              isSubmitting
            }
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isSubmitting ? 'Actualizando...' : 'Actualizar Contraseña'}
          </Button>
        </div>
      </form>

      {/* Security Info */}
      <div className="border-t border-slate-700 pt-6 bg-slate-900 rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-semibold text-slate-300">Recomendaciones de seguridad:</h4>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• Usa una contraseña única que no uses en otras cuentas</li>
          <li>• Cambiar tu contraseña cada 90 días</li>
          <li>• Evita usar información personal predecible</li>
          <li>• Nunca compartas tu contraseña con nadie</li>
        </ul>
      </div>
    </Card>
  );
}
