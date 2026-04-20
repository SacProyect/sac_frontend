import { useState, useMemo } from 'react';
import { Card } from '@/components/UI/card';
import { Button } from '@/components/UI/button';
import { PasswordInput } from '@/components/UI/password-input';
import {
  usePasswordChange,
  validatePassword,
  checkAllRequirementsMet,
} from '@/hooks/use-password-change';
import { useAuth } from '@/hooks/use-auth';

export function SecurityTabV2() {
  const { user } = useAuth();
  const { changePassword, isLoading } = usePasswordChange();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Validate password requirements
  const passwordRequirements = useMemo(() => validatePassword(newPassword), [newPassword]);
  const allRequirementsMet = useMemo(
    () => checkAllRequirementsMet(passwordRequirements),
    [passwordRequirements]
  );
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    // Client-side validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return;
    }

    if (!allRequirementsMet) {
      return;
    }

    if (!passwordsMatch) {
      return;
    }

    if (!user?.id) {
      return;
    }

    // Call the API
    const success = await changePassword(user.id, {
      currentPassword,
      password: newPassword,
      confirmPassword,
    });

    if (success) {
      setSuccessMessage('Contraseña actualizada exitosamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const isFormValid =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    allRequirementsMet &&
    passwordsMatch;

  return (
    <Card className="bg-slate-800 border-slate-700 p-6 space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Cambiar Contraseña</h3>
        <p className="text-slate-400 text-sm">
          Actualiza tu contraseña regularmente para mantener tu cuenta segura
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <PasswordInput
          id="current-password"
          label="Contraseña Actual"
          value={currentPassword}
          onChange={setCurrentPassword}
          placeholder="Ingresa tu contraseña actual"
          disabled={isLoading}
        />

        <PasswordInput
          id="new-password"
          label="Contraseña Nueva"
          value={newPassword}
          onChange={setNewPassword}
          placeholder="Ingresa una contraseña nueva"
          disabled={isLoading}
          showRequirements={newPassword.length > 0}
          requirements={passwordRequirements}
        />

        <PasswordInput
          id="confirm-password"
          label="Confirmar Contraseña"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Confirma tu nueva contraseña"
          disabled={isLoading}
          error={confirmPassword.length > 0 && !passwordsMatch ? 'Las contraseñas no coinciden' : undefined}
        />

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
            disabled={!isFormValid || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-w-[180px]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Actualizando...
              </span>
            ) : (
              'Actualizar Contraseña'
            )}
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
