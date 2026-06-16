import { useEffect, useState } from 'react';
import { Link2 } from 'lucide-react';
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
import { Label } from '@/components/UI/label';
import { Textarea } from '@/components/UI/textarea';
import { createOperativoVincularReparo } from '@/components/utils/api/fiscal-operaciones-functions';
import { extractMessage } from '../shared/utils';
import type { ActaReparo } from './types';

/* -------------------------------------------------------------------------- */
/* Props                                                                      */
/* -------------------------------------------------------------------------- */

type Props = {
    /** Fila a vincular. Se ignora cuando `open === false`. */
    row: ActaReparo | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Callback invocado tras una vinculación exitosa. */
    onLinked: () => void;
};

/* -------------------------------------------------------------------------- */
/* Componente público                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Dialog de vinculación de un Acta de Reparo a un operativo.
 *
 * EARS:
 *  - `WHEN the user clicks actas-link-{id}` (solo si `!row.vinculadoAOperativo`)
 *    → open this dialog con un preview de la fila.
 *  - El usuario puede opcionalmente agregar notas.
 *  - `WHEN the user confirms` → llama `createOperativoVincularReparo({
 *    repairReportId, notas: notas.trim() || null })`, muestra toast y
 *    cierra + refresca.
 *  - `IF the link fails` → mantiene el dialog abierto y muestra toast.
 */
export function ActasLinkDialog({ row, open, onOpenChange, onLinked }: Props) {
    const [notas, setNotas] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Reset del textarea cada vez que se abre el dialog con una fila nueva.
    useEffect(() => {
        if (open) setNotas('');
    }, [open, row?.id]);

    function handleOpenChange(next: boolean) {
        if (submitting) return;
        onOpenChange(next);
    }

    async function handleConfirm() {
        if (!row) return;
        setSubmitting(true);
        try {
            await createOperativoVincularReparo({
                repairReportId: row.id,
                notas: notas.trim() || null,
            });
            toast.success('Operativo ACTA_REPARO registrado y vinculado.');
            onOpenChange(false);
            onLinked();
        } catch (e) {
            const msg = extractMessage(e, 'No se pudo vincular el acta.');
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="bg-card border-border text-card-foreground max-w-lg"
                data-testid="actas-link-dialog"
            >
                <DialogHeader>
                    <DialogTitle>Vincular acta a operativo</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Crea el operativo de fiscalización tipo ACTA_REPARO
                        enlazado a este PDF. Solo un operativo por acta.
                    </DialogDescription>
                </DialogHeader>
                {row && (
                    <div className="space-y-3 py-2 text-sm">
                        <div className="rounded-md border border-border/60 bg-muted/20 p-3 space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                Acta seleccionada
                            </p>
                            <p className="font-medium text-foreground">{row.contribuyente}</p>
                            <p className="text-xs text-muted-foreground">
                                {row.rif && (
                                    <span className="font-mono">RIF {row.rif}</span>
                                )}
                                {row.numeroReparo && (
                                    <>
                                        {row.rif ? ' · ' : ''}
                                        <span className="font-mono">
                                            N.º reparo {row.numeroReparo}
                                        </span>
                                    </>
                                )}
                            </p>
                            {row.fiscalActuante && (
                                <p className="text-xs text-muted-foreground">
                                    Fiscal actuante: {row.fiscalActuante}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label
                                htmlFor="actas-link-notas"
                                className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                            >
                                Notas (opcional)
                            </Label>
                            <Textarea
                                id="actas-link-notas"
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                placeholder="Observaciones del operativo (opcional)"
                                className="bg-background border-border min-h-[72px]"
                                data-testid="actas-link-notas"
                                disabled={submitting}
                            />
                        </div>
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
                        onClick={() => void handleConfirm()}
                        disabled={submitting}
                        data-testid="actas-link-confirm"
                        aria-busy={submitting}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5"
                    >
                        <Link2
                            className={`h-4 w-4 ${submitting ? 'animate-pulse' : ''}`}
                            aria-hidden="true"
                        />
                        {submitting ? 'Vinculando…' : 'Vincular'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
