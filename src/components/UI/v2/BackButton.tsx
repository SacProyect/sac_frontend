import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/UI/button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

/**
 * BackButton - Botón de volver reutilizable para V2
 */
export function BackButton({
  to,
  label = 'Volver',
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
      className={`text-slate-300 hover:text-white ${className}`}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
}
