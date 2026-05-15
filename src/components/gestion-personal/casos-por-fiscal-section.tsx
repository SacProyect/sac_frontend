import { useCallback, useEffect, useMemo, useState } from "react";
import {
    downloadCasosPorFiscalExcel,
    getCasosPorFiscalReport,
    type CasosPorFiscalReportJson,
    type CasosPorFiscalRow,
} from "@/components/utils/api/fiscal-operaciones-functions";
import { Button } from "@/components/UI/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/card";
import { Input } from "@/components/UI/input";
import { Label } from "@/components/UI/label";
import { Skeleton } from "@/components/UI/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/UI/table";
import { FileDown, LayoutGrid, RefreshCw, Search, Table2 } from "lucide-react";
import toast from "react-hot-toast";

type VistaCasos = "tarjetas" | "tabla";

function CasoFiscalTarjeta({ r }: { r: CasosPorFiscalRow }) {
    // Calcular porcentajes para la mini-barra de progreso (basada en totales VDF + AF si es posible, o solo VDF)
    const totalExp = r.totalCulminados + r.totalEnProceso + (r.vdfAnulados || 0);
    const pctCulm = totalExp > 0 ? (r.totalCulminados / totalExp) * 100 : 0;
    const pctProc = totalExp > 0 ? (r.totalEnProceso / totalExp) * 100 : 0;

    return (
        <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 border border-border/60 bg-card rounded-md shadow-sm transition-colors hover:bg-muted/10">
            <div className="min-w-[200px] flex-shrink-0">
                <h3 className="text-sm font-bold text-foreground">{r.funcionario}</h3>
                <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    CI {r.cedula} <span className="mx-1.5 opacity-50">•</span> {r.coordinacion ?? "Sin Coord."}
                </div>
            </div>

            <div className="flex-1 grid grid-cols-2 sm:grid-cols-6 gap-4 md:gap-6 items-center">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Casos</span>
                    <span className="text-lg font-bold tabular-nums">{r.nroCasos}</span>
                </div>
                
                <div className="flex flex-col col-span-2 hidden sm:flex">
                    <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Progreso Global</span>
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-500 font-medium">{r.totalCulminados} CULM</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted overflow-hidden flex rounded-full">
                        <div className="bg-emerald-500 h-full" style={{ width: `${pctCulm}%` }} />
                        <div className="bg-amber-400 h-full" style={{ width: `${pctProc}%` }} />
                    </div>
                </div>

                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">VDF / AF</span>
                    <span className="text-base font-semibold tabular-nums text-foreground">{r.vdfTotal} <span className="text-muted-foreground font-normal text-sm">/</span> {r.afTotal}</span>
                </div>
                
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Σ Culm.</span>
                    <span className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-500">{r.totalCulminados}</span>
                </div>
                
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Σ Proc.</span>
                    <span className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-500">{r.totalEnProceso}</span>
                </div>
            </div>

            {r.observaciones && (
                <div className="md:w-[180px] flex-shrink-0 text-xs text-muted-foreground md:border-l border-border/60 md:pl-4 pt-3 md:pt-0 border-t md:border-t-0 mt-3 md:mt-0">
                    <span className="line-clamp-2" title={r.observaciones}>{r.observaciones}</span>
                </div>
            )}
        </div>
    );
}

type Props = {
    year: number;
    onYearChange: (y: number) => void;
};

