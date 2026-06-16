/**
 * @deprecated Reemplazado por `ActasTab` en `/gestion-actas`.
 *
 * - Migrado en TASK-006b a `src/pages/fiscalizacion/fiscalizacion-page-v2.tsx`.
 * - La migración de `gestion-personal-page-v2.tsx` está en TASK-006 (banner + flip flag).
 * - Remoción planeada: 2 sprints tras el flip del feature flag a true en producción.
 *
 * Ver: docs/migracion-gestion-actas.md (TASK-009)
 */
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
    adminDeleteReparoActa,
    adminUpdateReparoActa,
    createOperativoVincularReparo,
    downloadRepairReportsResumenCsv,
    downloadRepairReportsResumenXlsx,
    listRepairReportsResumen,
    searchContribuyentesParaActaReparo,
    searchUsuariosParaActaReparo,
    type ContribuyenteReparoBusquedaItem,
    type RepairReportResumenItem,
    type UsuarioActaReparoRow,
} from "@/components/utils/api/fiscal-operaciones-functions";
import { uploadRepairReport, type RepairReportUploadMeta } from "@/components/utils/api/taxpayer-functions";
import { Button } from "@/components/UI/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/card";
import { Input } from "@/components/UI/input";
import { Label } from "@/components/UI/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/UI/dialog";
import { Textarea } from "@/components/UI/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/UI/table";
import { Badge } from "@/components/UI/badge";
import { Skeleton } from "@/components/UI/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/UI/select";
import {
    FileDown,
    FileSpreadsheet,
    FileUp,
    Link2,
    Pencil,
    RefreshCw,
    ScrollText,
    Search,
    ExternalLink,
    Trash2,
    UserSearch,
} from "lucide-react";
import toast from "react-hot-toast";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const IMPUESTO_OPTIONS = ["", "IVA-ISLR", "ISLR", "IVA"] as const;

