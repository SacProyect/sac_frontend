import { Info, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/UI/button';

type Props = {
    title: string;
    description: string;
    linkTo: string;
    linkLabel: string;
    dismissableSession?: boolean;
};

/**
 * Banner de deprecación — TASK-006.
 *
 * Se muestra en la página legacy (`/gestion-personal`) solo cuando el feature
 * flag `isActasExpedientesEnabled` está en `true`. Sirve para que los admins
 * descubran la nueva página `/gestion-actas` y migren durante la ventana de
 * coexistencia.
 *
 * El estado de "cerrado" se guarda en `sessionStorage` (no en localStorage)
 * para que el banner reaparezca en cada sesión nueva — el objetivo es
 * recordatorio continuo hasta la fecha de sunset, no un descarte permanente.
 */
export function DeprecationBanner({
    title,
    description,
    linkTo,
    linkLabel,
    dismissableSession = true,
}: Props) {
    const DISMISS_KEY = 'gestion-actas:deprecation-banner-dismissed';
    const [dismissed, setDismissed] = useState(() => {
        if (!dismissableSession) return false;
        try {
            return sessionStorage.getItem(DISMISS_KEY) === 'true';
        } catch {
            return false;
        }
    });

    if (dismissed) return null;

    const handleDismiss = () => {
        try {
            sessionStorage.setItem(DISMISS_KEY, 'true');
        } catch {
            /* sessionStorage puede no estar disponible (modo incógnito estricto) */
        }
        setDismissed(true);
    };

    return (
        <div
            data-testid="deprecation-banner"
            role="status"
            className="border border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 rounded-md px-4 py-3 flex items-start gap-3"
        >
            <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs mt-0.5 leading-relaxed">{description}</p>
                <Link
                    to={linkTo}
                    className="text-xs font-medium underline underline-offset-2 mt-1 inline-block"
                    data-testid="deprecation-banner-link"
                >
                    {linkLabel} →
                </Link>
            </div>
            {dismissableSession && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="h-6 w-6 p-0"
                    data-testid="deprecation-banner-dismiss"
                    aria-label="Cerrar aviso"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
