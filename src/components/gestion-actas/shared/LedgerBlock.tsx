import { cn } from '@/lib/utils';

/**
 * LedgerBlock — bloque de métrica aislado (token del system.md §"The Ledger Block").
 *
 * Replica la superficie plana del system: sin shadow, borde sutil, etiqueta
 * uppercase + número tabular. Los tonos (`tone`) se mapean a clases que ya
 * existen en el design system (no introducen tokens nuevos).
 *
 * Se renderiza dentro de una grid responsive en `CommandCenterMetrics`,
 * pero el componente no conoce ni la grid ni el layout de la página.
 */
export type LedgerBlockTone = 'neutral' | 'positive' | 'warning' | 'critical';

export type LedgerBlockProps = {
    /** Etiqueta visible arriba. Se renderiza como `uppercase tracking-wide`. */
    label: string;
    /** Valor principal. Admite string (placeholders `—`) o número. */
    value: string | number;
    /** Texto pequeño debajo del valor (ej. "vs. mes anterior: +12%"). */
    hint?: string;
    /** Tono semántico del número. Default: `neutral` (foreground). */
    tone?: LedgerBlockTone;
    /** Ícono lucide-react opcional, mostrado junto a la etiqueta. */
    icon?: React.ReactNode;
    /** `data-testid` opcional para E2E (lo fija `CommandCenterMetrics`). */
    'data-testid'?: string;
    /** Clases extra para variantes específicas (p. ej. `font-mono` en monto). */
    className?: string;
};

const TONE_VALUE_CLASS: Record<LedgerBlockTone, string> = {
    neutral: 'text-foreground',
    positive: 'text-emerald-700 dark:text-emerald-400',
    warning: 'text-amber-700 dark:text-amber-400',
    critical: 'text-red-700 dark:text-red-400',
};

const TONE_TOP_BORDER: Record<LedgerBlockTone, string> = {
    neutral: 'border-t-2 border-t-slate-300 dark:border-t-slate-600',
    positive: 'border-t-2 border-t-emerald-500',
    warning: 'border-t-2 border-t-amber-500',
    critical: 'border-t-2 border-t-red-500',
};

export function LedgerBlock({
    label,
    value,
    hint,
    tone = 'neutral',
    icon,
    className,
    'data-testid': dataTestId,
}: LedgerBlockProps) {
    return (
        <div
            data-testid={dataTestId}
            className={cn(
                'bg-muted/30 border border-border/60 rounded-md py-4 px-5',
                'flex flex-col gap-1',
                'hover:bg-muted/50 transition-colors',
                TONE_TOP_BORDER[tone],
                className,
            )}
        >
            <div className="flex items-center gap-1.5">
                {icon ? (
                    <span className="text-muted-foreground flex items-center" aria-hidden="true">
                        {icon}
                    </span>
                ) : null}
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                    {label}
                </span>
            </div>
            <p
                className={cn(
                    'text-4xl font-bold tabular-nums tracking-tight',
                    TONE_VALUE_CLASS[tone],
                )}
            >
                {value}
            </p>
            {hint ? (
                <p className="text-[11px] text-muted-foreground">{hint}</p>
            ) : null}
        </div>
    );
}
