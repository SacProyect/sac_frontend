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
    <div className={`space-y-2 sm:space-y-3 min-w-0 w-full ${className}`}>
      {backTo && <BackButton to={backTo} hideLabelOnMobile />}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 min-w-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-tight break-words">
            {title}
          </h1>
          {description && (
            <p className="text-sm sm:text-base text-muted-foreground mt-1.5 sm:mt-2 break-words">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="flex w-full sm:w-auto shrink-0 flex-wrap items-stretch sm:items-center gap-2 [&_button]:w-full sm:[&_button]:w-auto">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
