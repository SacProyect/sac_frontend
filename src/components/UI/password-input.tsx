import { useState } from 'react';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Eye, EyeOff } from 'lucide-react';

export interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  showRequirements?: boolean;
  requirements?: { label: string; met: boolean }[];
}

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  error,
  showRequirements = false,
  requirements = [],
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-slate-300">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`pr-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 ${
            error ? 'border-red-600' : ''
          }`}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300"
          disabled={disabled}
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      
      {showRequirements && requirements.length > 0 && value.length > 0 && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 space-y-1">
          {requirements.map((req) => (
            <div key={req.label} className="flex items-center gap-2">
              {req.met ? (
                <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className={`text-sm ${req.met ? 'text-green-400' : 'text-slate-400'}`}>
                {req.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
