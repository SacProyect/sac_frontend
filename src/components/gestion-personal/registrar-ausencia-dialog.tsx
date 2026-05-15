import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
    createGestionPersonal,
    listFormularioCoordinadores,
    listFormularioMiembros,
    type GrupoMiembro,
    type TipoEstatusPersonal,
} from "@/components/utils/api/fiscal-operaciones-functions";
import { Button } from "@/components/UI/button";
import { Input } from "@/components/UI/input";
import { Label } from "@/components/UI/label";
import { Textarea } from "@/components/UI/textarea";
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
import toast from "react-hot-toast";

const ESTATUS_LABELS: Record<TipoEstatusPersonal, string> = {
    PERMISO: "Permiso",
    REPOSO: "Reposo médico",
    VACACIONES: "Vacaciones",
};

const ESTATUS_LIST: TipoEstatusPersonal[] = ["PERMISO", "REPOSO", "VACACIONES"];

export type RegistrarAusenciaDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Tras guardar correctamente (p. ej. refrescar listados). */
    onRegistered?: () => void;
};

export function RegistrarAusenciaDialog({ open, onOpenChange, onRegistered }: RegistrarAusenciaDialogProps) {
    const { user } = useAuth();
    const canRegister = user?.role === "COORDINATOR" || user?.role === "ADMIN";

    const [submitting, setSubmitting] = useState(false);
    const [miembros, setMiembros] = useState<GrupoMiembro[]>([]);
    const [coordinadores, setCoordinadores] = useState<{ id: string; name: string; personId: number }[]>([]);
    const [adminCoordinatorId, setAdminCoordinatorId] = useState("");
    const [form, setForm] = useState({
        usuarioId: "",
        estatus: "PERMISO" as TipoEstatusPersonal,
        motivo: "",
        fechaInicio: new Date().toISOString().slice(0, 10),
        fechaFin: new Date().toISOString().slice(0, 10),
    });

    const loadMiembros = useCallback(async () => {
        if (!user || !canRegister) return;
        try {
            if (user.role === "COORDINATOR") {
                const data = await listFormularioMiembros();
                setMiembros(data.members ?? []);
            } else if (user.role === "ADMIN") {
                if (adminCoordinatorId) {
                    const m = await listFormularioMiembros({ coordinatorId: adminCoordinatorId });
                    setMiembros(m.members ?? []);
                } else {
                    setMiembros([]);
                }
            }
        } catch {
            toast.error("No se pudieron cargar los miembros del grupo.");
            setMiembros([]);
        }
    }, [user, canRegister, adminCoordinatorId]);

    useEffect(() => {
        if (!open || !canRegister) return;
        if (user?.role === "ADMIN") {
            listFormularioCoordinadores()
                .then((r) => setCoordinadores(r.coordinators ?? []))
                .catch(() => {});
        }
    }, [open, canRegister, user?.role]);

    useEffect(() => {
        if (!open || !canRegister) return;
        void loadMiembros();
    }, [open, canRegister, loadMiembros]);

    useEffect(() => {
        if (!open) return;
        setForm({
            usuarioId: "",
            estatus: "PERMISO",
            motivo: "",
            fechaInicio: new Date().toISOString().slice(0, 10),
            fechaFin: new Date().toISOString().slice(0, 10),
        });
        if (user?.role === "ADMIN") {
            setAdminCoordinatorId("");
            setMiembros([]);
        }
    }, [open, user?.role]);

    const submit = async () => {
        if (!user) return;
        const coordinadorId = user.role === "COORDINATOR" ? user.id : adminCoordinatorId;
        if (!coordinadorId) {
            toast.error("Seleccione el coordinador responsable.");
            return;
        }
        if (!form.usuarioId) {
            toast.error("Seleccione el funcionario.");
            return;
        }
        setSubmitting(true);
        try {
            await createGestionPersonal({
                usuarioId: form.usuarioId,
                estatus: form.estatus,
                motivo: form.motivo.trim() || null,
                fechaInicio: new Date(form.fechaInicio).toISOString(),
                fechaFin: new Date(form.fechaFin).toISOString(),
                coordinadorId,
            });
            toast.success("Incidencia de personal registrada.");
            onOpenChange(false);
            setForm((p) => ({ ...p, usuarioId: "", motivo: "" }));
            onRegistered?.();
        } catch (e: unknown) {
            const msg =
                (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
                "No se pudo registrar la incidencia.";
            toast.error(typeof msg === "string" ? msg : "Error al registrar.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!canRegister) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card border-border text-card-foreground max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Registrar ausencia o permiso</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        El funcionario debe pertenecer al grupo del coordinador indicado. Los administradores eligen
                        coordinación y funcionario; los coordinadores, solo miembros de su equipo.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                    {user?.role === "ADMIN" && (
                        <div className="space-y-1">
                            <Label className="text-foreground">Coordinador responsable</Label>
                            <Select
                                value={adminCoordinatorId || "__pick__"}
                                onValueChange={(v) => {
                                    setAdminCoordinatorId(v === "__pick__" ? "" : v);
                                    setForm((f) => ({ ...f, usuarioId: "" }));
                                }}
                            >
                                <SelectTrigger className="bg-background border-border">
                                    <SelectValue placeholder="Elija coordinador" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    <SelectItem value="__pick__">Elija coordinador</SelectItem>
                                    {coordinadores.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="space-y-1">
                        <Label className="text-foreground">Funcionario</Label>
                        <Select
                            value={form.usuarioId || "__pick__"}
                            onValueChange={(v) => setForm((f) => ({ ...f, usuarioId: v === "__pick__" ? "" : v }))}
                            disabled={user?.role === "ADMIN" && !adminCoordinatorId}
                        >
                            <SelectTrigger className="bg-background border-border">
                                <SelectValue placeholder="Seleccione" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                <SelectItem value="__pick__">Seleccione</SelectItem>
                                {miembros.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.name} ({m.role})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-foreground">Tipo</Label>
                        <Select
                            value={form.estatus}
                            onValueChange={(v) => setForm((f) => ({ ...f, estatus: v as TipoEstatusPersonal }))}
                        >
                            <SelectTrigger className="bg-background border-border">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ESTATUS_LIST.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {ESTATUS_LABELS[s]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label className="text-foreground">Inicio</Label>
                            <Input
                                type="date"
                                value={form.fechaInicio}
                                onChange={(e) => setForm((f) => ({ ...f, fechaInicio: e.target.value }))}
                                className="bg-background border-border"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-foreground">Fin</Label>
                            <Input
                                type="date"
                                value={form.fechaFin}
                                onChange={(e) => setForm((f) => ({ ...f, fechaFin: e.target.value }))}
                                className="bg-background border-border"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-foreground">Motivo (opcional)</Label>
                        <Textarea
                            value={form.motivo}
                            onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))}
                            className="bg-background border-border min-h-[72px]"
                        />
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" className="border-border" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-500" onClick={() => void submit()} disabled={submitting}>
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
