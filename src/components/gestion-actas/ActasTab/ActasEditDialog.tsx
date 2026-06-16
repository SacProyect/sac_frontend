import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw, Save } from 'lucide-react';
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
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/UI/select';
import { Textarea } from '@/components/UI/textarea';
import { adminUpdateReparoActa } from '@/components/utils/api/fiscal-operaciones-functions';
import type { RepairReportUploadMeta } from '@/components/utils/api/taxpayer-functions';
import type { ActaReparo, ImpuestoTipo, ActaFormState } from './types';
import { IMPUESTO_OPTIONS, emptyActaForm } from './types';
import { extractMessage, toAmountString } from '../shared/utils';

/* -------------------------------------------------------------------------- */
/* Constantes                                                                 */
/* -------------------------------------------------------------------------- */

/** Tolerancia para el warning de concurrencia (per guía §8.1). */
const CONCURRENCY_TOLERANCE_MS = 5 * 60 * 1000;

function isoToDateInput(iso: string | null | undefined): string {
    if (!iso) return '';
    return iso.slice(0, 10);
}

function rowToFormState(r: ActaReparo): ActaFormState {
    return {
        fechaEntrega: isoToDateInput(r.fechaEntrega),
        impuestoTipo: (r.impuestoTipo as ImpuestoTipo | null) ?? '',
        numeroExpediente: r.numeroExpediente ?? '',
        ejercicioFiscalPeriodo: r.ejercicioFiscalPeriodo ?? '',
        numeroReparo: r.numeroReparo ?? '',
        fechaNotificado: isoToDateInput(r.fechaNotificado),
        montoIslr: r.montoIslr != null ? String(r.montoIslr) : '',
        montoIva: r.montoIva != null ? String(r.montoIva) : '',
        montoAceptacionPago: r.montoAceptacionPago != null ? String(r.montoAceptacionPago) : '',
        montoTotal: r.montoTotal != null ? String(r.montoTotal) : '',
    };
}

function buildMeta(state: ActaFormState): RepairReportUploadMeta {
    const m: RepairReportUploadMeta = {};
    if (state.fechaEntrega) m.fechaEntrega = state.fechaEntrega;
    if (state.impuestoTipo) m.impuestoTipo = state.impuestoTipo;
    if (state.numeroExpediente.trim()) m.numeroExpediente = state.numeroExpediente.trim();
    if (state.ejercicioFiscalPeriodo.trim())
        m.ejercicioFiscalPeriodo = state.ejercicioFiscalPeriodo.trim();
    if (state.numeroReparo.trim()) m.numeroReparo = state.numeroReparo.trim();
    if (state.fechaNotificado) m.fechaNotificado = state.fechaNotificado;
    const montoIslr = toAmountString(state.montoIslr);
    if (montoIslr !== undefined) m.montoIslr = montoIslr;
    const montoIva = toAmountString(state.montoIva);
    if (montoIva !== undefined) m.montoIva = montoIva;
    const montoAceptacion = toAmountString(state.montoAceptacionPago);
    if (montoAceptacion !== undefined) m.montoAceptacionPago = montoAceptacion;
    const montoTotal = toAmountString(state.montoTotal);
    if (montoTotal !== undefined) m.montoTotal = montoTotal;
    // NOTA: los campos `fiscalActuanteUserId` / `supervisorUserId` /
    // `fiscalActuante` / `supervisorNombre` se omiten intencionalmente: el
    // PATCH trata los campos ausentes como "preservar valor actual", por lo
    // que la asignación de personal queda intacta. (TASK-004c: sin pickers.)
    return m;
}

/* -------------------------------------------------------------------------- */
/* Helpers de warning de concurrencia                                         */
/* -------------------------------------------------------------------------- */

type ConcurrencyInfo = {
    show: boolean;
    /** HH:MM para el copy del banner, o null si no aplica. */
    formattedTime: string | null;
};

/**
 * Compara la `fechaNotificado` que recibimos al abrir el dialog contra el
 * valor más reciente del prop `row` (que refleja el refetch del padre).
 *
 * - Si alguno de los dos es null/undefined → no warning.
 * - Si la diferencia absoluta parseada como ISO datetime es > 5 min → warning.
 * - Si el diff es ≤ 5 min → se asume re-fetch normal del cache.
 *
 * Limitación documentada en guía §8: el campo es fecha (granularidad día),
 * por lo que un cambio de fecha siempre disparará el warning; cambios
 * dentro del mismo día no son detectables sin un `updatedAt` real.
 */
