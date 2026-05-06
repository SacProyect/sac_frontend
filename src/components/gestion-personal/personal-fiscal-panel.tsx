import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getOfficers } from "@/components/utils/api/user-functions";
import {
    getPersonalGestionStats,
    getPersonalGestionResumenGlobal,
    isResumenGlobalStats,
    type PersonalPanelStats,
    type StatsPeriodo,
} from "@/components/utils/api/personal-stats-functions";
import {
    downloadCasosPorFiscalExcel,
    listFormularioMiembros,
} from "@/components/utils/api/fiscal-operaciones-functions";
import { getVisitsList } from "@/components/utils/api/visits-functions";
import type { VisitItem } from "@/types/visits";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/card";
import { Button } from "@/components/UI/button";
import { Label } from "@/components/UI/label";
import { Input } from "@/components/UI/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/UI/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/UI/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/UI/table";
import { Skeleton } from "@/components/UI/skeleton";
import {
    FileText,
    ScrollText,
    Building2,
    Landmark,
    Footprints,
    CalendarRange,
    FileDown,
    Info,
} from "lucide-react";
import toast from "react-hot-toast";

type OfficerRow = { id: string; name: string; role: string; personId?: number };

const PERIODOS: { value: StatsPeriodo; label: string }[] = [
    { value: "dia", label: "Día" },
    { value: "semana", label: "Semana" },
    { value: "mes", label: "Mes" },
    { value: "trimestre", label: "Trimestre" },
    { value: "anio", label: "Año" },
];

function formatRange(fromIso: string, toIso: string) {
    try {
        const a = new Date(fromIso).toLocaleDateString("es-VE", { day: "2-digit", month: "short" });
        const b = new Date(toIso).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" });
        return `${a} — ${b}`;
    } catch {
        return `${fromIso} — ${toIso}`;
    }
}

type PanelAlcance = "fiscal" | "global";

export type PersonalFiscalPanelProps = {
    /** Oculta la tarjeta de descarga Excel (p. ej. en la página dedicada de gestión). */
    hideCasosReportCard?: boolean;
};

