/**
 * Planificación UI — módulo Fiscalización
 * - Fase 2: pestañas «Operativos» (listado + alta) y «Personal» (listado + alta para admin/coordinador).
 * - Fase 3: pestaña «Resumen» — presets mensual / trimestral / semestral / anual, fecha de referencia,
 *   datos de GET /fiscal-operaciones/dashboard/resumen (mismo alcance por rol que listados).
 * - Fase 4: «Exportar PDF» → GET /fiscal-operaciones/dashboard/export-pdf (mismos query que el resumen).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getParishList } from "@/components/utils/api/taxpayer-functions";
import {
    createOperativoFiscal,
    downloadDashboardResumenPdf,
    getDashboardResumen,
    listGestionPersonal,
    listOperativosFiscales,
    listRepairReportsForTaxpayer,
    type DashboardResumenResponse,
    type GestionPersonalRow,
    type OperativoFiscalRow,
    type PeriodPreset,
    type RepairReportListItem,
    type TipoEstatusPersonal,
    type TipoOperativoFiscal,
} from "@/components/utils/api/fiscal-operaciones-functions";
import { PageHeader } from "@/components/UI/v2";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/UI/tabs";
import { Button } from "@/components/UI/button";
import { Input } from "@/components/UI/input";
import { Label } from "@/components/UI/label";
import { Textarea } from "@/components/UI/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/UI/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/UI/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/UI/select";
import { Badge } from "@/components/UI/badge";
import { PersonalFiscalPanel } from "@/components/gestion-personal/personal-fiscal-panel";
import { RegistrarAusenciaDialog } from "@/components/gestion-personal/registrar-ausencia-dialog";
import { ReparosActasSection } from "@/components/gestion-personal/reparos-actas-section";
import { BarChart3, FileDown, Plus, RefreshCw, ScrollText, UserRoundSearch } from "lucide-react";
import toast from "react-hot-toast";

const TIPO_OPERATIVO_LABELS: Record<TipoOperativoFiscal, string> = {
    VDF: "VDF (deberes formales)",
    SANCION_RESOLUCION: "Resolución de sanción",
    DESTRUCCION_FACTURAS: "Destrucción de facturas",
    DIVULGACION: "Divulgación",
    PRESENCIA_FISCAL: "Presencia fiscal",
    ACTA_REPARO: "Acta de reparo",
};

const ESTATUS_LABELS: Record<TipoEstatusPersonal, string> = {
    PERMISO: "Permiso",
    REPOSO: "Reposo médico",
    VACACIONES: "Vacaciones",
};

const TIPOS_OPERATIVO: TipoOperativoFiscal[] = [
    "VDF",
    "SANCION_RESOLUCION",
    "DESTRUCCION_FACTURAS",
    "DIVULGACION",
    "PRESENCIA_FISCAL",
    "ACTA_REPARO",
];

const ESTATUS_LIST: TipoEstatusPersonal[] = ["PERMISO", "REPOSO", "VACACIONES"];

const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
    { value: "MONTH", label: "Mensual" },
    { value: "QUARTER", label: "Trimestral" },
    { value: "HALF_YEAR", label: "Semestral" },
    { value: "YEAR", label: "Anual" },
];

function labelTipoContrib(v: string | null) {
    if (v === "ORDINARY") return "Ordinario";
    if (v === "SPECIAL") return "Especial";
    return "Sin clasificar";
}

function monthRangeStrings() {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    return { from: iso(from), to: iso(to) };
}

type OpDetalleForm = {
    vdfRef: string;
    vdfObs: string;
    sanRes: string;
    sanMonto: string;
    sanMotivo: string;
    desActa: string;
    desTal: string;
    desFol: string;
    desLugar: string;
    divTema: string;
    divMod: string;
    divVis: string;
    presEst: string;
    presHi: string;
    presHf: string;
    presRes: string;
    repActa: string;
};

function emptyOpDetalle(): OpDetalleForm {
    return {
        vdfRef: "",
        vdfObs: "",
        sanRes: "",
        sanMonto: "",
        sanMotivo: "",
        desActa: "",
        desTal: "",
        desFol: "",
        desLugar: "",
        divTema: "",
        divMod: "",
        divVis: "",
        presEst: "",
        presHi: "",
        presHf: "",
        presRes: "",
        repActa: "",
    };
}

function buildOpDetallePayload(tipo: TipoOperativoFiscal, d: OpDetalleForm): Record<string, unknown> | undefined {
    const out: Record<string, unknown> = {};
    const n = (s: string) => {
        const t = s.trim();
        return t === "" ? undefined : t;
    };
    switch (tipo) {
        case "VDF":
            if (n(d.vdfRef)) out.numeroReferencia = n(d.vdfRef);
            if (n(d.vdfObs)) out.observacion = n(d.vdfObs);
            break;
        case "SANCION_RESOLUCION":
            if (n(d.sanRes)) out.numeroResolucion = n(d.sanRes);
            if (n(d.sanMonto)) {
                const x = Number(String(d.sanMonto).replace(",", "."));
                if (!Number.isNaN(x)) out.monto = x;
            }
            if (n(d.sanMotivo)) out.motivo = n(d.sanMotivo);
            break;
        case "DESTRUCCION_FACTURAS":
            if (n(d.desActa)) out.numeroActa = n(d.desActa);
            if (n(d.desTal)) {
                const x = parseInt(d.desTal, 10);
                if (!Number.isNaN(x)) out.talonarios = x;
            }
            if (n(d.desFol)) {
                const x = parseInt(d.desFol, 10);
                if (!Number.isNaN(x)) out.folios = x;
            }
            if (n(d.desLugar)) out.lugar = n(d.desLugar);
            break;
        case "DIVULGACION":
            if (n(d.divTema)) out.tema = n(d.divTema);
            if (n(d.divMod)) out.modalidad = n(d.divMod);
            if (n(d.divVis)) {
                const x = parseInt(d.divVis, 10);
                if (!Number.isNaN(x)) out.visitasOContactos = x;
            }
            break;
        case "PRESENCIA_FISCAL":
            if (n(d.presEst)) out.establecimiento = n(d.presEst);
            if (n(d.presHi)) out.horaInicio = n(d.presHi);
            if (n(d.presHf)) out.horaFin = n(d.presHf);
            if (n(d.presRes)) out.resultado = n(d.presRes);
            break;
        case "ACTA_REPARO":
            if (n(d.repActa)) out.numeroActa = n(d.repActa);
            break;
        default:
            break;
    }
    return Object.keys(out).length > 0 ? out : undefined;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formatShortDate(iso: string) {
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

export default function FiscalizacionPageV2() {
    const { user } = useAuth();
    const defaults = useMemo(() => monthRangeStrings(), []);

    const [mainTab, setMainTab] = useState("panel");
    const [dashPreset, setDashPreset] = useState<PeriodPreset>("MONTH");
    const [dashRefDate, setDashRefDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [dashData, setDashData] = useState<DashboardResumenResponse | null>(null);
    const [dashLoading, setDashLoading] = useState(false);
    const [pdfExporting, setPdfExporting] = useState(false);

    const [opFrom, setOpFrom] = useState(defaults.from);
    const [opTo, setOpTo] = useState(defaults.to);
    const [opTipo, setOpTipo] = useState<string>("");
    const [operativos, setOperativos] = useState<OperativoFiscalRow[]>([]);
    const [opLoading, setOpLoading] = useState(true);

    const [perFrom, setPerFrom] = useState(defaults.from);
    const [perTo, setPerTo] = useState(defaults.to);
    const [personalRows, setPersonalRows] = useState<GestionPersonalRow[]>([]);
    const [perLoading, setPerLoading] = useState(true);

    const [parishes, setParishes] = useState<{ id: string; name: string }[]>([]);

    const [opDialogOpen, setOpDialogOpen] = useState(false);
    const [opSubmitting, setOpSubmitting] = useState(false);
    const [opForm, setOpForm] = useState({
        tipo: "VDF" as TipoOperativoFiscal,
        fecha: new Date().toISOString().slice(0, 10),
        parishId: "",
        taxpayerId: "",
        tipoContribuyente: "" as "" | "ORDINARY" | "SPECIAL",
        operativoOrigenId: "",
        repairReportId: "",
        notas: "",
    });

    const [perDialogOpen, setPerDialogOpen] = useState(false);

    const [opDetalle, setOpDetalle] = useState<OpDetalleForm>(() => emptyOpDetalle());
    const [repairOptions, setRepairOptions] = useState<RepairReportListItem[]>([]);
    const [repairLoading, setRepairLoading] = useState(false);

    const canRegisterPersonal = user?.role === "COORDINATOR" || user?.role === "ADMIN";

    const personalResumenEnRango = useMemo(() => {
        const m: Record<TipoEstatusPersonal, number> = { PERMISO: 0, REPOSO: 0, VACACIONES: 0 };
        for (const r of personalRows) {
            m[r.estatus] = (m[r.estatus] ?? 0) + 1;
        }
        return m;
    }, [personalRows]);

    const loadOperativos = useCallback(async () => {
        setOpLoading(true);
        try {
            const data = await listOperativosFiscales({
                dateFrom: opFrom,
                dateTo: opTo,
                tipo: (opTipo || undefined) as TipoOperativoFiscal | undefined,
            });
            setOperativos(data.items ?? []);
        } catch {
            toast.error("No se pudieron cargar los operativos.");
            setOperativos([]);
        } finally {
            setOpLoading(false);
        }
    }, [opFrom, opTo, opTipo]);

    const loadPersonal = useCallback(async () => {
        setPerLoading(true);
        try {
            const data = await listGestionPersonal({ dateFrom: perFrom, dateTo: perTo });
            setPersonalRows(data.items ?? []);
        } catch {
            toast.error("No se pudieron cargar las incidencias de personal.");
            setPersonalRows([]);
        } finally {
            setPerLoading(false);
        }
    }, [perFrom, perTo]);

    useEffect(() => {
        loadOperativos();
    }, [loadOperativos]);

    useEffect(() => {
        loadPersonal();
    }, [loadPersonal]);

    const loadDashboard = useCallback(async () => {
        setDashLoading(true);
        try {
            const data = await getDashboardResumen({
                preset: dashPreset,
                referenceDate: new Date(dashRefDate + "T12:00:00").toISOString(),
            });
            setDashData(data);
        } catch {
            toast.error("No se pudo cargar el resumen del periodo.");
            setDashData(null);
        } finally {
            setDashLoading(false);
        }
    }, [dashPreset, dashRefDate]);

    useEffect(() => {
        if (mainTab !== "resumen") return;
        void loadDashboard();
    }, [mainTab, loadDashboard]);

    useEffect(() => {
        if (opDialogOpen) {
            setOpDetalle(emptyOpDetalle());
            setRepairOptions([]);
        }
    }, [opDialogOpen]);

    const exportDashboardPdf = async () => {
        setPdfExporting(true);
        try {
            await downloadDashboardResumenPdf({
                preset: dashPreset,
                referenceDate: new Date(dashRefDate + "T12:00:00").toISOString(),
            });
            toast.success("PDF descargado.");
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "No se pudo exportar el PDF.";
            toast.error(msg);
        } finally {
            setPdfExporting(false);
        }
    };

    useEffect(() => {
        const loadParishes = async () => {
            try {
                const res = await getParishList();
                const raw = res?.data;
                if (Array.isArray(raw)) setParishes(raw);
            } catch {
                /* opcional */
            }
        };
        loadParishes();
    }, []);

    const loadRepairOptions = async () => {
        const tid = opForm.taxpayerId.trim();
        if (!UUID_RE.test(tid)) {
            toast.error("Indique el UUID del contribuyente antes de cargar las actas de reparo.");
            return;
        }
        setRepairLoading(true);
        try {
            const data = await listRepairReportsForTaxpayer(tid);
            setRepairOptions(data.items ?? []);
            const n = (data.items ?? []).length;
            if (n === 0) toast("No hay PDFs de reparo registrados para este contribuyente.");
        } catch {
            toast.error("No se pudieron cargar los reportes de reparo.");
            setRepairOptions([]);
        } finally {
            setRepairLoading(false);
        }
    };

    const submitOperativo = async () => {
        setOpSubmitting(true);
        try {
            const emptyToNull = (s: string) => {
                const t = s.trim();
                return t === "" ? null : t;
            };
            const detallePayload = buildOpDetallePayload(opForm.tipo, opDetalle);
            await createOperativoFiscal({
                tipo: opForm.tipo,
                fecha: opForm.fecha ? new Date(opForm.fecha).toISOString() : undefined,
                parishId: emptyToNull(opForm.parishId),
                taxpayerId: emptyToNull(opForm.taxpayerId),
                tipoContribuyente:
                    opForm.tipoContribuyente === "" ? null : opForm.tipoContribuyente,
                operativoOrigenId: emptyToNull(opForm.operativoOrigenId),
                repairReportId: emptyToNull(opForm.repairReportId),
                notas: emptyToNull(opForm.notas),
                detalle: detallePayload ?? null,
            });
            toast.success("Operativo registrado.");
            setOpDialogOpen(false);
            loadOperativos();
        } catch (e: unknown) {
            const msg =
                (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
                "No se pudo registrar el operativo.";
            toast.error(typeof msg === "string" ? msg : "Error al registrar.");
        } finally {
            setOpSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Gestión de personal y operativos"
                description="Panel por fiscal (VDF, reparos, visitas, contribuyentes), resumen global, operativos de campo y permisos/vacaciones/reposo. Admin ve todo; coordinador, su grupo."
            />

            <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
                <TabsList className="bg-muted/80 border border-border flex flex-wrap h-auto gap-1 py-1">
                    <TabsTrigger value="panel" className="data-[state=active]:bg-indigo-600/20 gap-1.5">
                        <UserRoundSearch className="h-3.5 w-3.5" />
                        Panel fiscal
                    </TabsTrigger>
                    <TabsTrigger value="resumen" className="data-[state=active]:bg-indigo-600/20 gap-1.5">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Resumen
                    </TabsTrigger>
                    <TabsTrigger value="operativos" className="data-[state=active]:bg-indigo-600/20">
                        Operativos de campo
                    </TabsTrigger>
                    <TabsTrigger value="reparos" className="data-[state=active]:bg-indigo-600/20 gap-1.5">
                        <ScrollText className="h-3.5 w-3.5" />
                        Actas de reparo
                    </TabsTrigger>
                    <TabsTrigger value="personal" className="data-[state=active]:bg-indigo-600/20">
                        Permisos y vacaciones
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="panel" className="mt-4 space-y-4">
                    <PersonalFiscalPanel />
                </TabsContent>

                <TabsContent value="resumen" className="mt-4 space-y-4">
                    <Card className="border-border bg-card text-card-foreground shadow-sm">
                        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-indigo-400" />
                                    Resumen por periodo
                                </CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    Mismos datos que verá un reporte PDF: totales y desgloses según su rol (admin global,
                                    coordinador por grupo, etc.).
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2 items-end">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs">Periodo</Label>
                                    <Select
                                        value={dashPreset}
                                        onValueChange={(v) => setDashPreset(v as PeriodPreset)}
                                    >
                                        <SelectTrigger className="w-[160px] bg-background border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PERIOD_PRESETS.map((p) => (
                                                <SelectItem key={p.value} value={p.value}>
                                                    {p.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs">Fecha de referencia</Label>
                                    <Input
                                        type="date"
                                        value={dashRefDate}
                                        onChange={(e) => setDashRefDate(e.target.value)}
                                        className="w-[160px] bg-background border-border"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-border text-foreground"
                                    onClick={() => void loadDashboard()}
                                    disabled={dashLoading}
                                >
                                    <RefreshCw className={`h-4 w-4 mr-1 ${dashLoading ? "animate-spin" : ""}`} />
                                    Actualizar
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-emerald-700 hover:bg-emerald-600 text-foreground"
                                    onClick={() => void exportDashboardPdf()}
                                    disabled={pdfExporting || dashLoading}
                                >
                                    <FileDown className={`h-4 w-4 mr-1 ${pdfExporting ? "animate-pulse" : ""}`} />
                                    Exportar PDF
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {dashLoading && !dashData ? (
                                <p className="text-muted-foreground text-center py-8">Cargando resumen…</p>
                            ) : !dashData?.periodo ? (
                                <p className="text-muted-foreground text-center py-8">Sin datos.</p>
                            ) : (
                                <>
                                    <p className="text-sm text-muted-foreground">
                                        Periodo calculado:{" "}
                                        <span className="text-foreground font-medium">
                                            {formatShortDate(dashData.periodo.from)} —{" "}
                                            {formatShortDate(dashData.periodo.to)}
                                        </span>
                                        {user?.role && (
                                            <span className="text-muted-foreground">
                                                {" "}
                                                · visión: <span className="text-foreground">{user.role}</span>
                                            </span>
                                        )}
                                    </p>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <Card className="border-border bg-muted/30 dark:bg-slate-950/50">
                                            <CardHeader className="pb-2">
                                                <CardDescription className="text-muted-foreground">
                                                    Operativos totales
                                                </CardDescription>
                                                <CardTitle className="text-3xl text-foreground tabular-nums">
                                                    {dashData.operativos.total}
                                                </CardTitle>
                                            </CardHeader>
                                        </Card>
                                        <Card className="border-border bg-muted/30 dark:bg-slate-950/50">
                                            <CardHeader className="pb-2">
                                                <CardDescription className="text-muted-foreground">
                                                    Incidencias personal
                                                </CardDescription>
                                                <CardTitle className="text-3xl text-foreground tabular-nums">
                                                    {dashData.personal.totalIncidencias}
                                                </CardTitle>
                                            </CardHeader>
                                        </Card>
                                    </div>

                                    <div className="grid gap-6 lg:grid-cols-2">
                                        <Card className="border-border bg-muted/25 dark:bg-slate-950/40">
                                            <CardHeader>
                                                <CardTitle className="text-base text-foreground">
                                                    Por tipo de operativo
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                {(() => {
                                                    const rows = dashData.operativos.porTipo;
                                                    const max = Math.max(
                                                        1,
                                                        ...rows.map((r) => r.count),
                                                    );
                                                    return rows.length === 0 ? (
                                                        <p className="text-muted-foreground text-sm">Sin registros.</p>
                                                    ) : (
                                                        rows.map((r) => (
                                                            <div key={r.tipo} className="space-y-1">
                                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                                    <span>{TIPO_OPERATIVO_LABELS[r.tipo]}</span>
                                                                    <span className="tabular-nums">{r.count}</span>
                                                                </div>
                                                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full bg-indigo-500/80"
                                                                        style={{
                                                                            width: `${(r.count / max) * 100}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))
                                                    );
                                                })()}
                                            </CardContent>
                                        </Card>

                                        <Card className="border-border bg-muted/25 dark:bg-slate-950/40">
                                            <CardHeader>
                                                <CardTitle className="text-base text-foreground">
                                                    Personal por estatus
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                {dashData.personal.porEstatus.length === 0 ? (
                                                    <p className="text-muted-foreground text-sm">Sin registros.</p>
                                                ) : (
                                                    dashData.personal.porEstatus.map((r) => (
                                                        <div
                                                            key={r.estatus}
                                                            className="flex justify-between text-sm border-b border-border pb-2"
                                                        >
                                                            <span className="text-foreground">
                                                                {ESTATUS_LABELS[r.estatus]}
                                                            </span>
                                                            <span className="text-foreground tabular-nums font-medium">
                                                                {r.count}
                                                            </span>
                                                        </div>
                                                    ))
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="grid gap-6 lg:grid-cols-2">
                                        <Card className="border-border bg-muted/25 dark:bg-slate-950/40">
                                            <CardHeader>
                                                <CardTitle className="text-base text-foreground">
                                                    Contribuyente (ordinario / especial)
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="border-border hover:bg-transparent">
                                                            <TableHead className="text-muted-foreground">Tipo</TableHead>
                                                            <TableHead className="text-muted-foreground text-right">
                                                                Cantidad
                                                            </TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {dashData.operativos.porTipoContribuyente.length === 0 ? (
                                                            <TableRow>
                                                                <TableCell
                                                                    colSpan={2}
                                                                    className="text-muted-foreground text-sm"
                                                                >
                                                                    Sin datos clasificados.
                                                                </TableCell>
                                                            </TableRow>
                                                        ) : (
                                                            dashData.operativos.porTipoContribuyente.map((r, i) => (
                                                                <TableRow key={`${r.tipoContribuyente ?? "null"}-${i}`} className="border-border">
                                                                    <TableCell className="text-foreground">
                                                                        {labelTipoContrib(r.tipoContribuyente)}
                                                                    </TableCell>
                                                                    <TableCell className="text-foreground text-right tabular-nums">
                                                                        {r.count}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-border bg-muted/25 dark:bg-slate-950/40">
                                            <CardHeader>
                                                <CardTitle className="text-base text-foreground">
                                                    Por parroquia (donde aplica)
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="border-border hover:bg-transparent">
                                                            <TableHead className="text-muted-foreground">Parroquia</TableHead>
                                                            <TableHead className="text-muted-foreground text-right">
                                                                Operativos
                                                            </TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {dashData.operativos.porParroquia.length === 0 ? (
                                                            <TableRow>
                                                                <TableCell
                                                                    colSpan={2}
                                                                    className="text-muted-foreground text-sm"
                                                                >
                                                                    Sin parroquia registrada en el periodo.
                                                                </TableCell>
                                                            </TableRow>
                                                        ) : (
                                                            dashData.operativos.porParroquia.map((r) => (
                                                                <TableRow key={r.parishId} className="border-border">
                                                                    <TableCell className="text-foreground">
                                                                        {r.parishName}
                                                                    </TableCell>
                                                                    <TableCell className="text-foreground text-right tabular-nums">
                                                                        {r.count}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="operativos" className="mt-4">
                    <Card className="border-border bg-card text-card-foreground shadow-sm">
                        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <CardTitle className="text-lg text-foreground">Operativos fiscales</CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    Filtra por rango (por defecto el mes en curso) y tipo.
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-border text-foreground"
                                    onClick={() => loadOperativos()}
                                    disabled={opLoading}
                                >
                                    <RefreshCw className={`h-4 w-4 mr-1 ${opLoading ? "animate-spin" : ""}`} />
                                    Actualizar
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-indigo-600 hover:bg-indigo-500"
                                    onClick={() => setOpDialogOpen(true)}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Registrar operativo
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-3 items-end">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs">Desde</Label>
                                    <Input
                                        type="date"
                                        value={opFrom}
                                        onChange={(e) => setOpFrom(e.target.value)}
                                        className="bg-background border-border w-[160px]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs">Hasta</Label>
                                    <Input
                                        type="date"
                                        value={opTo}
                                        onChange={(e) => setOpTo(e.target.value)}
                                        className="bg-background border-border w-[160px]"
                                    />
                                </div>
                                <div className="space-y-1 min-w-[200px]">
                                    <Label className="text-muted-foreground text-xs">Tipo</Label>
                                    <Select value={opTipo || "__all__"} onValueChange={(v) => setOpTipo(v === "__all__" ? "" : v)}>
                                        <SelectTrigger className="bg-background border-border text-foreground">
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__all__">Todos</SelectItem>
                                            {TIPOS_OPERATIVO.map((t) => (
                                                <SelectItem key={t} value={t}>
                                                    {TIPO_OPERATIVO_LABELS[t]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="rounded-md border border-border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border hover:bg-transparent">
                                            <TableHead className="text-muted-foreground">Fecha</TableHead>
                                            <TableHead className="text-muted-foreground">Tipo</TableHead>
                                            <TableHead className="text-muted-foreground">Parroquia</TableHead>
                                            <TableHead className="text-muted-foreground">Contribuyente</TableHead>
                                            <TableHead className="text-muted-foreground">Registró</TableHead>
                                            <TableHead className="text-muted-foreground">Reparo</TableHead>
                                            <TableHead className="text-muted-foreground">Notas</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {opLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-muted-foreground text-center py-8">
                                                    Cargando…
                                                </TableCell>
                                            </TableRow>
                                        ) : operativos.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-muted-foreground text-center py-8">
                                                    No hay registros en este rango.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            operativos.map((row) => (
                                                <TableRow key={row.id} className="border-border">
                                                    <TableCell className="text-foreground whitespace-nowrap">
                                                        {formatShortDate(row.fecha)}
                                                    </TableCell>
                                                    <TableCell className="text-foreground">
                                                        {TIPO_OPERATIVO_LABELS[row.tipo] ?? row.tipo}
                                                    </TableCell>
                                                    <TableCell className="text-foreground">
                                                        {row.parish?.name ?? "—"}
                                                    </TableCell>
                                                    <TableCell className="text-foreground max-w-[200px] truncate">
                                                        {row.taxpayer
                                                            ? `${row.taxpayer.name} (${row.taxpayer.rif})`
                                                            : "—"}
                                                    </TableCell>
                                                    <TableCell className="text-foreground">
                                                        {row.creadoPor?.name ?? row.creadoPorId}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground font-mono text-xs max-w-[100px] truncate">
                                                        {row.repairReportId ? `${row.repairReportId.slice(0, 8)}…` : "—"}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground max-w-[220px] truncate">
                                                        {row.notas ?? "—"}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reparos" className="mt-4 focus-visible:outline-none">
                    <ReparosActasSection />
                </TabsContent>

                <TabsContent value="personal" className="mt-4">
                    <Card className="border-border bg-card text-card-foreground shadow-sm">
                        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <CardTitle className="text-lg text-foreground">Permisos, vacaciones y reposo</CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    Visualice las ventanas registradas en el rango y agregue nuevas incidencias
                                    (coordinador o administrador).
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-border text-foreground"
                                    onClick={() => loadPersonal()}
                                    disabled={perLoading}
                                >
                                    <RefreshCw className={`h-4 w-4 mr-1 ${perLoading ? "animate-spin" : ""}`} />
                                    Actualizar
                                </Button>
                                {canRegisterPersonal && (
                                    <Button
                                        size="sm"
                                        className="bg-indigo-600 hover:bg-indigo-500"
                                        onClick={() => setPerDialogOpen(true)}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Registrar incidencia
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-3 items-end">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs">Desde</Label>
                                    <Input
                                        type="date"
                                        value={perFrom}
                                        onChange={(e) => setPerFrom(e.target.value)}
                                        className="bg-background border-border w-[160px]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs">Hasta</Label>
                                    <Input
                                        type="date"
                                        value={perTo}
                                        onChange={(e) => setPerTo(e.target.value)}
                                        className="bg-background border-border w-[160px]"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                {ESTATUS_LIST.map((st) => (
                                    <Card key={st} className="border-border bg-muted/30 dark:bg-slate-950/50">
                                        <CardHeader className="py-3 pb-2">
                                            <CardDescription className="text-muted-foreground text-xs">
                                                {ESTATUS_LABELS[st]}
                                            </CardDescription>
                                            <CardTitle className="text-2xl text-foreground tabular-nums">
                                                {personalResumenEnRango[st] ?? 0}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0 pb-3">
                                            <Badge variant="secondary" className="text-xs">
                                                En el rango de fechas
                                            </Badge>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <div className="rounded-md border border-border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border hover:bg-transparent">
                                            <TableHead className="text-muted-foreground">Funcionario</TableHead>
                                            <TableHead className="text-muted-foreground">Estatus</TableHead>
                                            <TableHead className="text-muted-foreground">Inicio</TableHead>
                                            <TableHead className="text-muted-foreground">Fin</TableHead>
                                            <TableHead className="text-muted-foreground">Coordinador</TableHead>
                                            <TableHead className="text-muted-foreground">Motivo</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {perLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-muted-foreground text-center py-8">
                                                    Cargando…
                                                </TableCell>
                                            </TableRow>
                                        ) : personalRows.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-muted-foreground text-center py-8">
                                                    No hay registros en este rango.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            personalRows.map((row) => (
                                                <TableRow key={row.id} className="border-border">
                                                    <TableCell className="text-foreground">
                                                        {row.usuario?.name ?? row.usuarioId}
                                                    </TableCell>
                                                    <TableCell className="text-foreground">
                                                        {ESTATUS_LABELS[row.estatus] ?? row.estatus}
                                                    </TableCell>
                                                    <TableCell className="text-foreground whitespace-nowrap">
                                                        {formatShortDate(row.fechaInicio)}
                                                    </TableCell>
                                                    <TableCell className="text-foreground whitespace-nowrap">
                                                        {formatShortDate(row.fechaFin)}
                                                    </TableCell>
                                                    <TableCell className="text-foreground">
                                                        {row.coordinador?.name ?? row.coordinadorId}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                                                        {row.motivo ?? "—"}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={opDialogOpen} onOpenChange={setOpDialogOpen}>
                <DialogContent className="bg-card border-border text-card-foreground max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Registrar operativo</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Los campos opcionales pueden completarse según el tipo de actuación.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                        <div className="space-y-1">
                            <Label className="text-foreground">Tipo</Label>
                            <Select
                                value={opForm.tipo}
                                onValueChange={(v) => {
                                    const t = v as TipoOperativoFiscal;
                                    setOpForm((f) => ({
                                        ...f,
                                        tipo: t,
                                        repairReportId: t === "ACTA_REPARO" ? f.repairReportId : "",
                                    }));
                                    setRepairOptions([]);
                                }}
                            >
                                <SelectTrigger className="bg-background border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIPOS_OPERATIVO.map((t) => (
                                        <SelectItem key={t} value={t}>
                                            {TIPO_OPERATIVO_LABELS[t]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-foreground">Fecha del hecho</Label>
                            <Input
                                type="date"
                                value={opForm.fecha}
                                onChange={(e) => setOpForm((f) => ({ ...f, fecha: e.target.value }))}
                                className="bg-background border-border"
                            />
                        </div>

                        <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Datos del tipo seleccionado
                            </p>
                            {opForm.tipo === "VDF" && (
                                <>
                                    <div className="space-y-1">
                                        <Label className="text-foreground text-xs">Núm. referencia</Label>
                                        <Input
                                            value={opDetalle.vdfRef}
                                            onChange={(e) => setOpDetalle((d) => ({ ...d, vdfRef: e.target.value }))}
                                            className="bg-background border-border"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-foreground text-xs">Observación</Label>
                                        <Textarea
                                            value={opDetalle.vdfObs}
                                            onChange={(e) => setOpDetalle((d) => ({ ...d, vdfObs: e.target.value }))}
                                            className="bg-background border-border min-h-[72px]"
                                        />
                                    </div>
                                </>
                            )}
                            {opForm.tipo === "SANCION_RESOLUCION" && (
                                <>
                                    <p className="text-xs text-muted-foreground">
                                        Complementa el módulo de multas del contribuyente: aquí queda el registro
                                        agregado del operativo de campo.
                                    </p>
                                    <div className="space-y-1">
                                        <Label className="text-foreground text-xs">Número de resolución</Label>
                                        <Input
                                            value={opDetalle.sanRes}
                                            onChange={(e) => setOpDetalle((d) => ({ ...d, sanRes: e.target.value }))}
                                            className="bg-background border-border"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-foreground text-xs">Monto (Bs.)</Label>
                                        <Input
                                            value={opDetalle.sanMonto}
                                            onChange={(e) => setOpDetalle((d) => ({ ...d, sanMonto: e.target.value }))}
                                            className="bg-background border-border"
                                            inputMode="decimal"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-foreground text-xs">Motivo</Label>
                                        <Textarea
                                            value={opDetalle.sanMotivo}
                                            onChange={(e) => setOpDetalle((d) => ({ ...d, sanMotivo: e.target.value }))}
                                            className="bg-background border-border min-h-[64px]"
                                        />
                                    </div>
                                </>
                            )}
                            {opForm.tipo === "DESTRUCCION_FACTURAS" && (
                                <>
                                    <div className="space-y-1">
                                        <Label className="text-foreground text-xs">Número de acta</Label>
                                        <Input
                                            value={opDetalle.desActa}
                                            onChange={(e) => setOpDetalle((d) => ({ ...d, desActa: e.target.value }))}
                                            className="bg-background border-border"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-foreground text-xs">Talonarios</Label>
                                            <Input
                                                value={opDetalle.desTal}
                                                onChange={(e) => setOpDetalle((d) => ({ ...d, desTal: e.target.value }))}
                                                className="bg-background border-border"
                                                inputMode="numeric"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-foreground text-xs">Folios</Label>
                                            <Input
                                                value={opDetalle.desFol}
                                                onChange={(e) => setOpDetalle((d) => ({ ...d, desFol: e.target.value }))}
                                                className="bg-background border-border"
                                                inputMode="numeric"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-foreground text-xs">Lugar</Label>
                                        <Input
                                            value={opDetalle.desLugar}
                                            onChange={(e) => setOpDetalle((d) => ({ ...d, desLugar: e.target.value }))}
                                            className="bg-background border-border"
                                        />
                                    </div>
                                </>
                            )}
                            {opForm.tipo === "DIVULGACION" && (
                                <>
                                    <div className="space-y-1">
                                        <Label className="text-foreground text-xs">Tema</Label>
                                        <Input
                                            value={opDetalle.divTema}
                                            onChange={(e) => setOpDetalle((d) => ({ ...d, divTema: e.target.value }))}
                                            className="bg-background border-border"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-foreground text-xs">Modalidad</Label>
                                        <Input
                                            value={opDetalle.divMod}
                                            onChange={(e) => setOpDetalle((d) => ({ ...d, divMod: e.target.value }))}
                                            className="bg-background border-border"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-foreground text-xs">Visitas o contactos</Label>
                                        <Input
                                            value={opDetalle.divVis}
                                            onChange={(e) => setOpDetalle((d) => ({ ...d, divVis: e.target.value }))}
                                            className="bg-background border-border"
                                            inputMode="numeric"
                                        />
                                    </div>
                                </>
                            )}
                            {opForm.tipo === "PRESENCIA_FISCAL" && (
                                <>
                                    <div className="space-y-1">
                                        <Label className="text-foreground text-xs">Establecimiento</Label>
                                        <Input
                                            value={opDetalle.presEst}
                                            onChange={(e) => setOpDetalle((d) => ({ ...d, presEst: e.target.value }))}
                                            className="bg-background border-border"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-foreground text-xs">Hora inicio</Label>
                                            <Input
                                                value={opDetalle.presHi}
                                                onChange={(e) => setOpDetalle((d) => ({ ...d, presHi: e.target.value }))}
                                                className="bg-background border-border"
                                                placeholder="ej. 08:00"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-foreground text-xs">Hora fin</Label>
                                            <Input
                                                value={opDetalle.presHf}
                                                onChange={(e) => setOpDetalle((d) => ({ ...d, presHf: e.target.value }))}
                                                className="bg-background border-border"
                                                placeholder="ej. 12:00"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-foreground text-xs">Resultado</Label>
                                        <Textarea
                                            value={opDetalle.presRes}
                                            onChange={(e) => setOpDetalle((d) => ({ ...d, presRes: e.target.value }))}
                                            className="bg-background border-border min-h-[64px]"
                                        />
                                    </div>
                                </>
                            )}
                            {opForm.tipo === "ACTA_REPARO" && (
                                <>
                                    <p className="text-xs text-muted-foreground">
                                        El PDF debe existir en el expediente del contribuyente. Indique el UUID del
                                        contribuyente abajo, cargue la lista y elija el reporte; o pegue el ID del
                                        reporte manualmente.
                                    </p>
                                    <div className="space-y-1">
                                        <Label className="text-foreground text-xs">Número de acta (opcional)</Label>
                                        <Input
                                            value={opDetalle.repActa}
                                            onChange={(e) => setOpDetalle((d) => ({ ...d, repActa: e.target.value }))}
                                            className="bg-background border-border"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="border-border text-foreground"
                                            disabled={repairLoading}
                                            onClick={() => void loadRepairOptions()}
                                        >
                                            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${repairLoading ? "animate-spin" : ""}`} />
                                            Cargar actas de reparo del contribuyente
                                        </Button>
                                        <span className="text-xs text-muted-foreground">
                                            {repairOptions.length > 0
                                                ? `${repairOptions.length} registro(s)`
                                                : "Sin listar aún"}
                                        </span>
                                    </div>
                                    {repairOptions.length > 0 && (
                                        <div className="space-y-1">
                                            <Label className="text-foreground text-xs">Elegir PDF de reparo</Label>
                                            <Select
                                                value={opForm.repairReportId || "__none__"}
                                                onValueChange={(v) =>
                                                    setOpForm((f) => ({
                                                        ...f,
                                                        repairReportId: v === "__none__" ? "" : v,
                                                    }))
                                                }
                                            >
                                                <SelectTrigger className="bg-background border-border font-mono text-xs">
                                                    <SelectValue placeholder="Seleccione…" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-60">
                                                    <SelectItem value="__none__">— Ninguno —</SelectItem>
                                                    {repairOptions.map((r) => (
                                                        <SelectItem
                                                            key={r.id}
                                                            value={r.id}
                                                            disabled={r.vinculadoAOperativo}
                                                        >
                                                            {r.id.slice(0, 8)}…
                                                            {r.vinculadoAOperativo ? " (ya vinculado)" : ""}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-foreground">Parroquia (opcional)</Label>
                            <Select
                                value={opForm.parishId || "__none__"}
                                onValueChange={(v) =>
                                    setOpForm((f) => ({ ...f, parishId: v === "__none__" ? "" : v }))
                                }
                            >
                                <SelectTrigger className="bg-background border-border">
                                    <SelectValue placeholder="Sin parroquia" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    <SelectItem value="__none__">Sin parroquia</SelectItem>
                                    {parishes.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-foreground">ID contribuyente (opcional)</Label>
                            <Input
                                value={opForm.taxpayerId}
                                onChange={(e) => setOpForm((f) => ({ ...f, taxpayerId: e.target.value }))}
                                placeholder="UUID del contribuyente"
                                className="bg-background border-border font-mono text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-foreground">Tipo contribuyente (opcional)</Label>
                            <Select
                                value={opForm.tipoContribuyente || "__auto__"}
                                onValueChange={(v) =>
                                    setOpForm((f) => ({
                                        ...f,
                                        tipoContribuyente:
                                            v === "__auto__" ? "" : (v as "ORDINARY" | "SPECIAL"),
                                    }))
                                }
                            >
                                <SelectTrigger className="bg-background border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__auto__">Inferir del contribuyente</SelectItem>
                                    <SelectItem value="ORDINARY">Ordinario</SelectItem>
                                    <SelectItem value="SPECIAL">Especial</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-foreground">ID operativo origen (opcional)</Label>
                            <Input
                                value={opForm.operativoOrigenId}
                                onChange={(e) =>
                                    setOpForm((f) => ({ ...f, operativoOrigenId: e.target.value }))
                                }
                                className="bg-background border-border font-mono text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-foreground">
                                ID reporte reparo (manual, opcional)
                                {opForm.tipo === "ACTA_REPARO" && (
                                    <span className="text-muted-foreground font-normal"> — o use el selector arriba</span>
                                )}
                            </Label>
                            <Input
                                value={opForm.repairReportId}
                                onChange={(e) => setOpForm((f) => ({ ...f, repairReportId: e.target.value }))}
                                className="bg-background border-border font-mono text-xs"
                                placeholder="UUID del RepairReport"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-foreground">Notas</Label>
                            <Textarea
                                value={opForm.notas}
                                onChange={(e) => setOpForm((f) => ({ ...f, notas: e.target.value }))}
                                className="bg-background border-border min-h-[80px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="border-border" onClick={() => setOpDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            className="bg-indigo-600"
                            onClick={() => void submitOperativo()}
                            disabled={opSubmitting}
                        >
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <RegistrarAusenciaDialog
                open={perDialogOpen}
                onOpenChange={setPerDialogOpen}
                onRegistered={() => void loadPersonal()}
            />
        </div>
    );
}
