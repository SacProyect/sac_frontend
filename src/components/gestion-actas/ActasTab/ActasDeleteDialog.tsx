import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/UI/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/UI/dialog';
import { adminDeleteReparoActa } from '@/components/utils/api/fiscal-operaciones-functions';
import type { ActaReparo } from './types';

/* -------------------------------------------------------------------------- */
/* Props                                                                      */
/* -------------------------------------------------------------------------- */

type Props = {
    /** Fila a eliminar. Se ignora cuando `open === false`. */
    row: ActaReparo | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Callback invocado tras un delete exitoso para refrescar la tabla. */
    onDeleted: () => void;
};

/* -------------------------------------------------------------------------- */
/* Componente público                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Dialog de confirmación de borrado de un Acta de Reparo.
 *
 * EARS:
 *  - `WHEN the user clicks actas-delete-{id}` → open this dialog
 *    pre-poblado con los datos de la fila.
 *  - `IF the user confirms` → llama `adminDeleteReparoActa(row.id)`,
 *    muestra toast de éxito y cierra + refresca.
 *  - `IF the delete fails` → mantiene el dialog abierto y muestra toast
 *    de error (no se descarta la acción para que el usuario pueda
 *    reintentar).
 */
export function ActasDeleteDialog({ row, open, onOpenChange, onDeleted }: Props) {
    const [submitting, setSubmitting] = useState(false);

    function handleOpenChange(next: boolean) {
        if (submitting) return; // no permitir cerrar mientras se procesa
        onOpenChange(next);
    }

    async function handleConfirm() {
        if (!row) return;
        setSubmitting(true);
        try {
            await adminDeleteReparoActa(row.id);
            toast.success('Acta eliminada.');
            onOpenChange(false);
            onDeleted();
        } catch (e) {
            const msg = extractMessage(e, 'No se pudo eliminar el acta.');
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="bg-card border-border text-card-foreground max-w-md"
                data-testid="actas-delete-dialog"
            >
                <DialogHeader>
                    <DialogTitle>Eliminar acta de reparo</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Esta acción no se puede deshacer. Se elimina el registro
                        del acta y su enlace al PDF.
                    </DialogDescription>
                </DialogHeader>
                {row && (
                    <div className="py-2 text-sm">
                        <p className="text-foreground">
                            ¿Eliminar el acta de{' '}
                            <strong className="font-semibold">{row.contribuyente}</strong>
                            {row.rif ? (
                                <>
                                    {' '}
                                    (<span className="font-mono">{row.rif}</span>)
                                </>
                            ) : null}
                            ?
                        </p>
                        {row.numeroReparo && (
                            <p className="text-xs text-muted-foreground mt-1">
                                N.º reparo: <span className="font-mono">{row.numeroReparo}</span>
                            </p>
                        )}
                    </div>
                )}
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={submitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => void handleConfirm()}
                        disabled={submitting}
                        data-testid="actas-delete-confirm"
                        aria-busy={submitting}
                    >
                        <Trash2
                            className={`h-4 w-4 ${submitting ? 'animate-pulse' : ''}`}
                            aria-hidden="true"
                        />
                        {submitting ? 'Eliminando…' : 'Eliminar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Extrae un mensaje legible de un error desconocido. */
function extractMessage(e: unknown, fallback: string): string {
    if (e instanceof Error) return e.message;
    if (typeof e === 'object' && e !== null) {
        const maybe = (e as { response?: { data?: { error?: string } } }).response?.data
            ?.error;
        if (typeof maybe === 'string') return maybe;
    }
    return fallback;
}
