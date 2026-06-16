import { useEffect, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import {
    FileUp,
    Search,
    Trash2,
    Upload,
    User,
    UserSearch,
} from 'lucide-react';
import { Button } from '@/components/UI/button';
import { Card, CardContent } from '@/components/UI/card';
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
import { useDebounce } from '@/hooks/use-debounce';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';
import {
    searchContribuyentesParaActaReparo,
    searchUsuariosParaActaReparo,
    type ContribuyenteReparoBusquedaItem,
    type UsuarioActaReparoRow,
} from '@/components/utils/api/fiscal-operaciones-functions';
import {
    uploadRepairReport,
    type RepairReportUploadMeta,
} from '@/components/utils/api/taxpayer-functions';
import type { ImpuestoTipo, ActaFormState } from './types';
import { IMPUESTO_OPTIONS, emptyActaForm } from './types';
import { toAmountString } from '../shared/utils';
import toast from 'react-hot-toast';

/* -------------------------------------------------------------------------- */
/* Constantes y helpers                                                      */
/* -------------------------------------------------------------------------- */

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB (guía §4.1.1)
const MAX_FILE_SIZE_MB = 20;

function buildUploadMeta(
    state: ActaFormState,
    fiscal: UsuarioActaReparoRow | null,
    supervisor: UsuarioActaReparoRow | null,
): RepairReportUploadMeta {
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
    if (fiscal) m.fiscalActuanteUserId = fiscal.id;
    if (supervisor) m.supervisorUserId = supervisor.id;
    return m;
}

function formatBytes(n: number): string {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/* -------------------------------------------------------------------------- */
/* Sub-componente: Dropzone de PDF                                            */
/* -------------------------------------------------------------------------- */

type PdfDropzoneProps = {
    file: File | null;
    onFileAccepted: (f: File) => void;
    onFileRejected: (r: FileRejection) => void;
    onClear: () => void;
};

function PdfDropzone({ file, onFileAccepted, onFileRejected, onClear }: PdfDropzoneProps) {
    const reducedMotion = usePrefersReducedMotion();
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { 'application/pdf': ['.pdf'] },
        maxSize: MAX_FILE_SIZE,
        maxFiles: 1,
        onDrop: (acceptedFiles, fileRejections) => {
            if (acceptedFiles.length > 0) onFileAccepted(acceptedFiles[0]);
            if (fileRejections.length > 0) onFileRejected(fileRejections[0]);
        },
    });

    // `animate-pulse` se aplica solo si el usuario no ha solicitado reducir
    // movimiento (WCAG 2.3.3 + guía §9.1 / §6).
    const pulseClass = isDragActive && !reducedMotion ? 'animate-pulse' : '';

    if (file) {
        return (
            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate" title={file.name}>
                        {file.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                        PDF · {formatBytes(file.size)}
                    </p>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    data-testid="actas-upload-file-clear"
                    className="gap-1.5"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                    Quitar
                </Button>
            </div>
        );
    }

    return (
        <div
            {...getRootProps()}
            data-testid="actas-upload-dropzone"
            aria-live="polite"
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                    ? `border-indigo-500 bg-indigo-500/5 ${pulseClass}`
                    : 'border-border/60 hover:border-indigo-400'
            }`}
        >
            <input
                {...getInputProps()}
                data-testid="actas-upload-input"
                aria-label="Cargar PDF del acta de reparo"
            />
            <Upload
                className="h-8 w-8 mx-auto text-muted-foreground mb-2"
                aria-hidden="true"
            />
            <p className="text-sm font-medium text-foreground">
                {isDragActive
                    ? 'Suelte el PDF para adjuntarlo'
                    : 'Arrastre el PDF del acta de reparo'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
                o haga clic para seleccionar · máx. {MAX_FILE_SIZE_MB} MB
            </p>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Sub-componente: Picker de contribuyente                                    */
/* -------------------------------------------------------------------------- */

function TaxpayerPicker({
    value,
    onPick,
    onClear,
}: {
    value: ContribuyenteReparoBusquedaItem | null;
    onPick: (c: ContribuyenteReparoBusquedaItem) => void;
    onClear: () => void;
}) {
    const [q, setQ] = useState('');
    const debouncedQ = useDebounce(q.trim(), 350);
    const [results, setResults] = useState<ContribuyenteReparoBusquedaItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (value) return;
        if (debouncedQ.length < 2) {
            setResults([]);
            return;
        }
        let cancelled = false;
        setLoading(true);
        void (async () => {
            try {
                const data = await searchContribuyentesParaActaReparo({
                    q: debouncedQ,
                    limit: 10,
                });
                if (!cancelled) setResults(data.items ?? []);
            } catch {
                if (!cancelled) {
                    toast.error('No se pudo buscar el contribuyente.');
                    setResults([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [debouncedQ, value]);

    if (value) {
        return (
            <div
                className="rounded-md border border-indigo-500/40 bg-indigo-500/5 p-3"
                data-testid="actas-contribuyente-preview"
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                            Contribuyente
                        </p>
                        <p className="font-medium text-foreground text-sm">{value.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                            RIF {value.rif} · Prov. {value.providenceNum}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground break-all">
                            UUID {value.id}
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onClear}
                        data-testid="actas-contribuyente-clear"
                    >
                        Cambiar
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <UserSearch className="h-3.5 w-3.5" />
                Buscar contribuyente
            </Label>
            <div className="relative">
                <Search
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                />
                <Input
                    placeholder="Nombre, RIF, providencia, parroquia o UUID… (mín. 2)"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="pl-9 bg-background"
                    data-testid="actas-contribuyente-search"
                />
            </div>
            {debouncedQ.length >= 2 && (
                <div className="rounded-md border border-border bg-muted/20 max-h-56 overflow-y-auto text-sm">
                    {loading ? (
                        <div className="p-3 text-muted-foreground text-xs">Buscando…</div>
                    ) : results.length === 0 ? (
                        <div className="p-3 text-muted-foreground text-xs">
                            Sin coincidencias en su alcance.
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {results.map((t) => (
                                <li key={t.id}>
                                    <button
                                        type="button"
                                        className="w-full text-left px-3 py-2 hover:bg-muted/60 transition-colors"
                                        onClick={() => onPick(t)}
                                    >
                                        <span className="font-medium text-foreground">
                                            {t.name}
                                        </span>
                                        <span className="text-muted-foreground"> · {t.rif}</span>
                                        <span className="block text-xs text-muted-foreground">
                                            Prov. {t.providenceNum}
                                            {t.parish ? ` · ${t.parish.name}` : ''}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Sub-componente: Picker de fiscal / supervisor                              */
/* (replica del `UsuarioActaPicker` del legacy, líneas 201-313)              */
/* -------------------------------------------------------------------------- */

type PickerMode = 'FISCAL' | 'SUPERVISOR';

function UsuarioActaPicker({
    mode,
    label,
    value,
    onPick,
    onClear,
    description,
    testId,
}: {
    mode: PickerMode;
    label: string;
    value: UsuarioActaReparoRow | null;
    onPick: (u: UsuarioActaReparoRow) => void;
    onClear: () => void;
    description?: string;
    testId: string;
}) {
    const [q, setQ] = useState('');
    const debouncedQ = useDebounce(q.trim(), 300);
    const [results, setResults] = useState<UsuarioActaReparoRow[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        void (async () => {
            try {
                const data = await searchUsuariosParaActaReparo({
                    tipo: mode,
                    q: debouncedQ.length ? debouncedQ : undefined,
                    limit: 22,
                });
                if (!cancelled) setResults(data.items ?? []);
            } catch {
                if (!cancelled) {
                    toast.error('No se pudo buscar personal.');
                    setResults([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [debouncedQ, mode]);

    if (value) {
        return (
            <Card className="border-border bg-muted/20">
                <CardContent className="pt-3 pb-3 space-y-1 text-sm">
                    <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                {label}
                            </p>
                            <p className="font-medium text-foreground">{value.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {value.personId ? `CI ${value.personId}` : 'Usuario SAC'}
                                {value.groupName ? ` · ${value.groupName}` : ''}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onClear}
                            data-testid={`${testId}-clear`}
                        >
                            Cambiar
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {label}
            </Label>
            {description && (
                <p className="text-[11px] text-muted-foreground leading-snug">{description}</p>
            )}
            <Input
                placeholder="Nombre o cédula…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="bg-background"
                data-testid={testId}
            />
            <div className="rounded-md border border-border max-h-40 overflow-y-auto text-sm">
                {loading ? (
                    <div className="p-2 text-muted-foreground text-xs">Buscando…</div>
                ) : results.length === 0 ? (
                    <div className="p-2 text-muted-foreground text-xs">
                        Sin resultados en su alcance.
                    </div>
                ) : (
                    <ul className="divide-y divide-border">
                        {results.map((u) => (
                            <li key={u.id}>
                                <button
                                    type="button"
                                    className="w-full text-left px-2 py-1.5 hover:bg-muted/60 transition-colors"
                                    onClick={() => onPick(u)}
                                >
                                    <span className="font-medium text-foreground">{u.name}</span>
                                    <span className="text-xs text-muted-foreground block">
                                        CI {u.personId}
                                        {u.groupName ? ` · ${u.groupName}` : ''}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Sub-componente: Campos de metadatos                                        */
/* -------------------------------------------------------------------------- */

function MetadataFields({
    form,
    setForm,
}: {
    form: ActaFormState;
    setForm: React.Dispatch<React.SetStateAction<ActaFormState>>;
}) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Fecha de entrega
                </Label>
                <Input
                    type="date"
                    value={form.fechaEntrega}
                    onChange={(e) => setForm((s) => ({ ...s, fechaEntrega: e.target.value }))}
                    className="bg-background border-border"
                    data-testid="actas-meta-fechaEntrega"
                />
            </div>

            <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Impuesto
                </Label>
                <Select
                    value={form.impuestoTipo || '__empty__'}
                    onValueChange={(v) =>
                        setForm((s) => ({
                            ...s,
                            impuestoTipo: v === '__empty__' ? '' : (v as ImpuestoTipo),
                        }))
                    }
                >
                    <SelectTrigger
                        className="bg-background border-border"
                        data-testid="actas-meta-impuesto"
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
                <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    N.º expediente
                </Label>
                <Input
                    value={form.numeroExpediente}
                    onChange={(e) => setForm((s) => ({ ...s, numeroExpediente: e.target.value }))}
                    className="bg-background border-border"
                    placeholder="Ej. 2025-2532"
                    data-testid="actas-meta-numeroExpediente"
                />
            </div>

            <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Ejercicio fiscal / período
                </Label>
                <Textarea
                    value={form.ejercicioFiscalPeriodo}
                    onChange={(e) =>
                        setForm((s) => ({ ...s, ejercicioFiscalPeriodo: e.target.value }))
                    }
                    className="bg-background border-border min-h-[72px]"
                    placeholder="Ej. 2023(ISLR)-01/01/2023-31/12/2023(IVA) o 2023-2024"
                    data-testid="actas-meta-ejercicioFiscalPeriodo"
                />
            </div>

            <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    N.º reparo
                </Label>
                <Input
                    value={form.numeroReparo}
                    onChange={(e) => setForm((s) => ({ ...s, numeroReparo: e.target.value }))}
                    className="bg-background border-border"
                    data-testid="actas-meta-numeroReparo"
                />
            </div>

            <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Fecha notificado
                </Label>
                <Input
                    type="date"
                    value={form.fechaNotificado}
                    onChange={(e) => setForm((s) => ({ ...s, fechaNotificado: e.target.value }))}
                    className="bg-background border-border"
                    data-testid="actas-meta-fechaNotificado"
                />
            </div>

            <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Monto ISLR
                </Label>
                <Input
                    inputMode="decimal"
                    value={form.montoIslr}
                    onChange={(e) => setForm((s) => ({ ...s, montoIslr: e.target.value }))}
                    className="bg-background border-border"
                    placeholder="0,00"
                    data-testid="actas-meta-montoIslr"
                />
            </div>

            <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Monto IVA
                </Label>
                <Input
                    inputMode="decimal"
                    value={form.montoIva}
                    onChange={(e) => setForm((s) => ({ ...s, montoIva: e.target.value }))}
                    className="bg-background border-border"
                    placeholder="0,00"
                    data-testid="actas-meta-montoIva"
                />
            </div>

            <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Aceptación y pago del reparo
                </Label>
                <Input
                    inputMode="decimal"
                    value={form.montoAceptacionPago}
                    onChange={(e) =>
                        setForm((s) => ({ ...s, montoAceptacionPago: e.target.value }))
                    }
                    className="bg-background border-border"
                    placeholder="0,00"
                    data-testid="actas-meta-montoAceptacionPago"
                />
            </div>

            <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Total
                </Label>
                <Input
                    inputMode="decimal"
                    value={form.montoTotal}
                    onChange={(e) => setForm((s) => ({ ...s, montoTotal: e.target.value }))}
                    className="bg-background border-border"
                    placeholder="0,00"
                    data-testid="actas-meta-montoTotal"
                />
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Componente público: ActasUploadForm                                        */
/* -------------------------------------------------------------------------- */

type Props = {
    /**
     * Callback invocado tras un upload exitoso para que el padre refresque
     * la tabla. El formulario NO se cierra solo: el padre decide si colapsa
     * el disclosure (comportamiento esperado: sí, ver EARS).
     */
    onUploadComplete: () => void;
};

/**
 * Formulario de carga de un Acta de Reparo.
 *
 * Composición:
 *  1. `TaxpayerPicker` (búsqueda + preview).
 *  2. `UsuarioActaPicker` × 2 (fiscal / supervisor).
 *  3. `MetadataFields` (10 inputs del formulario).
 *  4. `PdfDropzone` (react-dropzone, max 25 MB).
 *  5. Submit con validación client-side (UUID, MIME, tamaño) y progreso.
 *
 * EARS:
 *  - `WHEN the user submits actas-upload-form`, THE SYSTEM SHALL validate
 *    client-side (UUID, PDF, tamaño) y mostrar progreso.
 *  - `IF the upload fails`, THEN THE SYSTEM SHALL mantener el formulario
 *    abierto y mostrar toast de error (no reset state).
 *
 * Fuera de scope:
 *  - Diálogos de edición / vinculación / eliminación (TASK-004c).
 */
export function ActasUploadForm({ onUploadComplete }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [taxpayer, setTaxpayer] = useState<ContribuyenteReparoBusquedaItem | null>(null);
    const [fiscal, setFiscal] = useState<UsuarioActaReparoRow | null>(null);
    const [supervisor, setSupervisor] = useState<UsuarioActaReparoRow | null>(null);
    const [form, setForm] = useState<ActaFormState>(emptyActaForm);
    const [uploading, setUploading] = useState(false);

    function reset() {
        setFile(null);
        setTaxpayer(null);
        setFiscal(null);
        setSupervisor(null);
        setForm(emptyActaForm());
    }

    function handleAcceptFile(f: File) {
        setFile(f);
        toast.success(`PDF cargado: ${f.name}`);
    }

    function handleRejectFile(r: FileRejection) {
        // Mapear el error más relevante a un mensaje legible.
        const first = r.errors[0];
        const msg =
            first?.code === 'file-too-large'
                ? `El PDF excede el tamaño máximo (${MAX_FILE_SIZE_MB} MB).`
                : first?.code === 'file-invalid-type'
                    ? 'Solo se aceptan archivos PDF.'
                    : (first?.message ?? 'PDF inválido.');
        toast.error(msg);
    }

    async function handleSubmit() {
        // 1. Validaciones client-side.
        if (!taxpayer) {
            toast.error('Debe seleccionar un contribuyente.');
            return;
        }
        if (!UUID_RE.test(taxpayer.id)) {
            toast.error('El UUID del contribuyente no tiene un formato válido.');
            return;
        }
        if (!file) {
            toast.error('Debe adjuntar el PDF del acta.');
            return;
        }
        if (file.type !== 'application/pdf') {
            toast.error('El archivo adjunto debe ser un PDF.');
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            toast.error(`El PDF excede el tamaño máximo (${MAX_FILE_SIZE_MB} MB).`);
            return;
        }

        // 2. Construcción del meta + submit.
        setUploading(true);
        try {
            const meta = buildUploadMeta(form, fiscal, supervisor);
            await uploadRepairReport(taxpayer.id, file, meta);
            toast.success('Acta cargada correctamente.');
            reset();
            onUploadComplete();
        } catch (e) {
            // EARS: mantener el formulario abierto. NO reset.
            const msg = e instanceof Error ? e.message : 'No se pudo subir el acta.';
            toast.error(msg);
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="space-y-4">
            <TaxpayerPicker
                value={taxpayer}
                onPick={setTaxpayer}
                onClear={() => setTaxpayer(null)}
            />

            <div className="grid gap-3 sm:grid-cols-2">
                <UsuarioActaPicker
                    mode="FISCAL"
                    label="Fiscal actuante"
                    value={fiscal}
                    onPick={(u) => {
                        setFiscal(u);
                        // Si cambia el fiscal, el supervisor podría no aplicar;
                        // limpiamos para forzar re-selección (alineado con el
                        // comportamiento del legacy, líneas 822-829).
                        setSupervisor(null);
                    }}
                    onClear={() => {
                        setFiscal(null);
                        setSupervisor(null);
                    }}
                    description="Seleccione el usuario fiscal del SAC. El grupo se asocia según el fiscal elegido."
                    testId="actas-fiscal-search"
                />
                <UsuarioActaPicker
                    mode="SUPERVISOR"
                    label="Supervisor"
                    value={supervisor}
                    onPick={setSupervisor}
                    onClear={() => setSupervisor(null)}
                    description="Supervisor del SAC vinculado al acta."
                    testId="actas-supervisor-search"
                />
            </div>

            <MetadataFields form={form} setForm={setForm} />

            <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Archivo PDF
                </Label>
                <PdfDropzone
                    file={file}
                    onFileAccepted={handleAcceptFile}
                    onFileRejected={handleRejectFile}
                    onClear={() => setFile(null)}
                />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
                <Button
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={uploading}
                    data-testid="actas-upload-submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
                    aria-busy={uploading}
                >
                    <FileUp
                        className={`h-4 w-4 ${uploading ? 'animate-pulse' : ''}`}
                        aria-hidden="true"
                    />
                    {uploading ? 'Subiendo…' : 'Subir acta'}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={reset}
                    disabled={uploading}
                >
                    Limpiar datos del acta
                </Button>
            </div>
        </div>
    );
}
