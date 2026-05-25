import { ReactNode } from 'react';
import { BackButton } from '@/components/UI/v2/back-button';

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Si se provee, renderiza un BackButton sobre el título que navega a esta ruta */
  backTo?: string;
  className?: string;
}

/**
 * PageHeader - Header de página reutilizable para V2
 *
 * Estructura:
 *   [BackButton ← Volver]         ← opcional, vía prop `backTo`
 *   [Título + Descripción] [Acción]
 */
export function PageHeader({
  title,
  description,
  action,
  backTo,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {backTo && <BackButton to={backTo} hideLabelOnMobile />}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          {description && <p className="text-muted-foreground mt-2">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
