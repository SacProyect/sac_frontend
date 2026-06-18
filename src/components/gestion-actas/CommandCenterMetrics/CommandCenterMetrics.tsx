import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    LedgerBlock,
    type LedgerBlockProps,
} from '../shared/LedgerBlock';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';
import { getReparosStats, type ReparosStats } from '@/components/utils/api/notifications-functions';
import { formatCurrency } from '@/components/utils/format-currency';

type Slot = Omit<LedgerBlockProps, 'value' | 'hint'> & {
    /** `data-testid` del bloque individual (ver guide §7.1). */
    testId: string;
    /** Hint por defecto cuando no hay datos (placeholder/loading). */
    defaultHint?: string;
    /** Selector del valor desde el payload de stats. */
    pick: (s: ReparosStats) => string | number;
    /** Formateador opcional del valor. */
    format?: (raw: number) => string;
};

const SLOTS: Slot[] = [
    {
        testId: 'gestion-actas-ledger-actas-totales',
        label: 'Actas totales',
        defaultHint: 'Actualizando...',
        pick: (s) => s.actasTotales,
    },
    {
        testId: 'gestion-actas-ledger-expedientes-asignados',
        label: 'Expedientes asignados',
        pick: (s) => s.expedientesAsignados,
    },
    {
        testId: 'gestion-actas-ledger-culminados',
        label: 'Σ Culminados',
        tone: 'positive',
        pick: (s) => s.culminados,
    },
    {
        testId: 'gestion-actas-ledger-en-proceso',
        label: 'Σ En proceso',
        tone: 'warning',
        pick: (s) => s.enProceso,
    },
    {
        testId: 'gestion-actas-ledger-anulados',
        label: 'Σ Anulados',
        tone: 'warning',
        pick: (s) => s.anulados,
    },
    {
        testId: 'gestion-actas-ledger-monto-total',
        label: 'Monto total reparos',
        pick: (s) => s.montoTotalReparos,
        format: (n) => formatCurrency(n),
    },
];

/**
 * CommandCenterMetrics — fila de 6 Ledger Blocks globales (guide §3.3).
 *
 * Carga `GET /notifications/stats` y mapea cada slot a su campo.
 * Estados:
 *  - loading: muestra `—` con hint "Actualizando..." (excepto el primero
 *    que mantiene el hint por defecto).
 *  - error:   muestra `—` con hint del mensaje de error.
 *  - data:    muestra el valor formateado.
 */
export function CommandCenterMetrics() {
    const reducedMotion = usePrefersReducedMotion();

    const [stats, setStats] = useState<ReparosStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getReparosStats();
                if (!cancelled) {
                    setStats(data);
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : 'Error desconocido');
                    setStats(null);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div
            data-testid="gestion-actas-ledger"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
        >
            {SLOTS.map((slot, i) => {
                const raw = stats != null ? slot.pick(stats) : null;
                const value = loading || raw == null ? '—' : slot.format ? slot.format(Number(raw)) : raw;
                const hint = error
                    ? error
                    : loading
                        ? slot.defaultHint ?? 'Actualizando...'
                        : undefined;

                return (
                    <motion.div
                        key={slot.testId}
                        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={
                            reducedMotion
                                ? { duration: 0 }
                                : {
                                    duration: 0.18,
                                    delay: i * 0.04,
                                    ease: [0.16, 1, 0.3, 1],
                                }
                        }
                    >
                        <LedgerBlock
                            label={slot.label}
                            value={value}
                            tone={slot.tone}
                            hint={hint}
                            data-testid={slot.testId}
                        />
                    </motion.div>
                );
            })}
        </div>
    );
}
