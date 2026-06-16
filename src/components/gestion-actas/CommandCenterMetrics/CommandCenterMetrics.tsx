import { motion } from 'framer-motion';
import {
    LedgerBlock,
    type LedgerBlockProps,
} from '../shared/LedgerBlock';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';

type Slot = Omit<LedgerBlockProps, 'value'> & {
    /** `data-testid` del bloque individual (ver guide §7.1). */
    testId: string;
};

/**
 * Configuración de los 6 Ledger Blocks del Command Center.
 *
 * Por ahora todos los valores son placeholders `—`; los datos reales
 * llegan en TASK-004a (Actas) y TASK-005a (Expedientes). Ver guía §3.3.1
 * para el mapeo fuente → bloque.
 */
const SLOTS: Slot[] = [
    {
        testId: 'gestion-actas-ledger-actas-totales',
        label: 'Actas totales',
        hint: 'Actualizando...',
    },
    {
        testId: 'gestion-actas-ledger-expedientes-asignados',
        label: 'Expedientes asignados',
    },
    {
        testId: 'gestion-actas-ledger-culminados',
        label: 'Σ Culminados',
        tone: 'positive',
    },
    {
        testId: 'gestion-actas-ledger-en-proceso',
        label: 'Σ En proceso',
        tone: 'warning',
    },
    {
        testId: 'gestion-actas-ledger-anulados',
        label: 'Σ Anulados',
        tone: 'warning',
    },
    {
        testId: 'gestion-actas-ledger-monto-total',
        label: 'Monto total reparos',
    },
];

/**
 * CommandCenterMetrics — fila de 6 Ledger Blocks globales (guide §3.3).
 *
 * Layout responsive: 1 col móvil, 2 cols tablet, 3 cols laptop, 6 cols desktop.
 * Stagger de entrada con framer-motion respetando `prefers-reduced-motion`.
 */
export function CommandCenterMetrics() {
    const reducedMotion = usePrefersReducedMotion();

    return (
        <div
            data-testid="gestion-actas-ledger"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
        >
            {SLOTS.map((slot, i) => (
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
                        value="—"
                        tone={slot.tone}
                        hint={slot.hint}
                        data-testid={slot.testId}
                    />
                </motion.div>
            ))}
        </div>
    );
}