export function PersonalFiscalPanel({ hideCasosReportCard = false }: PersonalFiscalPanelProps) {
    const { user } = useAuth();
    const isAdmin = user?.role === "ADMIN";
    const [alcance, setAlcance] = useState<PanelAlcance>("fiscal");
    const [officers, setOfficers] = useState<OfficerRow[]>([]);
    const [fiscalId, setFiscalId] = useState("");
    const [periodo, setPeriodo] = useState<StatsPeriodo>("mes");
    const [referenceDate, setReferenceDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [stats, setStats] = useState<PersonalPanelStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [visitsOpen, setVisitsOpen] = useState(false);
    const [visitsLoading, setVisitsLoading] = useState(false);
    const [visitsRows, setVisitsRows] = useState<VisitItem[]>([]);
    const [reportYear, setReportYear] = useState(() => new Date().getFullYear());
    const [excelExporting, setExcelExporting] = useState(false);
    const [fiscalSearch, setFiscalSearch] = useState("");

    useEffect(() => {
        if (user?.role === "ADMIN") setAlcance("global");
    }, [user?.role]);

    useEffect(() => {
        if (user?.role === "COORDINATOR") {
            void listFormularioMiembros()
                .then((d) => {
                    const fiscales = (d.members ?? [])
                        .filter((m) => m.role === "FISCAL")
                        .map((m) => ({
                            id: m.id,
                            name: m.name,
                            role: m.role,
                            personId: m.personId,
                        }));
                    setOfficers(fiscales);
                    setFiscalId((prev) => {
                        if (prev && fiscales.some((x) => x.id === prev)) return prev;
                        return fiscales.length === 1 ? fiscales[0].id : "";
                    });
                })
                .catch(() => {
                    setOfficers([]);
                    setFiscalId("");
                });
            return;
        }
        void getOfficers().then((raw) => {
            const list = (Array.isArray(raw) ? raw : []) as OfficerRow[];
            const fiscales = list.filter((u) => u.role === "FISCAL");
            setOfficers(fiscales);
            setFiscalId((prev) => prev || (fiscales.length === 1 ? fiscales[0].id : ""));
        });
    }, [user?.role]);

    useEffect(() => {
        if (!isAdmin && alcance === "global") setAlcance("fiscal");
    }, [isAdmin, alcance]);

    const officersFiltered = useMemo(() => {
        const q = fiscalSearch.trim().toLowerCase();
        if (!q) return officers;
        return officers.filter(
            (o) =>
                o.name.toLowerCase().includes(q) ||
                String(o.personId ?? "").includes(q) ||
                o.id.toLowerCase().includes(q),
        );
    }, [officers, fiscalSearch]);

    const refIso = useMemo(() => new Date(referenceDate + "T12:00:00").toISOString(), [referenceDate]);

    const loadFiscalStats = useCallback(async () => {
        if (!fiscalId) {
            toast.error("Seleccione un fiscal.");
            return;
        }
        setLoading(true);
        try {
            const data = await getPersonalGestionStats({
                fiscalId,
                periodo,
                referenceDate: refIso,
            });
            setStats(data);
        } catch (e: unknown) {
            const msg =
                (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
                "No se pudieron cargar las estadísticas.";
            toast.error(typeof msg === "string" ? msg : "Error");
            setStats(null);
        } finally {
            setLoading(false);
        }
    }, [fiscalId, periodo, refIso]);

    const loadGlobalStats = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getPersonalGestionResumenGlobal({
                periodo,
                referenceDate: refIso,
            });
            setStats(data);
        } catch (e: unknown) {
            const msg =
                (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
                "No se pudo cargar el resumen global.";
            toast.error(typeof msg === "string" ? msg : "Error");
            setStats(null);
        } finally {
            setLoading(false);
        }
    }, [periodo, refIso]);

    useEffect(() => {
        if (isAdmin && alcance === "global") {
            void loadGlobalStats();
            return;
        }
        if (!fiscalId) return;
        void loadFiscalStats();
    }, [isAdmin, alcance, fiscalId, periodo, refIso, loadGlobalStats, loadFiscalStats]);

    const selectedPersonId = useMemo(() => {
        if (!stats || isResumenGlobalStats(stats)) return undefined;
        const o = officers.find((x) => x.id === fiscalId);
        return o?.personId ?? stats.fiscal.personId;
    }, [officers, fiscalId, stats]);

    const openVisitsModal = async () => {
        setVisitsOpen(true);
        setVisitsLoading(true);
        try {
            if (stats && isResumenGlobalStats(stats) && stats.periodo) {
                const from = stats.periodo.from.slice(0, 10);
                const to = stats.periodo.to.slice(0, 10);
                const rows = await getVisitsList({
                    limit: 300,
                    skip: 0,
                    entry_date_from: from,
                    entry_date_to: to,
                });
                setVisitsRows(rows ?? []);
            } else if (selectedPersonId != null) {
                const rows = await getVisitsList({
                    fiscal_id: selectedPersonId,
                    limit: 200,
                    skip: 0,
                });
                setVisitsRows(rows ?? []);
            } else {
                toast.error("No hay fiscal o periodo para consultar visitas.");
                setVisitsRows([]);
            }
        } catch {
            toast.error("No se pudo cargar la lista de visitas (servicio externo).");
            setVisitsRows([]);
        } finally {
            setVisitsLoading(false);
        }
    };

    const visitLabel = (v: VisitItem) =>
        v.contributor_name ?? v.contribuyente ?? v.contributor?.name ?? "—";
    const visitRif = (v: VisitItem) => v.contributor_rif ?? v.rif ?? v.contributor?.rif ?? "—";
    const visitWhen = (v: VisitItem) =>
        [v.entry_date, v.entry_time].filter(Boolean).join(" ") || v.created_at || "—";

    const exportCasosExcel = async () => {
        setExcelExporting(true);
        try {
            await downloadCasosPorFiscalExcel(reportYear);
            toast.success("Excel descargado.");
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "No se pudo generar el Excel.");
        } finally {
            setExcelExporting(false);
        }
    };

    /** Alineado al alcance elegido (evita etiqueta «del fiscal» si el JSON global no trae `alcance`). */
    const visitasEsVistaInstitucional = isAdmin && alcance === "global";

    return (
        <div className="space-y-4">
            {!hideCasosReportCard && (
                <Card className="border-border bg-card text-card-foreground shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-foreground flex items-center gap-2">
                            <FileDown className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            Reporte «Casos por fiscales» (plantilla Excel)
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Misma estructura que el archivo de control por funcionario: casos VDF y AF (ordinarios /
                            especiales), culminados, en proceso y anulados según datos del SAC. Los administradores
                            descargan todos los fiscales; los coordinadores, solo su grupo. Filtro por año de{" "}
                            <span className="text-foreground font-medium">emisión del caso</span> (campo emisión del
                            contribuyente).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3 items-end">
                        <div className="space-y-1">
                            <Label className="text-muted-foreground text-xs">Año</Label>
                            <Input
                                type="number"
                                min={2000}
                                max={2100}
                                value={reportYear}
                                onChange={(e) => setReportYear(Number(e.target.value) || reportYear)}
                                className="w-[120px] bg-background"
                            />
                        </div>
                        <Button
                            type="button"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white"
                            onClick={() => void exportCasosExcel()}
                            disabled={excelExporting}
                        >
                            <FileDown className={`h-4 w-4 mr-1.5 ${excelExporting ? "animate-pulse" : ""}`} />
                            Descargar Excel
                        </Button>
                    </CardContent>
                </Card>
            )}

            <Card className="border-border bg-card text-card-foreground shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-foreground flex items-center gap-2">
                        <CalendarRange className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        {isAdmin && alcance === "global"
                            ? "Resumen institucional — VDF, reparos y visitas"
                            : "Panel fiscal — VDF, reparos, contribuyentes y visitas"}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        {isAdmin && alcance === "global"
                            ? "Vista de mando: totales de todos los fiscales activos en el periodo. Las visitas se agregan por fiscal (API externa); use la tarjeta de visitas para el listado del periodo."
                            : "Compare un fiscal concreto: periodos de día a año (trimestres Q1–Q4). Use la búsqueda para localizar por nombre o CI."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    {isAdmin && (
                        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground flex gap-2 items-start">
                            <Info className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                            <p>
                                <span className="text-foreground font-medium">Resumen institucional</span> muestra el
                                equipo completo sin elegir persona.{" "}
                                <span className="text-foreground font-medium">Por fiscal</span> sirve para entrar al
                                detalle de un funcionario.
                            </p>
                        </div>
                    )}
                    {/* Fila 1: Alcance (admin) + Periodo + Actualizar — alineados por la base de los botones */}
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-4 lg:gap-8 flex-1 min-w-0">
                            {isAdmin && (
                                <div className="space-y-1 shrink-0">
                                    <Label className="text-muted-foreground text-xs">Alcance</Label>
                                    <div className="flex flex-wrap gap-1.5 items-center">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={alcance === "fiscal" ? "default" : "outline"}
                                            className={
                                                alcance === "fiscal"
                                                    ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                                                    : "border-border text-muted-foreground"
                                            }
                                            onClick={() => setAlcance("fiscal")}
                                        >
                                            Por fiscal
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={alcance === "global" ? "default" : "outline"}
                                            className={
                                                alcance === "global"
                                                    ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                                                    : "border-border text-muted-foreground"
                                            }
                                            onClick={() => setAlcance("global")}
                                        >
                                            Resumen institucional
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-1 flex-1 min-w-[220px]">
                                <Label className="text-muted-foreground text-xs">Periodo</Label>
                                <div className="flex flex-wrap gap-1">
                                    {PERIODOS.map((p) => (
                                        <Button
                                            key={p.value}
                                            type="button"
                                            size="sm"
                                            variant={periodo === p.value ? "default" : "outline"}
                                            className={
                                                periodo === p.value
                                                    ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                                                    : "border-border text-muted-foreground"
                                            }
                                            onClick={() => setPeriodo(p.value)}
                                        >
                                            {p.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="border-border shrink-0"
                            onClick={() => {
                                if (isAdmin && alcance === "global") void loadGlobalStats();
                                else void loadFiscalStats();
                            }}
                            disabled={loading || (!(isAdmin && alcance === "global") && !fiscalId)}
                        >
                            Actualizar
                        </Button>
                    </div>

                    {/* Fila 2: Fiscal + fecha de referencia */}
                    <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-end">
                        {!(isAdmin && alcance === "global") && (
                            <div className="space-y-1 min-w-[220px] flex-1">
                                <Label className="text-muted-foreground text-xs">Fiscal</Label>
                                <Select value={fiscalId || "__none__"} onValueChange={(v) => setFiscalId(v === "__none__" ? "" : v)}>
                                    <SelectTrigger className="bg-background border-border">
                                        <SelectValue placeholder="Elija fiscal" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-64">
                                        <SelectItem value="__none__">— Elija —</SelectItem>
                                        {officersFiltered.map((o) => (
                                            <SelectItem key={o.id} value={o.id}>
                                                {o.name} (CI {o.personId ?? "—"})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    placeholder="Buscar por nombre o CI…"
                                    value={fiscalSearch}
                                    onChange={(e) => setFiscalSearch(e.target.value)}
                                    className="h-8 text-xs bg-background border-border mt-1"
                                />
                            </div>
                        )}
                        <div className="space-y-1">
                            <Label className="text-muted-foreground text-xs">Fecha de referencia</Label>
                            <Input
                                type="date"
                                value={referenceDate}
                                onChange={(e) => setReferenceDate(e.target.value)}
                                className="w-[160px] bg-background border-border"
                            />
                        </div>
                    </div>

                    {stats?.periodo && (
                        <p className="text-xs text-muted-foreground">
                            Rango calculado:{" "}
                            <span className="text-foreground">
                                {formatRange(stats.periodo.from, stats.periodo.to)}
                            </span>
                            {isResumenGlobalStats(stats) && (
                                <>
                                    {" "}
                                    · Fiscales activos en nómina:{" "}
                                    <span className="text-foreground">{stats.fiscalesActivos}</span>
                                </>
                            )}
                        </p>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        {loading ? (
                            <>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Card key={i} className="border-border bg-muted/30">
                                        <CardHeader className="pb-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-8 w-16 mt-2" />
                                        </CardHeader>
                                    </Card>
                                ))}
                            </>
                        ) : (
                            <>
                                <Card className="border-border bg-muted/30 dark:bg-slate-950/50">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="text-muted-foreground flex items-center gap-1.5">
                                            <FileText className="h-3.5 w-3.5" /> VDF registrados
                                        </CardDescription>
                                        <CardTitle className="text-3xl text-foreground tabular-nums">
                                            {stats?.operativos.vdf ?? "—"}
                                        </CardTitle>
                                    </CardHeader>
                                </Card>
                                <Card className="border-border bg-muted/30 dark:bg-slate-950/50">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="text-muted-foreground flex items-center gap-1.5">
                                            <ScrollText className="h-3.5 w-3.5" /> Actas de reparo
                                        </CardDescription>
                                        <CardTitle className="text-3xl text-foreground tabular-nums">
                                            {stats?.operativos.actasReparo ?? "—"}
                                        </CardTitle>
                                    </CardHeader>
                                </Card>
                                <Card className="border-border bg-muted/30 dark:bg-slate-950/50">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="text-muted-foreground flex items-center gap-1.5">
                                            <Building2 className="h-3.5 w-3.5" /> Ordinarios (únicos)
                                        </CardDescription>
                                        <CardTitle className="text-3xl text-foreground tabular-nums">
                                            {stats?.contribuyentesAtendidos.ordinarios ?? "—"}
                                        </CardTitle>
                                    </CardHeader>
                                </Card>
                                <Card className="border-border bg-muted/30 dark:bg-slate-950/50">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="text-muted-foreground flex items-center gap-1.5">
                                            <Landmark className="h-3.5 w-3.5" /> Especiales (únicos)
                                        </CardDescription>
                                        <CardTitle className="text-3xl text-foreground tabular-nums">
                                            {stats?.contribuyentesAtendidos.especiales ?? "—"}
                                        </CardTitle>
                                    </CardHeader>
                                </Card>
                                <button
                                    type="button"
                                    className="text-left rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:pointer-events-none"
                                    onClick={() => void openVisitsModal()}
                                    disabled={!(isAdmin && alcance === "global") && !fiscalId}
                                >
                                    <Card className="border-border bg-muted/30 dark:bg-slate-950/50 hover:border-indigo-500/50 dark:hover:border-indigo-700/60 transition-colors h-full cursor-pointer">
                                        <CardHeader className="pb-2">
                                            <CardDescription className="text-muted-foreground flex items-center gap-1.5">
                                                <Footprints className="h-3.5 w-3.5" />
                                                {visitasEsVistaInstitucional
                                                    ? "Visitas generales (clic: listado)"
                                                    : "Visitas del fiscal (clic: listado)"}
                                            </CardDescription>
                                            <CardTitle className="text-3xl text-foreground tabular-nums">
                                                {stats?.visitas.total ?? "—"}
                                            </CardTitle>
                                            {stats && isResumenGlobalStats(stats) && stats.visitas.fiscalesSinConteoVisitas > 0 && (
                                                <p className="text-[10px] text-amber-500/90 pt-1">
                                                    Sin conteo desde API en {stats.visitas.fiscalesSinConteoVisitas} fiscal
                                                    (es); el total puede quedar bajo.
                                                </p>
                                            )}
                                            {!stats?.visitas.servicioExternoConfigurado && (
                                                <p className="text-[10px] text-amber-500/90 pt-1">
                                                    Servicio visitas no configurado en API; use el modal para intentar
                                                    carga directa.
                                                </p>
                                            )}
                                        </CardHeader>
                                    </Card>
                                </button>
                            </>
                        )}
                    </div>

                    {stats && stats.contribuyentesAtendidos.sinClasificar > 0 && (
                        <p className="text-xs text-muted-foreground">
                            Contribuyentes sin clasificar en operativos:{" "}
                            <span className="text-foreground">{stats.contribuyentesAtendidos.sinClasificar}</span> (total
                            distintos: {stats.contribuyentesAtendidos.totalDistintos})
                        </p>
                    )}
                </CardContent>
            </Card>

            <Dialog open={visitsOpen} onOpenChange={setVisitsOpen}>
                <DialogContent className="bg-card border-border text-card-foreground max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">
                            {visitasEsVistaInstitucional ? "Visitas generales" : "Visitas del fiscal"}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            {visitasEsVistaInstitucional
                                ? "Listado del periodo según fechas del resumen (si el API lo permite)."
                                : "Listado desde el servicio de visitas (nombre, RIF, fecha/hora de entrada)."}
                        </DialogDescription>
                    </DialogHeader>
                    {visitsLoading ? (
                        <div className="space-y-2 py-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border">
                                    <TableHead className="text-muted-foreground">Contribuyente</TableHead>
                                    <TableHead className="text-muted-foreground">RIF</TableHead>
                                    <TableHead className="text-muted-foreground">Fecha / hora</TableHead>
                                    <TableHead className="text-muted-foreground">Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visitsRows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-muted-foreground text-center py-8">
                                            Sin registros o servicio no disponible.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    visitsRows.map((v) => (
                                        <TableRow key={v.id} className="border-border">
                                            <TableCell className="text-foreground">{visitLabel(v)}</TableCell>
                                            <TableCell className="text-muted-foreground font-mono text-xs">{visitRif(v)}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                                                {visitWhen(v)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{v.status}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