function fmtMoney(n: number | null | undefined): string {
    if (n == null || Number.isNaN(n)) return "—";
    return n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDateShort(iso: string | null | undefined): string {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleDateString("es-VE", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return iso;
    }
}

function buildUploadMeta(state: ActaFormState): RepairReportUploadMeta {
    const m: RepairReportUploadMeta = {};
    if (state.fechaEntrega) m.fechaEntrega = state.fechaEntrega;
    if (state.impuestoTipo) m.impuestoTipo = state.impuestoTipo;
    if (state.numeroExpediente.trim()) m.numeroExpediente = state.numeroExpediente.trim();
    if (state.ejercicioFiscalPeriodo.trim()) m.ejercicioFiscalPeriodo = state.ejercicioFiscalPeriodo.trim();
    if (state.numeroReparo.trim()) m.numeroReparo = state.numeroReparo.trim();
    if (state.fechaNotificado) m.fechaNotificado = state.fechaNotificado;
    if (state.montoIslr.trim()) m.montoIslr = state.montoIslr.trim().replace(",", ".");
    if (state.montoIva.trim()) m.montoIva = state.montoIva.trim().replace(",", ".");
    if (state.montoAceptacionPago.trim()) m.montoAceptacionPago = state.montoAceptacionPago.trim().replace(",", ".");
    if (state.montoTotal.trim()) m.montoTotal = state.montoTotal.trim().replace(",", ".");
    return m;
}

function mergeActaPersonnel(
    meta: RepairReportUploadMeta,
    fiscal: UsuarioActaReparoRow | null,
    supervisor: UsuarioActaReparoRow | null,
): RepairReportUploadMeta {
    const out: RepairReportUploadMeta = { ...meta };
    if (fiscal) out.fiscalActuanteUserId = fiscal.id;
    if (supervisor) out.supervisorUserId = supervisor.id;
    return out;
}

/** Evita borrar textos legacy en PATCH cuando el acta aún no tenía FK de usuario. */
function enrichEditMetaPreservingLegacyText(
    meta: RepairReportUploadMeta,
    row: RepairReportResumenItem | null,
    fiscal: UsuarioActaReparoRow | null,
    sup: UsuarioActaReparoRow | null,
): RepairReportUploadMeta {
    const out: RepairReportUploadMeta = { ...meta };
    if (!fiscal && !row?.fiscalActuanteUserId && row?.fiscalActuante) {
        out.fiscalActuante = row.fiscalActuante;
    }
    if (!sup && !row?.supervisorUserId && row?.supervisorNombre) {
        out.supervisorNombre = row.supervisorNombre;
    }
    return out;
}

function isoToDateInput(iso: string | null | undefined): string {
    if (!iso) return "";
    return iso.slice(0, 10);
}

function resumenRowToActaForm(r: RepairReportResumenItem): ActaFormState {
    return {
        fechaEntrega: isoToDateInput(r.fechaEntrega),
        impuestoTipo: r.impuestoTipo ?? "",
        numeroExpediente: r.numeroExpediente ?? "",
        ejercicioFiscalPeriodo: r.ejercicioFiscalPeriodo ?? "",
        numeroReparo: r.numeroReparo ?? "",
        fechaNotificado: isoToDateInput(r.fechaNotificado),
        montoIslr: r.montoIslr != null ? String(r.montoIslr) : "",
        montoIva: r.montoIva != null ? String(r.montoIva) : "",
        montoAceptacionPago: r.montoAceptacionPago != null ? String(r.montoAceptacionPago) : "",
        montoTotal: r.montoTotal != null ? String(r.montoTotal) : "",
    };
}

type ActaFormState = {
    fechaEntrega: string;
    impuestoTipo: string;
    numeroExpediente: string;
    ejercicioFiscalPeriodo: string;
    numeroReparo: string;
    fechaNotificado: string;
    montoIslr: string;
    montoIva: string;
    montoAceptacionPago: string;
    montoTotal: string;
};

const emptyActaForm = (): ActaFormState => ({
    fechaEntrega: "",
    impuestoTipo: "",
    numeroExpediente: "",
    ejercicioFiscalPeriodo: "",
    numeroReparo: "",
    fechaNotificado: "",
    montoIslr: "",
    montoIva: "",
    montoAceptacionPago: "",
    montoTotal: "",
});

function rowToFiscalPick(r: RepairReportResumenItem): UsuarioActaReparoRow | null {
    if (!r.fiscalActuanteUserId) return null;
    return {
        id: r.fiscalActuanteUserId,
        name: r.fiscalActuante ?? "—",
        personId: 0,
        role: "FISCAL",
        groupId: r.fiscalGroupId,
        groupName: r.fiscalGroupName,
        supervisorId: null,
        supervisorName: null,
    };
}

function rowToSupPick(r: RepairReportResumenItem): UsuarioActaReparoRow | null {
    if (!r.supervisorUserId) return null;
    return {
        id: r.supervisorUserId,
        name: r.supervisorNombre ?? "—",
        personId: 0,
        role: "SUPERVISOR",
        groupId: null,
        groupName: null,
        supervisorId: null,
        supervisorName: null,
    };
}

function UsuarioActaPicker({
    tipo,
    label,
    value,
    onPick,
    onClear,
    description,
}: {
    tipo: "FISCAL" | "SUPERVISOR";
    label: string;
    value: UsuarioActaReparoRow | null;
    onPick: (u: UsuarioActaReparoRow) => void;
    onClear: () => void;
    description?: string;
}) {
    const [q, setQ] = useState("");
    const [debouncedQ, setDebouncedQ] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<UsuarioActaReparoRow[]>([]);

    useEffect(() => {
        const t = window.setTimeout(() => setDebouncedQ(q.trim()), 300);
        return () => window.clearTimeout(t);
    }, [q]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        void (async () => {
            try {
                const data = await searchUsuariosParaActaReparo({
                    tipo,
                    q: debouncedQ.length ? debouncedQ : undefined,
                    limit: 22,
                });
                if (!cancelled) setResults(data.items ?? []);
            } catch {
                if (!cancelled) {
                    toast.error("No se pudo buscar personal.");
                    setResults([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [debouncedQ, tipo]);

    if (value) {
        return (
            <Card className="border-border bg-muted/20">
                <CardContent className="pt-3 pb-3 space-y-1 text-sm">
                    <div className="flex justify-between items-start gap-2">
                        <div>
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className="font-medium text-foreground">{value.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {value.personId ? `CI ${value.personId}` : "Usuario SAC"}
                                {value.groupName ? ` · Grupo: ${value.groupName}` : ""}
                            </p>
                            {tipo === "FISCAL" && value.supervisorName && (
                                <p className="text-xs text-muted-foreground">Supervisor: {value.supervisorName}</p>
                            )}
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
                            Cambiar
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            {description && <p className="text-[11px] text-muted-foreground leading-snug">{description}</p>}
            <Input
                placeholder="Nombre o cédula (personId)…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="bg-background"
            />
            <div className="rounded-md border border-border max-h-40 overflow-y-auto text-sm">
                {loading ? (
                    <div className="p-2 text-muted-foreground text-xs">Cargando…</div>
                ) : results.length === 0 ? (
                    <div className="p-2 text-muted-foreground text-xs">Sin resultados en su alcance.</div>
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
                                        {u.groupName ? ` · ${u.groupName}` : ""}
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

function ActaMetadataFields({
    form,
    setForm,
}: {
    form: ActaFormState;
    setForm: Dispatch<SetStateAction<ActaFormState>>;
}) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Fecha de entrega</Label>
                <Input
                    type="date"
                    value={form.fechaEntrega}
                    onChange={(e) => setForm((s) => ({ ...s, fechaEntrega: e.target.value }))}
                    className="bg-background border-border"
                />
            </div>
            <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Impuesto</Label>
                <Select
                    value={form.impuestoTipo || "__empty__"}
                    onValueChange={(v) => setForm((s) => ({ ...s, impuestoTipo: v === "__empty__" ? "" : v }))}
                >
                    <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Seleccione" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__empty__">—</SelectItem>
                        {IMPUESTO_OPTIONS.filter(Boolean).map((opt) => (
                            <SelectItem key={opt} value={opt}>
                                {opt}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">N.º expediente</Label>
                <Input
                    value={form.numeroExpediente}
                    onChange={(e) => setForm((s) => ({ ...s, numeroExpediente: e.target.value }))}
                    className="bg-background border-border"
                    placeholder="Ej. 2025-2532"
                />
            </div>
            <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                <Label className="text-xs text-muted-foreground">Ejercicio fiscal / período</Label>
                <Textarea
                    value={form.ejercicioFiscalPeriodo}
                    onChange={(e) => setForm((s) => ({ ...s, ejercicioFiscalPeriodo: e.target.value }))}
                    className="bg-background border-border min-h-[72px]"
                    placeholder="Ej. 2023(ISLR)-01/01/2023-31/12/2023(IVA) o 2023-2024"
                />
            </div>
            <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">N.º reparo</Label>
                <Input
                    value={form.numeroReparo}
                    onChange={(e) => setForm((s) => ({ ...s, numeroReparo: e.target.value }))}
                    className="bg-background border-border"
                />
            </div>
            <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Fecha notificado</Label>
                <Input
                    type="date"
                    value={form.fechaNotificado}
                    onChange={(e) => setForm((s) => ({ ...s, fechaNotificado: e.target.value }))}
                    className="bg-background border-border"
                />
            </div>
            <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Monto ISLR</Label>
                <Input
                    inputMode="decimal"
                    value={form.montoIslr}
                    onChange={(e) => setForm((s) => ({ ...s, montoIslr: e.target.value }))}
                    className="bg-background border-border"
                    placeholder="0,00"
                />
            </div>
            <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Monto IVA</Label>
                <Input
                    inputMode="decimal"
                    value={form.montoIva}
                    onChange={(e) => setForm((s) => ({ ...s, montoIva: e.target.value }))}
                    className="bg-background border-border"
                    placeholder="0,00"
                />
            </div>
            <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Aceptación y pago del reparo</Label>
                <Input
                    inputMode="decimal"
                    value={form.montoAceptacionPago}
                    onChange={(e) => setForm((s) => ({ ...s, montoAceptacionPago: e.target.value }))}
                    className="bg-background border-border"
                    placeholder="0,00"
                />
            </div>
            <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Total</Label>
                <Input
                    inputMode="decimal"
                    value={form.montoTotal}
                    onChange={(e) => setForm((s) => ({ ...s, montoTotal: e.target.value }))}
                    className="bg-background border-border"
                    placeholder="0,00"
                />
            </div>
        </div>
    );
}

/**
 * Registro y consulta de actas de reparo (PDF + metadatos tipo plantilla Excel revisadas).
 */
export function ReparosActasSection() {
    const { user } = useAuth();
    const isAdmin = user?.role === "ADMIN";

    const [taxpayerIdUpload, setTaxpayerIdUpload] = useState("");
    const [taxpayerSearch, setTaxpayerSearch] = useState("");
    const [taxpayerSearchDebounced, setTaxpayerSearchDebounced] = useState("");
    const [taxpayerResults, setTaxpayerResults] = useState<ContribuyenteReparoBusquedaItem[]>([]);
    const [taxpayerSearchLoading, setTaxpayerSearchLoading] = useState(false);
    const [selectedTaxpayer, setSelectedTaxpayer] = useState<ContribuyenteReparoBusquedaItem | null>(null);

    const [actaForm, setActaForm] = useState<ActaFormState>(emptyActaForm);
    const [fiscalPick, setFiscalPick] = useState<UsuarioActaReparoRow | null>(null);
    const [supPick, setSupPick] = useState<UsuarioActaReparoRow | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const [q, setQ] = useState("");
    const [qDebounced, setQDebounced] = useState("");
    const [items, setItems] = useState<RepairReportResumenItem[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [exportingXlsx, setExportingXlsx] = useState(false);
    const [exportingCsv, setExportingCsv] = useState(false);

    const [vincOpen, setVincOpen] = useState(false);
    const [vincRow, setVincRow] = useState<RepairReportResumenItem | null>(null);
    const [vincNotas, setVincNotas] = useState("");
    const [vincSubmitting, setVincSubmitting] = useState(false);

    const [editOpen, setEditOpen] = useState(false);
    const [editingReportId, setEditingReportId] = useState<string | null>(null);
    const [editingRow, setEditingRow] = useState<RepairReportResumenItem | null>(null);
    const [editForm, setEditForm] = useState<ActaFormState>(emptyActaForm);
    const [editFiscalPick, setEditFiscalPick] = useState<UsuarioActaReparoRow | null>(null);
    const [editSupPick, setEditSupPick] = useState<UsuarioActaReparoRow | null>(null);
    const [editSaving, setEditSaving] = useState(false);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteRow, setDeleteRow] = useState<RepairReportResumenItem | null>(null);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);

    useEffect(() => {
        const t = window.setTimeout(() => setQDebounced(q.trim()), 350);
        return () => window.clearTimeout(t);
    }, [q]);

    useEffect(() => {
        const t = window.setTimeout(() => setTaxpayerSearchDebounced(taxpayerSearch.trim()), 350);
        return () => window.clearTimeout(t);
    }, [taxpayerSearch]);

    useEffect(() => {
        if (taxpayerSearchDebounced.length < 2) {
            setTaxpayerResults([]);
            return;
        }
        let cancelled = false;
        setTaxpayerSearchLoading(true);
        void (async () => {
            try {
                const data = await searchContribuyentesParaActaReparo({
                    q: taxpayerSearchDebounced,
                    limit: 25,
                });
                if (!cancelled) setTaxpayerResults(data.items ?? []);
            } catch {
                if (!cancelled) {
                    toast.error("No se pudo buscar contribuyentes.");
                    setTaxpayerResults([]);
                }
            } finally {
                if (!cancelled) setTaxpayerSearchLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [taxpayerSearchDebounced]);

    const loadList = useCallback(async () => {
        setListLoading(true);
        try {
            const data = await listRepairReportsResumen({
                q: qDebounced || undefined,
                limit: 250,
            });
            setItems(data.items ?? []);
        } catch (e: unknown) {
            const msg =
                (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
                "No se pudo cargar el listado.";
            toast.error(typeof msg === "string" ? msg : "Error");
            setItems([]);
        } finally {
            setListLoading(false);
        }
    }, [qDebounced]);

    useEffect(() => {
        void loadList();
    }, [loadList]);

    const pickTaxpayer = (t: ContribuyenteReparoBusquedaItem) => {
        setSelectedTaxpayer(t);
        setTaxpayerIdUpload(t.id);
        setTaxpayerResults([]);
        setTaxpayerSearch("");
    };

    const clearTaxpayerSelection = () => {
        setSelectedTaxpayer(null);
        setTaxpayerIdUpload("");
        setTaxpayerResults([]);
        setTaxpayerSearch("");
        setFiscalPick(null);
        setSupPick(null);
    };

    const submitUpload = async () => {
        const tid = taxpayerIdUpload.trim();
        if (!UUID_RE.test(tid)) {
            toast.error("Seleccione un contribuyente de la búsqueda (o verifique el identificador).");
            return;
        }
        if (!file) {
            toast.error("Seleccione un archivo PDF.");
            return;
        }
        if (file.type !== "application/pdf") {
            toast.error("Solo se admiten archivos PDF.");
            return;
        }
        setUploading(true);
        try {
            const meta = mergeActaPersonnel(buildUploadMeta(actaForm), fiscalPick, supPick);
            await uploadRepairReport(tid, file, meta);
            toast.success("Acta de reparo cargada.");
            setFile(null);
            setActaForm(emptyActaForm());
            setFiscalPick(null);
            setSupPick(null);
            clearTaxpayerSelection();
            void loadList();
        } catch (e: unknown) {
            const msg =
                (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
                (e instanceof Error ? e.message : "Error al subir.");
            toast.error(typeof msg === "string" ? msg : "Error al subir.");
        } finally {
            setUploading(false);
        }
    };

    const exportXlsx = async () => {
        setExportingXlsx(true);
        try {
            await downloadRepairReportsResumenXlsx({ q: qDebounced || undefined });
            toast.success("Excel descargado.");
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "No se pudo exportar.");
        } finally {
            setExportingXlsx(false);
        }
    };

    const exportCsv = async () => {
        setExportingCsv(true);
        try {
            await downloadRepairReportsResumenCsv({ q: qDebounced || undefined });
            toast.success("CSV descargado.");
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "No se pudo exportar.");
        } finally {
            setExportingCsv(false);
        }
    };

    const openVincular = (row: RepairReportResumenItem) => {
        setVincRow(row);
        setVincNotas("");
        setVincOpen(true);
    };

    const submitVincular = async () => {
        if (!vincRow) return;
        setVincSubmitting(true);
        try {
            await createOperativoVincularReparo({
                repairReportId: vincRow.id,
                notas: vincNotas.trim() || null,
            });
            toast.success("Operativo ACTA_REPARO registrado y vinculado.");
            setVincOpen(false);
            setVincRow(null);
            void loadList();
        } catch (e: unknown) {
            const msg =
                (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
                "No se pudo vincular.";
            toast.error(typeof msg === "string" ? msg : "Error");
        } finally {
            setVincSubmitting(false);
        }
    };

    const openEdit = (row: RepairReportResumenItem) => {
        setEditingReportId(row.id);
        setEditingRow(row);
        setEditForm(resumenRowToActaForm(row));
        setEditFiscalPick(rowToFiscalPick(row));
        setEditSupPick(rowToSupPick(row));
        setEditOpen(true);
    };

    const submitEdit = async () => {
        if (!editingReportId) return;
        setEditSaving(true);
        try {
            const meta = enrichEditMetaPreservingLegacyText(
                mergeActaPersonnel(buildUploadMeta(editForm), editFiscalPick, editSupPick),
                editingRow,
                editFiscalPick,
                editSupPick,
            );
            await adminUpdateReparoActa(editingReportId, meta);
            toast.success("Acta actualizada.");
            setEditOpen(false);
            void loadList();
        } catch (e: unknown) {
            const msg =
                (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
                (e instanceof Error ? e.message : "No se pudo guardar.");
            toast.error(typeof msg === "string" ? msg : "Error");
        } finally {
            setEditSaving(false);
        }
    };

    const openDelete = (row: RepairReportResumenItem) => {
        setDeleteRow(row);
        setDeleteOpen(true);
    };

    const submitDelete = async () => {
        if (!deleteRow) return;
        setDeleteSubmitting(true);
        try {
            await adminDeleteReparoActa(deleteRow.id);
            toast.success("Acta eliminada.");
            setDeleteOpen(false);
            setDeleteRow(null);
            void loadList();
        } catch (e: unknown) {
            const msg =
                (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
                (e instanceof Error ? e.message : "No se pudo eliminar.");
            toast.error(typeof msg === "string" ? msg : "Error");
        } finally {
            setDeleteSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            <Card className="border-border/60 bg-card shadow-none">
                <CardHeader className="pb-4 border-b border-border/40">
                    <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <FileUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        Cargar Acta de Reparo
                    </CardTitle>
                    <CardDescription className="text-muted-foreground max-w-3xl">
                        Busque al contribuyente por nombre, RIF, n.º de providencia, parroquia, dirección, fiscal asignado
                        o pegue su UUID. Revise la vista previa antes de subir el PDF.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <UserSearch className="h-3.5 w-3.5" />
                            Buscar contribuyente
                        </Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Nombre, RIF, providencia, parroquia, fiscal, UUID… (mín. 2 caracteres)"
                                value={taxpayerSearch}
                                onChange={(e) => setTaxpayerSearch(e.target.value)}
                                className="pl-9 bg-background"
                                disabled={!!selectedTaxpayer}
                            />
                        </div>
                        {!selectedTaxpayer && taxpayerSearchDebounced.length >= 2 && (
                            <div className="rounded-md border border-border bg-muted/20 max-h-56 overflow-y-auto text-sm">
                                {taxpayerSearchLoading ? (
                                    <div className="p-3 text-muted-foreground">Buscando…</div>
                                ) : taxpayerResults.length === 0 ? (
                                    <div className="p-3 text-muted-foreground">Sin coincidencias en su alcance.</div>
                                ) : (
                                    <ul className="divide-y divide-border">
                                        {taxpayerResults.map((t) => (
                                            <li key={t.id}>
                                                <button
                                                    type="button"
                                                    className="w-full text-left px-3 py-2 hover:bg-muted/60 transition-colors"
                                                    onClick={() => pickTaxpayer(t)}
                                                >
                                                    <span className="font-medium text-foreground">{t.name}</span>
                                                    <span className="text-muted-foreground"> · {t.rif}</span>
                                                    <span className="block text-xs text-muted-foreground">
                                                        Prov. {t.providenceNum}
                                                        {t.parish ? ` · ${t.parish.name}` : ""}
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>

                    {selectedTaxpayer && (
                        <Card className="border-indigo-500/40 bg-indigo-950/10 dark:bg-indigo-950/30">
                            <CardHeader className="py-3 pb-2">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <CardTitle className="text-base text-foreground">Vista previa del contribuyente</CardTitle>
                                    <Button type="button" variant="outline" size="sm" onClick={clearTaxpayerSelection}>
                                        Cambiar contribuyente
                                    </Button>
                                </div>
                                <CardDescription>
                                    Confirme que es el registro correcto antes de adjuntar el PDF.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-2 text-sm pt-0 sm:grid-cols-2">
                                <p>
                                    <span className="text-muted-foreground">Razón social:</span>{" "}
                                    <span className="text-foreground font-medium">{selectedTaxpayer.name}</span>
                                </p>
                                <p>
                                    <span className="text-muted-foreground">RIF:</span>{" "}
                                    <span className="font-mono text-foreground">{selectedTaxpayer.rif}</span>
                                </p>
                                <p>
                                    <span className="text-muted-foreground">N.º providencia:</span>{" "}
                                    <span className="text-foreground">{selectedTaxpayer.providenceNum}</span>
                                </p>
                                <p>
                                    <span className="text-muted-foreground">Parroquia:</span>{" "}
                                    <span className="text-foreground">{selectedTaxpayer.parish?.name ?? "—"}</span>
                                </p>
                                <p>
                                    <span className="text-muted-foreground">Categoría:</span>{" "}
                                    <span className="text-foreground">{selectedTaxpayer.category?.name ?? "—"}</span>
                                </p>
                                <p>
                                    <span className="text-muted-foreground">Procedimiento:</span>{" "}
                                    <span className="text-foreground">{selectedTaxpayer.process}</span>
                                </p>
                                <p className="sm:col-span-2">
                                    <span className="text-muted-foreground">Dirección:</span>{" "}
                                    <span className="text-foreground">{selectedTaxpayer.address}</span>
                                </p>
                                <p>
                                    <span className="text-muted-foreground">Fecha emisión (SAC):</span>{" "}
                                    <span className="text-foreground">{fmtDateShort(selectedTaxpayer.emition_date)}</span>
                                </p>
                                <p>
                                    <span className="text-muted-foreground">Tipo contrato:</span>{" "}
                                    <span className="text-foreground">{selectedTaxpayer.contract_type}</span>
                                </p>
                                <p>
                                    <span className="text-muted-foreground">Fiscal asignado:</span>{" "}
                                    <span className="text-foreground">{selectedTaxpayer.fiscalAsignado?.name ?? "—"}</span>
                                </p>
                                <p className="sm:col-span-2">
                                    <span className="text-muted-foreground">UUID interno:</span>{" "}
                                    <span className="font-mono text-xs text-foreground break-all">{selectedTaxpayer.id}</span>
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <UsuarioActaPicker
                            tipo="FISCAL"
                            label="Fiscal actuante"
                            value={fiscalPick}
                            onPick={(u) => {
                                setFiscalPick(u);
                                setSupPick(null);
                            }}
                            onClear={() => {
                                setFiscalPick(null);
                                setSupPick(null);
                            }}
                            description="Seleccione el usuario fiscal del SAC. El grupo fiscal se asocia al acta según el fiscal elegido."
                        />
                        <UsuarioActaPicker
                            tipo="SUPERVISOR"
                            label="Supervisor"
                            value={supPick}
                            onPick={setSupPick}
                            onClear={() => setSupPick(null)}
                            description="Supervisor del SAC vinculado al acta. Si cambia el fiscal, vuelva a elegir supervisor si aplica."
                        />
                    </div>

                    <ActaMetadataFields form={actaForm} setForm={setActaForm} />

                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Archivo PDF</Label>
                        <Input
                            type="file"
                            accept="application/pdf,.pdf"
                            className="bg-background border-border cursor-pointer max-w-md"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            className="bg-amber-700 hover:bg-amber-600 text-white gap-2"
                            onClick={() => void submitUpload()}
                            disabled={uploading}
                        >
                            <FileUp className={`h-4 w-4 ${uploading ? "animate-pulse" : ""}`} />
                            Subir acta
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setActaForm(emptyActaForm());
                                setFiscalPick(null);
                                setSupPick(null);
                                setFile(null);
                            }}
                        >
                            Limpiar datos del acta
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border/60 bg-card shadow-none mt-6">
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-4 border-b border-border/40">
                    <div>
                        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <ScrollText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            Registro de Actas
                        </CardTitle>
                        <CardDescription>
                            Alcance según su rol. Busque por nombre, RIF o UUID. Descargue el Excel con el mismo formato
                            de la plantilla de control.
                            {isAdmin && " Como administrador puede editar metadatos o eliminar un acta."}
                        </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar…"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                className="pl-9 bg-background"
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => void loadList()}
                            disabled={listLoading}
                        >
                            <RefreshCw className={`h-4 w-4 ${listLoading ? "animate-spin" : ""}`} />
                            Actualizar
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            className="gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white"
                            onClick={() => void exportXlsx()}
                            disabled={exportingXlsx}
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            Reporte Excel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="gap-1.5"
                            onClick={() => void exportCsv()}
                            disabled={exportingCsv}
                        >
                            <FileDown className="h-4 w-4" />
                            CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-sm border border-border/60 overflow-x-auto max-h-[min(65vh,560px)] overflow-y-auto bg-card">
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-muted/10 backdrop-blur-sm">
                                <TableRow className="border-border/60 hover:bg-transparent">
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Contribuyente</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">RIF</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">N.º exp.</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">N.º reparo</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Impuesto</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Total</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Fiscal (acta)</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Fiscal SAC</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Operativo</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">PDF</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right min-w-[200px]">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {listLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={11}>
                                                <Skeleton className="h-9 w-full" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : items.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={11}
                                            className="text-center text-muted-foreground py-10 text-sm"
                                        >
                                            No hay actas en su alcance o ningún resultado coincide con la búsqueda.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((r) => (
                                        <TableRow key={r.id} className="border-border">
                                            <TableCell className="font-medium text-foreground max-w-[180px]">
                                                <span className="line-clamp-2" title={r.contribuyente}>
                                                    {r.contribuyente}
                                                </span>
                                                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                                                    {r.taxpayerId.slice(0, 8)}…
                                                </p>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                                {r.rif}
                                            </TableCell>
                                            <TableCell className="text-xs whitespace-nowrap">
                                                {r.numeroExpediente ?? "—"}
                                            </TableCell>
                                            <TableCell className="text-xs whitespace-nowrap">
                                                {r.numeroReparo ?? "—"}
                                            </TableCell>
                                            <TableCell className="text-xs">{r.impuestoTipo ?? "—"}</TableCell>
                                            <TableCell className="text-xs tabular-nums whitespace-nowrap">
                                                {fmtMoney(r.montoTotal)}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                                                {r.fiscalActuante ?? "—"}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                                                {r.fiscalNombre ?? "—"}
                                            </TableCell>
                                            <TableCell>
                                                {r.vinculadoAOperativo ? (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Vinculado
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs text-amber-700 dark:text-amber-400 border-amber-600/40"
                                                    >
                                                        Pendiente
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="h-8 gap-1" asChild>
                                                    <a href={r.pdf_url} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                        Abrir
                                                    </a>
                                                </Button>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-wrap justify-end gap-1">
                                                    {!r.vinculadoAOperativo && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 gap-1"
                                                            onClick={() => openVincular(r)}
                                                        >
                                                            <Link2 className="h-3.5 w-3.5" />
                                                            Vincular
                                                        </Button>
                                                    )}
                                                    {isAdmin && (
                                                        <>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 gap-1"
                                                                onClick={() => openEdit(r)}
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                                Editar
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 gap-1 text-destructive border-destructive/40 hover:bg-destructive/10"
                                                                onClick={() => openDelete(r)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                Eliminar
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={vincOpen} onOpenChange={setVincOpen}>
                <DialogContent className="bg-card border-border text-card-foreground max-w-md">
                    <DialogHeader>
                        <DialogTitle>Vincular ACTA_REPARO</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Crea el operativo de fiscalización tipo acta de reparo enlazado a este PDF. Solo un operativo
                            por acta.
                        </DialogDescription>
                    </DialogHeader>
                    {vincRow && (
                        <div className="grid gap-2 text-sm py-2">
                            <p>
                                <span className="text-muted-foreground">Contribuyente:</span>{" "}
                                <span className="text-foreground font-medium">{vincRow.contribuyente}</span>
                            </p>
                            <div className="space-y-1">
                                <Label>Notas (opcional)</Label>
                                <Textarea
                                    value={vincNotas}
                                    onChange={(e) => setVincNotas(e.target.value)}
                                    className="bg-background min-h-[72px]"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setVincOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-500"
                            onClick={() => void submitVincular()}
                            disabled={vincSubmitting}
                        >
                            Registrar y vincular
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={editOpen}
                onOpenChange={(open) => {
                    setEditOpen(open);
                    if (!open) {
                        setEditingReportId(null);
                        setEditingRow(null);
                        setEditForm(emptyActaForm());
                        setEditFiscalPick(null);
                        setEditSupPick(null);
                    }
                }}
            >
                <DialogContent className="bg-card border-border text-card-foreground max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar metadatos del acta</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Solo administradores. El PDF no se reemplaza desde aquí.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2 space-y-3">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <UsuarioActaPicker
                                tipo="FISCAL"
                                label="Fiscal actuante"
                                value={editFiscalPick}
                                onPick={(u) => {
                                    setEditFiscalPick(u);
                                    setEditSupPick(null);
                                }}
                                onClear={() => {
                                    setEditFiscalPick(null);
                                    setEditSupPick(null);
                                }}
                                description="Usuario fiscal enlazado al acta y grupo fiscal derivado en sistema."
                            />
                            <UsuarioActaPicker
                                tipo="SUPERVISOR"
                                label="Supervisor"
                                value={editSupPick}
                                onPick={setEditSupPick}
                                onClear={() => setEditSupPick(null)}
                                description="Usuario supervisor enlazado al acta."
                            />
                        </div>
                        <ActaMetadataFields form={editForm} setForm={setEditForm} />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setEditOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-500"
                            onClick={() => void submitEdit()}
                            disabled={editSaving}
                        >
                            Guardar cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="bg-card border-border text-card-foreground max-w-md">
                    <DialogHeader>
                        <DialogTitle>Eliminar acta de reparo</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Solo administradores. Se borra el registro y el enlace al PDF en el SAC. Si había un operativo
                            vinculado, quedará sin acta asociada.
                        </DialogDescription>
                    </DialogHeader>
                    {deleteRow && (
                        <p className="text-sm text-foreground py-2">
                            ¿Eliminar el acta de <strong>{deleteRow.contribuyente}</strong> ({deleteRow.rif})?
                        </p>
                    )}
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => void submitDelete()}
                            disabled={deleteSubmitting}
                        >
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