export function CasosPorFiscalSection({ year, onYearChange }: Props) {
    const [data, setData] = useState<CasosPorFiscalReportJson | null>(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [vista, setVista] = useState<VistaCasos>("tarjetas");
    const [buscar, setBuscar] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getCasosPorFiscalReport(year);
            setData(res);
        } catch (e: unknown) {
            const msg =
                (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
                (e instanceof Error ? e.message : "No se pudo cargar el reporte.");
            toast.error(typeof msg === "string" ? msg : "Error");
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [year]);

    useEffect(() => {
        void load();
    }, [load]);

    const exportExcel = async () => {
        setExporting(true);
        try {
            await downloadCasosPorFiscalExcel(year);
            toast.success("Excel descargado.");
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Error al exportar.");
        } finally {
            setExporting(false);
        }
    };

    const t = data?.totals;

    const filasFiltradas = useMemo(() => {
        const rows = data?.rows ?? [];
        const q = buscar.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(
            (r) =>
                r.funcionario.toLowerCase().includes(q) ||
                r.cedula.toLowerCase().includes(q) ||
                String(r.coordinacion ?? "").includes(q) ||
                (r.observaciones && r.observaciones.toLowerCase().includes(q)),
        );
    }, [data?.rows, buscar]);

    return (
        <div className="space-y-4">
            <Card className="border-border bg-card text-card-foreground shadow-sm">
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between pb-2">
                    <div className="min-w-0">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Table2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            Control de procedimientos por fiscal
                        </CardTitle>
                        <CardDescription className="text-muted-foreground max-w-2xl mt-1">
                            Vista <span className="text-foreground font-medium">tarjetas</span> para revisar el equipo de
                            un vistazo; <span className="text-foreground font-medium">tabla completa</span> para el
                            detalle alineado al Excel.
                        </CardDescription>
                    </div>
                    <div className="flex flex-col gap-3 w-full lg:w-auto lg:min-w-[320px]">
                        <div className="flex flex-wrap items-end gap-2 justify-end">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Año (emisión caso)</Label>
                                <Input
                                    type="number"
                                    min={2000}
                                    max={2100}
                                    value={year}
                                    onChange={(e) => {
                                        const n = parseInt(e.target.value, 10);
                                        if (!Number.isNaN(n)) onYearChange(n);
                                    }}
                                    className="w-[112px] bg-background"
                                />
                            </div>
                            <div className="flex rounded-md border border-border p-0.5 bg-muted/40">
                                <Button
                                    type="button"
                                    variant={vista === "tarjetas" ? "secondary" : "ghost"}
                                    size="sm"
                                    className="h-8 gap-1 px-2"
                                    onClick={() => setVista("tarjetas")}
                                >
                                    <LayoutGrid className="h-3.5 w-3.5" />
                                    Tarjetas
                                </Button>
                                <Button
                                    type="button"
                                    variant={vista === "tabla" ? "secondary" : "ghost"}
                                    size="sm"
                                    className="h-8 gap-1 px-2"
                                    onClick={() => setVista("tabla")}
                                >
                                    <Table2 className="h-3.5 w-3.5" />
                                    Tabla
                                </Button>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 justify-end">
                            <div className="relative flex-1 min-w-[200px] max-w-md">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    placeholder="Buscar por nombre, cédula, coord.…"
                                    value={buscar}
                                    onChange={(e) => setBuscar(e.target.value)}
                                    className="pl-9 bg-background"
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => void load()}
                                disabled={loading}
                                className="gap-1.5 shrink-0"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                                Actualizar
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shrink-0"
                                onClick={() => void exportExcel()}
                                disabled={exporting}
                            >
                                <FileDown className="h-4 w-4" />
                                Excel
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                {data?.meta && (
                    <CardContent className="pt-0 pb-3">
                        <details className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/30 px-3 py-2">
                            <summary className="cursor-pointer font-medium text-foreground/80">
                                Criterios de datos
                            </summary>
                            <ul className="mt-2 space-y-1 list-disc pl-4">
                                <li>{data.meta.filtroEmision}</li>
                                <li>{data.meta.anuladosRegla}</li>
                                <li>{data.meta.observacionesFuente}</li>
                            </ul>
                        </details>
                    </CardContent>
                )}
            </Card>

            {vista === "tarjetas" && (
                <div className="space-y-3">
                    {loading && !data ? (
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <Skeleton key={i} className="h-48 w-full rounded-xl" />
                            ))}
                        </div>
                    ) : filasFiltradas.length === 0 ? (
                        <p className="text-sm text-muted-foreground border border-dashed border-border rounded-lg px-4 py-8 text-center">
                            No hay filas que coincidan con la búsqueda o aún no hay datos para el año.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {filasFiltradas.map((r) => (
                                <CasoFiscalTarjeta key={r.fiscalId} r={r} />
                            ))}
                        </div>
                    )}
                    {t && filasFiltradas.length > 0 && (
                        <Card className="border-border bg-muted/40">
                            <CardContent className="py-3 px-4 text-sm">
                                <span className="font-semibold text-foreground">{t.funcionario}</span>
                                <span className="text-muted-foreground mx-2">·</span>
                                <span className="tabular-nums">Casos {t.nroCasos}</span>
                                <span className="text-muted-foreground mx-1">|</span>
                                <span className="tabular-nums">VDF {t.vdfTotal}</span>
                                <span className="text-muted-foreground mx-1">|</span>
                                <span className="tabular-nums">AF {t.afTotal}</span>
                                <span className="text-muted-foreground mx-1">|</span>
                                <span className="tabular-nums text-emerald-700 dark:text-emerald-400">
                                    Culm. {t.totalCulminados}
                                </span>
                                <span className="text-muted-foreground mx-1">|</span>
                                <span className="tabular-nums text-amber-700 dark:text-amber-400">
                                    Proc. {t.totalEnProceso}
                                </span>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {vista === "tabla" && (
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[min(70vh,720px)] overflow-y-auto">
                    <Table>
                        <TableHeader className="sticky top-0 z-10 bg-muted/95 dark:bg-slate-900/95 backdrop-blur-sm">
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="whitespace-nowrap font-semibold text-foreground min-w-[140px]">
                                    Funcionario
                                </TableHead>
                                <TableHead className="whitespace-nowrap">Cédula</TableHead>
                                <TableHead className="text-right whitespace-nowrap">N° casos</TableHead>
                                <TableHead className="text-right whitespace-nowrap">VDF</TableHead>
                                <TableHead className="text-right whitespace-nowrap">VDF culm.</TableHead>
                                <TableHead className="text-right whitespace-nowrap">VDF proc.</TableHead>
                                <TableHead className="text-right whitespace-nowrap">VDF anul.</TableHead>
                                <TableHead className="text-right whitespace-nowrap">AF total</TableHead>
                                <TableHead className="text-right whitespace-nowrap">Punt.</TableHead>
                                <TableHead className="text-right whitespace-nowrap">Integ.</TableHead>
                                <TableHead className="text-right whitespace-nowrap">AF culm. P</TableHead>
                                <TableHead className="text-right whitespace-nowrap">AF culm. I</TableHead>
                                <TableHead className="text-right whitespace-nowrap">AF proc. P</TableHead>
                                <TableHead className="text-right whitespace-nowrap">AF proc. I</TableHead>
                                <TableHead className="text-right whitespace-nowrap">AF anul. P</TableHead>
                                <TableHead className="text-right whitespace-nowrap">AF anul. I</TableHead>
                                <TableHead className="text-right whitespace-nowrap">Σ culm.</TableHead>
                                <TableHead className="text-right whitespace-nowrap">Σ proc.</TableHead>
                                <TableHead className="text-center whitespace-nowrap">Coord.</TableHead>
                                <TableHead className="min-w-[180px]">Observaciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && !data ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 8 }).map((__, j) => (
                                            <TableCell key={j}>
                                                <Skeleton className="h-6 w-full" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filasFiltradas.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={20}
                                        className="text-center text-muted-foreground py-10 text-sm"
                                    >
                                        Ningún funcionario coincide con la búsqueda. Ajuste el filtro o cambie de año.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <>
                                    {filasFiltradas.map((r) => (
                                        <TableRow
                                            key={r.fiscalId}
                                            className="border-border hover:bg-muted/40"
                                        >
                                            <TableCell className="font-medium text-foreground">{r.funcionario}</TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {r.cedula}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">{r.nroCasos}</TableCell>
                                            <TableCell className="text-right tabular-nums">{r.vdfTotal}</TableCell>
                                            <TableCell className="text-right tabular-nums">{r.vdfCulminados}</TableCell>
                                            <TableCell className="text-right tabular-nums">{r.vdfEnProceso}</TableCell>
                                            <TableCell className="text-right tabular-nums text-amber-700 dark:text-amber-400">
                                                {r.vdfAnulados}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">{r.afTotal}</TableCell>
                                            <TableCell className="text-right tabular-nums">{r.afPuntuales}</TableCell>
                                            <TableCell className="text-right tabular-nums">{r.afIntegrales}</TableCell>
                                            <TableCell className="text-right tabular-nums">{r.afCulmPuntuales}</TableCell>
                                            <TableCell className="text-right tabular-nums">{r.afCulmIntegrales}</TableCell>
                                            <TableCell className="text-right tabular-nums">{r.afProcPuntuales}</TableCell>
                                            <TableCell className="text-right tabular-nums">{r.afProcIntegrales}</TableCell>
                                            <TableCell className="text-right tabular-nums">{r.afAnulPuntuales}</TableCell>
                                            <TableCell className="text-right tabular-nums">{r.afAnulIntegrales}</TableCell>
                                            <TableCell className="text-right tabular-nums font-medium">
                                                {r.totalCulminados}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums font-medium">
                                                {r.totalEnProceso}
                                            </TableCell>
                                            <TableCell className="text-center tabular-nums">
                                                {r.coordinacion ?? "—"}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground max-w-[240px]">
                                                {r.observaciones || "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {t && (
                                        <TableRow className="bg-muted/60 dark:bg-slate-800/80 border-t-2 border-border font-semibold">
                                            <TableCell colSpan={2} className="text-foreground">
                                                {t.funcionario}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">{t.nroCasos}</TableCell>
                                            <TableCell className="text-right tabular-nums">{t.vdfTotal}</TableCell>
                                            <TableCell className="text-right tabular-nums">{t.vdfCulminados}</TableCell>
                                            <TableCell className="text-right tabular-nums">{t.vdfEnProceso}</TableCell>
                                            <TableCell className="text-right tabular-nums">{t.vdfAnulados}</TableCell>
                                            <TableCell className="text-right tabular-nums">{t.afTotal}</TableCell>
                                            <TableCell className="text-right tabular-nums">{t.afPuntuales}</TableCell>
                                            <TableCell className="text-right tabular-nums">{t.afIntegrales}</TableCell>
                                            <TableCell className="text-right tabular-nums">{t.afCulmPuntuales}</TableCell>
                                            <TableCell className="text-right tabular-nums">{t.afCulmIntegrales}</TableCell>
                                            <TableCell className="text-right tabular-nums">{t.afProcPuntuales}</TableCell>
                                            <TableCell className="text-right tabular-nums">{t.afProcIntegrales}</TableCell>
                                            <TableCell className="text-right tabular-nums">{t.afAnulPuntuales}</TableCell>
                                            <TableCell className="text-right tabular-nums">{t.afAnulIntegrales}</TableCell>
                                            <TableCell className="text-right tabular-nums">{t.totalCulminados}</TableCell>
                                            <TableCell className="text-right tabular-nums">{t.totalEnProceso}</TableCell>
                                            <TableCell />
                                            <TableCell />
                                        </TableRow>
                                    )}
                                </>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            )}
        </div>
    );
}
