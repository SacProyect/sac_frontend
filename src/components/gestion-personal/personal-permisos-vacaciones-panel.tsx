import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
    listGestionPersonal,
    type GestionPersonalRow,
    type TipoEstatusPersonal,
} from "@/components/utils/api/fiscal-operaciones-functions";
import { RegistrarAusenciaDialog } from "@/components/gestion-personal/registrar-ausencia-dialog";
import { Badge } from "@/components/UI/badge";
import { Button } from "@/components/UI/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/card";
import { Input } from "@/components/UI/input";
import { Label } from "@/components/UI/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/UI/table";
import { Plus, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const ESTATUS_LABELS: Record<TipoEstatusPersonal, string> = {
    PERMISO: "Permiso",
    REPOSO: "Reposo médico",
    VACACIONES: "Vacaciones",
};

const ESTATUS_LIST: TipoEstatusPersonal[] = ["PERMISO", "REPOSO", "VACACIONES"];

function monthRangeStrings() {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    return { from: iso(from), to: iso(to) };
}

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

/**
 * Vista «Permisos, vacaciones y reposo» con rango de fechas, tarjetas por estatus y tabla
 * (misma UX que tenía el módulo Fiscalización).
 */

function EstatusBadge({ estatus }: { estatus: TipoEstatusPersonal | string }) {
    if (estatus === "PERMISO") {
        return <Badge variant="outline" className="text-amber-700 dark:text-amber-400 border-amber-600/40 bg-amber-500/10 uppercase tracking-widest text-[10px] whitespace-nowrap">Permiso</Badge>;
    }
    if (estatus === "VACACIONES") {
        return <Badge variant="outline" className="text-indigo-700 dark:text-indigo-400 border-indigo-600/40 bg-indigo-500/10 uppercase tracking-widest text-[10px] whitespace-nowrap">Vacaciones</Badge>;
    }
    if (estatus === "REPOSO") {
        return <Badge variant="outline" className="text-rose-700 dark:text-rose-400 border-rose-600/40 bg-rose-500/10 uppercase tracking-widest text-[10px] whitespace-nowrap">Reposo</Badge>;
    }
    return <Badge variant="outline" className="uppercase tracking-widest text-[10px] whitespace-nowrap">{ESTATUS_LABELS[estatus as TipoEstatusPersonal] ?? estatus}</Badge>;
}

export function PersonalPermisosVacacionesPanel() {
    const { user } = useAuth();
    const defaults = useMemo(() => monthRangeStrings(), []);
    const [perFrom, setPerFrom] = useState(defaults.from);
    const [perTo, setPerTo] = useState(defaults.to);
    const [personalRows, setPersonalRows] = useState<GestionPersonalRow[]>([]);
    const [perLoading, setPerLoading] = useState(true);
    const [perDialogOpen, setPerDialogOpen] = useState(false);

    const canRegisterPersonal = user?.role === "COORDINATOR" || user?.role === "ADMIN";

    const personalResumenEnRango = useMemo(() => {
        const m: Record<TipoEstatusPersonal, number> = { PERMISO: 0, REPOSO: 0, VACACIONES: 0 };
        for (const r of personalRows) {
            m[r.estatus] = (m[r.estatus] ?? 0) + 1;
        }
        return m;
    }, [personalRows]);

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
        void loadPersonal();
    }, [loadPersonal]);

    return (
        <>
            <Card className="border-border/60 bg-card text-card-foreground shadow-none">
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-border/40 pb-4">
                    <div>
                        <CardTitle className="text-lg font-semibold text-foreground">Cuadrante y Novedades</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Visualice permisos, vacaciones y reposos en el rango. Los administradores pueden
                            registrar nuevas incidencias.
                        </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-border text-foreground"
                            onClick={() => void loadPersonal()}
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
                            <Card key={st} className="border-border/60 bg-muted/10 dark:bg-slate-900/30 shadow-none rounded-sm">
                                <CardHeader className="p-4 pb-3">
                                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        {ESTATUS_LABELS[st]}
                                    </CardDescription>
                                    <CardTitle className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                                        {personalResumenEnRango[st] ?? 0}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>

                    <div className="rounded-sm border border-border/60 overflow-x-auto bg-card">
                        <Table>
                            <TableHeader className="bg-muted/10">
                                <TableRow className="border-border/60 hover:bg-transparent">
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Funcionario</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estatus</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inicio</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fin</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coordinador</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Motivo</TableHead>
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
                                        <TableRow key={row.id} className="border-border/60 hover:bg-muted/10 transition-colors">
                                            <TableCell className="font-semibold text-foreground whitespace-nowrap">
                                                {row.usuario?.name ?? row.usuarioId}
                                            </TableCell>
                                            <TableCell>
                                                <EstatusBadge estatus={row.estatus} />
                                            </TableCell>
                                            <TableCell className="text-muted-foreground font-mono text-xs whitespace-nowrap">
                                                {formatShortDate(row.fechaInicio)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground font-mono text-xs whitespace-nowrap">
                                                {formatShortDate(row.fechaFin)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                                                {row.coordinador?.name ?? row.coordinadorId}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs max-w-[250px] truncate" title={row.motivo ?? ""}>
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

            <RegistrarAusenciaDialog
                open={perDialogOpen}
                onOpenChange={setPerDialogOpen}
                onRegistered={() => void loadPersonal()}
            />
        </>
    );
}
