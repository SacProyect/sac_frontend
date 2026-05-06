import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { listGestionPersonal, type GestionPersonalRow } from "@/components/utils/api/fiscal-operaciones-functions";
import { RegistrarAusenciaDialog } from "@/components/gestion-personal/registrar-ausencia-dialog";
import { Badge } from "@/components/UI/badge";
import { Button } from "@/components/UI/button";
import { Card, CardContent } from "@/components/UI/card";
import { Skeleton } from "@/components/UI/skeleton";
import { CalendarDays, Plus, RefreshCw, UserRound } from "lucide-react";
import toast from "react-hot-toast";

const ESTATUS_LABEL: Record<string, string> = {
    PERMISO: "Permiso",
    REPOSO: "Reposo médico",
    VACACIONES: "Vacaciones",
};

function dayStart(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function parseDay(iso: string): Date {
    const [y, m, da] = iso.slice(0, 10).split("-").map(Number);
    return dayStart(new Date(y, (m ?? 1) - 1, da ?? 1));
}

function overlapsToday(fechaInicio: string, fechaFin: string): boolean {
    const a = parseDay(fechaInicio);
    const b = parseDay(fechaFin);
    const t = dayStart(new Date());
    return t >= a && t <= b;
}

function isUpcoming(fechaInicio: string): boolean {
    return parseDay(fechaInicio) > dayStart(new Date());
}

export function PersonalAbsencesPanel() {
    const { user } = useAuth();
    const canRegister = user?.role === "COORDINATOR" || user?.role === "ADMIN";
    const [addOpen, setAddOpen] = useState(false);
    const [items, setItems] = useState<GestionPersonalRow[]>([]);
    const [loading, setLoading] = useState(false);

    const range = useMemo(() => {
        const from = new Date();
        from.setMonth(from.getMonth() - 2);
        const to = new Date();
        to.setMonth(to.getMonth() + 4);
        return {
            dateFrom: from.toISOString().slice(0, 10),
            dateTo: to.toISOString().slice(0, 10),
        };
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await listGestionPersonal(range);
            setItems(res.items ?? []);
        } catch {
            toast.error("No se pudieron cargar las ausencias.");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => {
        void load();
    }, [load]);

    const { hoy, proximas, pasadas } = useMemo(() => {
        const hoyL: GestionPersonalRow[] = [];
        const prox: GestionPersonalRow[] = [];
        const past: GestionPersonalRow[] = [];
        for (const r of items) {
            if (overlapsToday(r.fechaInicio, r.fechaFin)) hoyL.push(r);
            else if (isUpcoming(r.fechaInicio)) prox.push(r);
            else past.push(r);
        }
        prox.sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));
        past.sort((a, b) => b.fechaFin.localeCompare(a.fechaFin));
        return { hoy: hoyL, proximas: prox, pasadas: past.slice(0, 12) };
    }, [items]);

    const renderCard = (r: GestionPersonalRow, accent: "default" | "muted") => (
        <Card
            key={r.id}
            className={
                accent === "default"
                    ? "border-border bg-card shadow-sm"
                    : "border-border/60 bg-muted/20 opacity-90"
            }
        >
            <CardContent className="pt-4 pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="font-medium text-foreground truncate">
                            {r.usuario?.name ?? "Funcionario"}
                        </span>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                        {ESTATUS_LABEL[r.estatus] ?? r.estatus}
                    </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {r.fechaInicio.slice(0, 10)} → {r.fechaFin.slice(0, 10)}
                </p>
                {r.motivo ? (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{r.motivo}</p>
                ) : null}
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-foreground">Ausencias del equipo</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Ventanas entre {range.dateFrom} y {range.dateTo}.{" "}
                        {canRegister
                            ? "Puede registrar permisos, reposo o vacaciones aquí (alcance según su rol)."
                            : "Solo lectura para su perfil."}
                    </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                    {canRegister && (
                        <Button
                            type="button"
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-500 gap-1.5"
                            onClick={() => setAddOpen(true)}
                        >
                            <Plus className="h-4 w-4" />
                            Registrar ausencia
                        </Button>
                    )}
                    <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading} className="gap-1.5">
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Actualizar
                    </Button>
                </div>
            </div>

            <RegistrarAusenciaDialog open={addOpen} onOpenChange={setAddOpen} onRegistered={() => void load()} />

            {loading && items.length === 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
            ) : (
                <>
                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                            Hoy fuera de oficina
                        </h3>
                        {hoy.length === 0 ? (
                            <p className="text-sm text-muted-foreground border border-dashed border-border rounded-lg px-4 py-6 text-center">
                                Nadie registrado con ausencia que cubra el día de hoy.
                            </p>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {hoy.map((r) => renderCard(r, "default"))}
                            </div>
                        )}
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-400">
                            Próximas ausencias
                        </h3>
                        {proximas.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Sin registros futuros en este rango.</p>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {proximas.map((r) => renderCard(r, "default"))}
                            </div>
                        )}
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Recientes (finalizadas)
                        </h3>
                        {pasadas.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Sin historial reciente en el periodo.</p>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {pasadas.map((r) => renderCard(r, "muted"))}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
