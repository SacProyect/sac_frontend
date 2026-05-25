import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/UI/button';
import { ArrowLeft } from 'lucide-react';

export interface BackButtonProps {
  to?: string;
  label?: string;
  /** Oculta la etiqueta de texto en móviles (visible sólo a partir de sm) */
  hideLabelOnMobile?: boolean;
  className?: string;
}

/**
 * BackButton - Botón de volver reutilizable para V2
 *
 * - Touch target mínimo de 44×44px para accesibilidad móvil
 * - Icono más grande en móvil (20px) y estándar en desktop (16px)
 * - Opción de ocultar label en móvil via `hideLabelOnMobile`
 */
export function BackButton({
  to,
  label = 'Volver',
  hideLabelOnMobile = false,
  className = '',
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      className={`
        min-h-[44px] min-w-[44px]
        text-slate-300 hover:text-white
        ${className}
      `}
    >
      <ArrowLeft className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
      <span className={hideLabelOnMobile ? 'hidden sm:inline ml-2' : 'ml-2'}>
        {label}
      </span>
    </Button>
  );
}
