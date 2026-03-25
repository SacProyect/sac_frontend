import React from 'react';
import { Loader2 } from 'lucide-react';

interface GlobalLoaderProps {
  message?: string;
  className?: string;
  overlay?: boolean;
}

/**
 * GlobalLoader - Componente de carga universal premium.
 * 
 * Se utiliza para transiciones de página, esperas de API y cargas de componentes lazy.
 * Utiliza efectos de desenfoque y animaciones suaves para una UX premium.
 */
export const GlobalLoader: React.FC<GlobalLoaderProps> = ({ 
  message = 'Cargando datos...', 
  className = '',
  overlay = true 
}) => {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 text-center z-[9999] p-6 ${className}`}>
      <div className="relative flex items-center justify-center">
        <Loader2 className="h-8 w-8 sm:h-9 sm:w-9 animate-spin text-slate-400" />
      </div>
      
      <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 tracking-[0.18em] sm:tracking-[0.2em] uppercase leading-relaxed max-w-[240px] mt-1">
        {message}
      </p>
    </div>
  );

  if (!overlay) return content;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#020617]/80 transition-all duration-300">
      {content}
    </div>
  );
};

export default GlobalLoader;
