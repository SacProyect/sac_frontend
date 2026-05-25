import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/UI/v2";
import { Card } from "@/components/UI/card";
import { Button } from "@/components/UI/button";
import { Input } from "@/components/UI/input";
import { Label } from "@/components/UI/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/UI/select";
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
  DialogHeader,
  DialogTitle,
} from "@/components/UI/dialog";
import { getAuditoria } from "@/components/utils/api/auditoria-functions";
import type { AuditoriaRow } from "@/types/auditoria";
import toast from "react-hot-toast";
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, Loader2 } from "lucide-react";

const ENTIDADES = [
  { value: "ALL", label: "Todas" },
  { value: "Contribuyente", label: "Contribuyente" },
  { value: "Declaracion_IVA", label: "Declaración IVA" },
  { value: "Declaracion_ISLR", label: "Declaración ISLR" },
];

const ACCIONES = [
  { value: "ALL", label: "Todas" },
  { value: "EDITAR_CONTRIBUYENTE", label: "Editar contribuyente" },
  { value: "BORRAR_CONTRIBUYENTE", label: "Borrar contribuyente (lógico)" },
  { value: "EDITAR_IVA", label: "Editar IVA" },
  { value: "BORRAR_DECLARACION_IVA", label: "Borrar declaración IVA" },
  { value: "EDITAR_ISLR", label: "Editar ISLR" },
  { value: "BORRAR_DECLARACION_ISLR", label: "Borrar declaración ISLR" },
];

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function formatFieldLabel(key: string): string {
  const normalized = key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function isDateField(key: string): boolean {
  const k = key.toLowerCase();
  return k.includes("date") || k.endsWith("_at") || k.includes("fecha");
}

function formatObjectValue(value: Record<string, unknown>): string {
  const name = typeof value.name === "string" ? value.name : undefined;
  const id = typeof value.id === "string" ? value.id : undefined;
  const label = typeof value.label === "string" ? value.label : undefined;
  const code = typeof value.code === "string" ? value.code : undefined;

  if (name && id) return `${name} (ID: ${id})`;
  if (label && id) return `${label} (ID: ${id})`;
  if (name) return name;
  if (label) return label;
  if (id && code) return `${code} (ID: ${id})`;
  if (id) return `ID: ${id}`;

  const readablePairs = Object.entries(value)
    .filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
    .slice(0, 4)
    .map(([k, v]) => `${formatFieldLabel(k)}: ${String(v)}`);

  if (readablePairs.length > 0) return readablePairs.join(" · ");
  return "Dato compuesto";
}

function formatFieldValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (isDateField(key) && typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleString("es-VE");
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    return formatObjectValue(value as Record<string, unknown>);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return `${value.length} elemento(s)`;
  }
  return String(value);
}