function computeConcurrencyWarning(
    loadedFechaNotificado: string | null,
    currentFechaNotificado: string | null,
): ConcurrencyInfo {
    if (!loadedFechaNotificado || !currentFechaNotificado) {
        return { show: false, formattedTime: null };
    }
    const loadedMs = new Date(loadedFechaNotificado).getTime();
    const currentMs = new Date(currentFechaNotificado).getTime();
    if (Number.isNaN(loadedMs) || Number.isNaN(currentMs)) {
        return { show: false, formattedTime: null };
    }
    const diff = Math.abs(currentMs - loadedMs);
    if (diff <= CONCURRENCY_TOLERANCE_MS) {
        return { show: false, formattedTime: null };
    }
    // Formato HH:MM (es-VE 24h) para el copy del banner.
    const formattedTime = new Date(currentFechaNotificado).toLocaleTimeString('es-VE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    return { show: true, formattedTime };
}

/* -------------------------------------------------------------------------- */
/* Props                                                                      */
/* -------------------------------------------------------------------------- */

type Props = {
    /** Fila a editar. Se ignora cuando `open === false`. */
    row: ActaReparo | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Callback invocado tras un guardado exitoso. */
    onSaved: () => void;
    /**
     * Callback que el botón "Recargar" del warning invoca para que el
     * padre re-fetchee la lista (y propague el row actualizado al
     * dialog). El dialog se reinicia con los valores frescos tras la
     * resolución.
     */
    onReload?: () => Promise<void> | void;
};

/* -------------------------------------------------------------------------- */
/* Componente público                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Dialog de edición de los 10 metadatos de un Acta de Reparo.
 *
 * EARS (per plan v3.1):
 *  - `WHEN the user clicks actas-edit-{id}` → open this dialog
 *    pre-poblado con los valores de la fila.
 *  - `IF row.fechaNotificado` (campo degradado) difiere del valor
 *    capturado al abrir > 5 min → show visual warning banner (`border-
 *    amber-500`) con copy "Esta fila pudo haber sido modificada por
 *    otro usuario a las HH:MM. Recargue antes de guardar." + disable
 *    submit hasta que el usuario pulse "Recargar".
 *  - `WHEN the user submits` → llama `adminUpdateReparoActa(row.id,
 *    meta)`, toast success, close + refresh.
 *  - `IF save fails` → mantiene el dialog abierto + toast error.
 *
 * Fuera de scope (TASK-004c):
 *  - Reemplazo de PDF: el backend PATCH solo cubre metadatos.
 *  - Cambio de personal (fiscal/supervisor): la edición de FKs requiere
 *    pickers, que se difieren a iteración futura (issue MEDIUM de
 *    TASK-004b).
 */
export function ActasEditDialog({
    row,
    open,
    onOpenChange,
    onSaved,
    onReload,
}: Props) {
    const [form, setForm] = useState<ActaFormState>(emptyActaForm);
    const [saving, setSaving] = useState(false);
    const [reloading, setReloading] = useState(false);
    /** `fechaNotificado` capturado en el momento de abrir / recargar. */
    const [loadedFechaNotificado, setLoadedFechaNotificado] = useState<string | null>(null);
    /**
     * Contador que se incrementa cuando el usuario pulsa "Recargar".
     * Se usa como `key` en un wrapper interno para forzar re-mount y
     * repoblar el form con los valores frescos del row prop.
     */
    const [reloadKey, setReloadKey] = useState(0);

    // Reset del formulario SOLO cuando:
    //  - El dialog se abre.
    //  - Cambia la fila objetivo (`row.id`).
    // NO se incluye `row?.fechaNotificado` en deps: si el padre re-fetchea
    // y la fila cambia de fecha mientras el usuario edita, queremos
    // mantener las ediciones del usuario y solo mostrar el warning de
    // concurrencia. El reset explícito se hace vía `reloadKey` (botón
    // "Recargar").
    useEffect(() => {
        if (open && row) {
            setForm(rowToFormState(row));
            setLoadedFechaNotificado(row.fechaNotificado);
        }
    }, [open, row?.id]);

    const concurrency = useMemo(
        () =>
            computeConcurrencyWarning(loadedFechaNotificado, row?.fechaNotificado ?? null),
        [loadedFechaNotificado, row?.fechaNotificado],
    );

    function handleOpenChange(next: boolean) {
        if (saving || reloading) return;
        onOpenChange(next);
    }

    async function handleSubmit() {
        if (!row) return;
        if (concurrency.show) {
            // Defensa en profundidad: nunca se debería llegar aquí porque el
            // botón está `disabled`, pero si lo hace, abortamos silenciosamente.
            return;
        }
        setSaving(true);
        try {
            const meta = buildMeta(form);
            await adminUpdateReparoActa(row.id, meta);
            toast.success('Acta actualizada.');
            onOpenChange(false);
            onSaved();
        } catch (e) {
            const msg = extractMessage(e, 'No se pudo guardar el acta.');
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    }

    async function handleReload() {
        if (!onReload) return;
        setReloading(true);
        try {
            await onReload();
            // Forzar re-mount del contenido del dialog para repoblar el
            // form con los valores frescos del row prop (que ya fue
            // actualizado por el useEffect del padre).
            setReloadKey((k) => k + 1);
        } finally {
            setReloading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="bg-card border-border text-card-foreground max-w-3xl max-h-[90vh] overflow-y-auto"
                data-testid="actas-edit-dialog"
            >
                <DialogHeader>
                    <DialogTitle>Editar metadatos del acta</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Solo administradores. El PDF no se reemplaza desde este
                        dialog.
                    </DialogDescription>
                </DialogHeader>

                {row && (
                    <div key={reloadKey} className="space-y-3 py-2">
                        {/* Preview de la fila para contexto */}
                        <div className="rounded-md border border-border/60 bg-muted/20 p-3 space-y-1 text-sm">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                Acta
                            </p>
                            <p className="font-medium text-foreground">
                                {row.contribuyente}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {row.rif && (
                                    <span className="font-mono">RIF {row.rif}</span>
                                )}
                                {row.numeroExpediente && (
                                    <>
                                        {row.rif ? ' · ' : ''}
                                        <span>
                                            Exp. {row.numeroExpediente}
                                        </span>
                                    </>
                                )}
                            </p>
                        </div>

                        {concurrency.show && (
                            <div
                                data-testid="actas-edit-concurrency-warning"
                                role="alert"
                                className="border border-amber-500/60 bg-amber-500/10 rounded-md px-3 py-2 flex items-start gap-2"
                            >
                                <AlertTriangle
                                    className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                                    aria-hidden="true"
                                />
                                <div className="flex-1 text-sm text-amber-700 dark:text-amber-300">
                                    <p>
                                        Esta fila pudo haber sido modificada por
                                        otro usuario a las{' '}
                                        <strong className="font-semibold">
                                            {concurrency.formattedTime}
                                        </strong>{' '}
                                        (fecha de notificación). Recargue antes
                                        de guardar.
                                    </p>
                                </div>
                                {onReload && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => void handleReload()}
                                        disabled={reloading}
                                        className="gap-1.5 shrink-0"
                                        data-testid="actas-edit-reload"
                                    >
                                        <RefreshCw
                                            className={`h-3.5 w-3.5 ${reloading ? 'animate-spin' : ''}`}
                                            aria-hidden="true"
                                        />
                                        Recargar
                                    </Button>
                                )}
                            </div>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="space-y-1">
                                <Label
                                    htmlFor="actas-meta-fechaEntrega"
                                    className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                                >
                                    Fecha de entrega
                                </Label>
                                <Input
                                    id="actas-meta-fechaEntrega"
                                    type="date"
                                    value={form.fechaEntrega}
                                    onChange={(e) =>
                                        setForm((s) => ({
                                            ...s,
                                            fechaEntrega: e.target.value,
                                        }))
                                    }
                                    className="bg-background border-border"
                                    data-testid="actas-edit-fechaEntrega"
                                    disabled={saving}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label
                                    htmlFor="actas-meta-impuesto"
                                    className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                                >
                                    Impuesto
                                </Label>
                                <Select
                                    value={form.impuestoTipo || '__empty__'}
                                    onValueChange={(v) =>
                                        setForm((s) => ({
                                            ...s,
                                            impuestoTipo:
                                                v === '__empty__'
                                                    ? ''
                                                    : (v as ImpuestoTipo),
                                        }))
                                    }
                                    disabled={saving}
                                >
                                    <SelectTrigger
                                        id="actas-meta-impuesto"
                                        className="bg-background border-border"
                                        data-testid="actas-edit-impuesto"
                                    >
                                        <SelectValue placeholder="Seleccione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__empty__">—</SelectItem>
                                        {IMPUESTO_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label
                                    htmlFor="actas-meta-numeroExpediente"
                                    className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                                >
                                    N.º expediente
                                </Label>
                                <Input
                                    id="actas-meta-numeroExpediente"
                                    value={form.numeroExpediente}
                                    onChange={(e) =>
                                        setForm((s) => ({
                                            ...s,
                                            numeroExpediente: e.target.value,
                                        }))
                                    }
                                    className="bg-background border-border"
                                    placeholder="Ej. 2025-2532"
                                    data-testid="actas-edit-numeroExpediente"
                                    disabled={saving}
                                />
                            </div>
                            <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                                <Label
                                    htmlFor="actas-meta-ejercicioFiscalPeriodo"
                                    className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                                >
                                    Ejercicio fiscal / período
                                </Label>
                                <Textarea
                                    id="actas-meta-ejercicioFiscalPeriodo"
                                    value={form.ejercicioFiscalPeriodo}
                                    onChange={(e) =>
                                        setForm((s) => ({
                                            ...s,
                                            ejercicioFiscalPeriodo: e.target.value,
                                        }))
                                    }
                                    className="bg-background border-border min-h-[72px]"
                                    placeholder="Ej. 2023(ISLR)-01/01/2023-31/12/2023(IVA) o 2023-2024"
                                    data-testid="actas-edit-ejercicioFiscalPeriodo"
                                    disabled={saving}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label
                                    htmlFor="actas-meta-numeroReparo"
                                    className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                                >
                                    N.º reparo
                                </Label>
                                <Input
                                    id="actas-meta-numeroReparo"
                                    value={form.numeroReparo}
                                    onChange={(e) =>
                                        setForm((s) => ({
                                            ...s,
                                            numeroReparo: e.target.value,
                                        }))
                                    }
                                    className="bg-background border-border"
                                    data-testid="actas-edit-numeroReparo"
                                    disabled={saving}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label
                                    htmlFor="actas-meta-fechaNotificado"
                                    className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                                >
                                    Fecha notificado
                                </Label>
                                <Input
                                    id="actas-meta-fechaNotificado"
                                    type="date"
                                    value={form.fechaNotificado}
                                    onChange={(e) =>
                                        setForm((s) => ({
                                            ...s,
                                            fechaNotificado: e.target.value,
                                        }))
                                    }
                                    className="bg-background border-border"
                                    data-testid="actas-edit-fechaNotificado"
                                    disabled={saving}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label
                                    htmlFor="actas-meta-montoIslr"
                                    className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                                >
                                    Monto ISLR
                                </Label>
                                <Input
                                    id="actas-meta-montoIslr"
                                    inputMode="decimal"
                                    value={form.montoIslr}
                                    onChange={(e) =>
                                        setForm((s) => ({
                                            ...s,
                                            montoIslr: e.target.value,
                                        }))
                                    }
                                    className="bg-background border-border"
                                    placeholder="0,00"
                                    data-testid="actas-edit-montoIslr"
                                    disabled={saving}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label
                                    htmlFor="actas-meta-montoIva"
                                    className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                                >
                                    Monto IVA
                                </Label>
                                <Input
                                    id="actas-meta-montoIva"
                                    inputMode="decimal"
                                    value={form.montoIva}
                                    onChange={(e) =>
                                        setForm((s) => ({
                                            ...s,
                                            montoIva: e.target.value,
                                        }))
                                    }
                                    className="bg-background border-border"
                                    placeholder="0,00"
                                    data-testid="actas-edit-montoIva"
                                    disabled={saving}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label
                                    htmlFor="actas-meta-montoAceptacionPago"
                                    className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                                >
                                    Aceptación y pago del reparo
                                </Label>
                                <Input
                                    id="actas-meta-montoAceptacionPago"
                                    inputMode="decimal"
                                    value={form.montoAceptacionPago}
                                    onChange={(e) =>
                                        setForm((s) => ({
                                            ...s,
                                            montoAceptacionPago: e.target.value,
                                        }))
                                    }
                                    className="bg-background border-border"
                                    placeholder="0,00"
                                    data-testid="actas-edit-montoAceptacionPago"
                                    disabled={saving}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label
                                    htmlFor="actas-meta-montoTotal"
                                    className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                                >
                                    Total
                                </Label>
                                <Input
                                    id="actas-meta-montoTotal"
                                    inputMode="decimal"
                                    value={form.montoTotal}
                                    onChange={(e) =>
                                        setForm((s) => ({
                                            ...s,
                                            montoTotal: e.target.value,
                                        }))
                                    }
                                    className="bg-background border-border"
                                    placeholder="0,00"
                                    data-testid="actas-edit-montoTotal"
                                    disabled={saving}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={saving}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={() => void handleSubmit()}
                        disabled={saving || concurrency.show}
                        data-testid="actas-edit-submit"
                        aria-busy={saving}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5"
                    >
                        <Save
                            className={`h-4 w-4 ${saving ? 'animate-pulse' : ''}`}
                            aria-hidden="true"
                        />
                        {saving ? 'Guardando…' : 'Guardar cambios'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