export default function AuditTrailPageV2() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<AuditoriaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 25;

  /** Filtros de selects (recarga al cambiar) */
  const [entidad, setEntidad] = useState("ALL");
  const [accion, setAccion] = useState("ALL");
  /** Filtros de texto/fecha: solo al pulsar «Aplicar filtros» */
  const [actorId, setActorId] = useState("");
  const [entidadId, setEntidadId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedActorId, setAppliedActorId] = useState("");
  const [appliedEntidadId, setAppliedEntidadId] = useState("");
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<AuditoriaRow | null>(null);
  const diffRows = useMemo(() => {
    if (!detailRow) return [];
    const oldValues = asRecord(detailRow.valores_anteriores);
    const newValues = asRecord(detailRow.valores_nuevos);
    const keys = Array.from(new Set([...Object.keys(oldValues), ...Object.keys(newValues)]));

    return keys
      .map((key) => {
        const before = oldValues[key];
        const after = newValues[key];
        return {
          key,
          label: formatFieldLabel(key),
          beforeText: formatFieldValue(key, before),
          afterText: formatFieldValue(key, after),
          changed: before !== after,
        };
      })
      .filter((row) => row.changed)
      .sort((a, b) => Number(b.changed) - Number(a.changed));
  }, [detailRow]);

  const allowed = user?.role === "ADMIN" || user?.role === "COORDINATOR";

  const fetchAuditoria = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAuditoria({
        page,
        limit,
        entidad: entidad === "ALL" ? undefined : entidad,
        accion: accion === "ALL" ? undefined : accion,
        actorId: appliedActorId || undefined,
        entidadId: appliedEntidadId || undefined,
        dateFrom: appliedDateFrom || undefined,
        dateTo: appliedDateTo
          ? `${appliedDateTo}T23:59:59.999Z`
          : undefined,
      });
      setRows(res.data ?? []);
      setTotal(res.total ?? 0);
      setTotalPages(res.totalPages ?? 0);
    } catch (e: unknown) {
      let msg: string | undefined;
      if (e && typeof e === "object" && "response" in e) {
        const data = (e as { response?: { data?: { error?: unknown } } }).response
          ?.data;
        if (data && typeof data === "object" && "error" in data) {
          const err = (data as { error?: unknown }).error;
          msg = typeof err === "string" ? err : undefined;
        }
      }
      toast.error(
        typeof msg === "string" ? msg : "No se pudo cargar la auditoría.",
      );
      setRows([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    entidad,
    accion,
    appliedActorId,
    appliedEntidadId,
    appliedDateFrom,
    appliedDateTo,
  ]);

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    void fetchAuditoria();
  }, [fetchAuditoria, allowed]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowed) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="space-y-6 w-full max-w-full">
      <PageHeader
        title="Auditoría y trazabilidad"
        description="Registro de cambios sensibles (contribuyentes, IVA, ISLR). Solo lectura."
        action={<Button variant="outline" onClick={() => navigate('/admin')} className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>}
      />

      <Card className="bg-slate-800/80 border-slate-700 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label className="text-slate-400 text-xs">Entidad</Label>
            <Select
              value={entidad}
              onValueChange={(v) => {
                setEntidad(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-slate-900 border-slate-600 text-white mt-1">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {ENTIDADES.map((o) => (
                  <SelectItem key={o.value || "all"} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-400 text-xs">Acción</Label>
            <Select
              value={accion}
              onValueChange={(v) => {
                setAccion(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-slate-900 border-slate-600 text-white mt-1">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600 max-h-64">
                {ACCIONES.map((o) => (
                  <SelectItem key={o.value || "all-a"} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-400 text-xs">ID del registro (entidad)</Label>
            <Input
              value={entidadId}
              onChange={(e) => setEntidadId(e.target.value)}
              placeholder="UUID"
              className="bg-slate-900 border-slate-600 text-white mt-1"
            />
          </div>
          <div>
            <Label className="text-slate-400 text-xs">Usuario actor (ID)</Label>
            <Input
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
              placeholder="UUID del fiscal / usuario"
              className="bg-slate-900 border-slate-600 text-white mt-1"
            />
          </div>
          <div>
            <Label className="text-slate-400 text-xs">Desde</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-slate-900 border-slate-600 text-white mt-1"
            />
          </div>
          <div>
            <Label className="text-slate-400 text-xs">Hasta</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-slate-900 border-slate-600 text-white mt-1"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setAppliedActorId(actorId.trim());
              setAppliedEntidadId(entidadId.trim());
              setAppliedDateFrom(dateFrom);
              setAppliedDateTo(dateTo);
              setPage(1);
            }}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Aplicar filtros
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-slate-600 text-black"
            onClick={() => {
              setEntidad("ALL");
              setAccion("ALL");
              setActorId("");
              setEntidadId("");
              setDateFrom("");
              setDateTo("");
              setAppliedActorId("");
              setAppliedEntidadId("");
              setAppliedDateFrom("");
              setAppliedDateTo("");
              setPage(1);
            }}
          >
            Limpiar
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          {user.role === "COORDINATOR"
            ? "Como coordinador solo ves acciones de los fiscales de tu grupo (y las tuyas)."
            : "Como administrador ves el historial completo del sistema."}{" "}
          Total: {total} registro(s).
        </p>
      </Card>

      <Card className="bg-slate-800/80 border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-800/50">
                <TableHead className="text-slate-300">Fecha</TableHead>
                <TableHead className="text-slate-300">Actor</TableHead>
                <TableHead className="text-slate-300">Rol</TableHead>
                <TableHead className="text-slate-300">Acción</TableHead>
                <TableHead className="text-slate-300">Entidad</TableHead>
                <TableHead className="text-slate-300">ID registro</TableHead>
                <TableHead className="text-slate-300 w-[100px]">Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-400 py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto inline" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 py-12">
                    No hay registros con los filtros actuales.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id} className="border-slate-700">
                    <TableCell className="text-slate-200 whitespace-nowrap text-sm">
                      {new Date(r.fecha).toLocaleString("es-VE")}
                    </TableCell>
                    <TableCell className="text-slate-200 text-sm max-w-[180px] truncate">
                      {r.user?.name ?? r.usuario_id}
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs">
                      {r.user?.role ?? "—"}
                    </TableCell>
                    <TableCell className="text-slate-300 text-xs font-mono">
                      {r.accion}
                    </TableCell>
                    <TableCell className="text-slate-300 text-xs">{r.entidad}</TableCell>
                    <TableCell className="text-slate-400 text-xs font-mono max-w-[120px] truncate">
                      {r.entidad_id}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-indigo-400 hover:text-indigo-300"
                        onClick={() => {
                          setDetailRow(r);
                          setDetailOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between gap-4 p-4 border-t border-slate-700">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="border-slate-600 text-slate-200"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            Anterior
          </Button>
          <span className="text-sm text-slate-400">
            Página {page}
            {totalPages > 0 ? ` de ${totalPages}` : ""}
            {totalPages === 0 && !loading ? " (sin datos)" : ""}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={
              loading || totalPages === 0 || page >= totalPages
            }
            onClick={() => setPage((p) => p + 1)}
            className="border-slate-600 text-slate-200"
          >
            Siguiente
            <ChevronRight className="h-4 w-4 shrink-0" />
          </Button>
        </div>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de auditoría</DialogTitle>
          </DialogHeader>
          {detailRow && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-slate-500">Acción</span>
                  <p className="font-mono text-xs">{detailRow.accion}</p>
                </div>
                <div>
                  <span className="text-slate-500">Entidad</span>
                  <p>{detailRow.entidad}</p>
                </div>
              </div>
              <div>
                <div className="rounded-lg border border-slate-800 overflow-hidden">
                  <div className="grid grid-cols-[minmax(140px,1.2fr)_1fr_1fr] bg-slate-950/70 px-3 py-2 text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-800">
                    <span>Campo</span>
                    <span>Antes</span>
                    <span>Ahora</span>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto">
                    {diffRows.length === 0 ? (
                      <div className="px-3 py-4 text-xs text-slate-400">No hay cambios detectados en los campos comparables.</div>
                    ) : (
                      diffRows.map((row) => (
                        <div
                          key={row.key}
                          className="grid grid-cols-[minmax(140px,1.2fr)_1fr_1fr] gap-3 px-3 py-2 border-b border-slate-800/80 last:border-b-0 bg-amber-500/5"
                        >
                          <div className="text-slate-300 text-xs font-medium">
                            {row.label}
                            <span className="ml-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-300">
                              Cambió
                            </span>
                          </div>
                          <div className="text-xs break-all text-rose-300">
                            {row.beforeText}
                          </div>
                          <div className="text-xs break-all text-emerald-300">
                            {row.afterText}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
