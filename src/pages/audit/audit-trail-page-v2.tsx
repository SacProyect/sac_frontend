import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
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
  DialogTitle,
} from "@/components/UI/dialog";
import { getAuditoria } from "@/components/utils/api/auditoria-functions";
import type { AuditoriaRow } from "@/types/auditoria";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Filter,
  User,
  Database,
  History,
  X,
  FileText
} from "lucide-react";

const ENTIDADES = [
  { value: "ALL", label: "Todas las entidades" },
  { value: "Contribuyente", label: "Contribuyente" },
  { value: "Declaracion_IVA", label: "Declaración IVA" },
  { value: "Declaracion_ISLR", label: "Declaración ISLR" },
];

const ACCIONES = [
  { value: "ALL", label: "Todas las acciones" },
  { value: "EDITAR_CONTRIBUYENTE", label: "Editar contribuyente" },
  { value: "BORRAR_CONTRIBUYENTE", label: "Borrar contribuyente" },
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

function ActionBadge({ action }: { action: string }) {
  if (action.includes("BORRAR")) {
    return <span className="inline-flex items-center rounded bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20">{action.replace(/_/g, " ")}</span>;
  }
  if (action.includes("EDITAR")) {
    return <span className="inline-flex items-center rounded bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">{action.replace(/_/g, " ")}</span>;
  }
  return <span className="inline-flex items-center rounded bg-slate-500/10 px-2 py-0.5 text-[11px] font-medium text-slate-400 ring-1 ring-inset ring-slate-500/20">{action.replace(/_/g, " ")}</span>;
}

export default function AuditTrailPageV2() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AuditoriaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 25;

  const [entidad, setEntidad] = useState("ALL");
  const [accion, setAccion] = useState("ALL");
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
        const data = (e as { response?: { data?: { error?: unknown } } }).response?.data;
        if (data && typeof data === "object" && "error" in data) {
          const err = (data as { error?: unknown }).error;
          msg = typeof err === "string" ? err : undefined;
        }
      }
      toast.error(typeof msg === "string" ? msg : "No se pudo cargar la auditoría.");
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

  const handleApplyFilters = () => {
    setAppliedActorId(actorId.trim());
    setAppliedEntidadId(entidadId.trim());
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setPage(1);
  };

  const handleClearFilters = () => {
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
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      <PageHeader
        title="Trazabilidad y Auditoría"
        description="Explora el historial de cambios del sistema. Búsqueda por fiscal, tipo y fechas."
      />

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Filtros avanzados */}
        <div className="w-full xl:w-1/4 space-y-4 xl:sticky xl:top-6">
          <Card className="bg-slate-900 border-slate-800 shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-900/50">
              <h3 className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                Filtros de Búsqueda
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-slate-400 hover:text-slate-300 hover:bg-slate-800"
                onClick={handleClearFilters}
              >
                Limpiar
              </Button>
            </div>

            <div className="p-5 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs text-slate-400 font-medium">Nombre de Fiscal o Usuario</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    value={actorId}
                    onChange={(e) => setActorId(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="pl-9 bg-slate-950/50 border-slate-800 h-9 text-sm focus-visible:ring-indigo-500 text-slate-200"
                    onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-400 font-medium">Tipo de Entidad</Label>
                <Select value={entidad} onValueChange={(v) => { setEntidad(v); setPage(1); }}>
                  <SelectTrigger className="bg-slate-950/50 border-slate-800 h-9 text-sm text-slate-200">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {ENTIDADES.map((o) => (
                      <SelectItem key={o.value || "all"} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-400 font-medium">Tipo de Acción</Label>
                <Select value={accion} onValueChange={(v) => { setAccion(v); setPage(1); }}>
                  <SelectTrigger className="bg-slate-950/50 border-slate-800 h-9 text-sm text-slate-200">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {ACCIONES.map((o) => (
                      <SelectItem key={o.value || "all-a"} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-400 font-medium">ID del Registro</Label>
                <div className="relative">
                  <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    value={entidadId}
                    onChange={(e) => setEntidadId(e.target.value)}
                    placeholder="UUID"
                    className="pl-9 bg-slate-950/50 border-slate-800 h-9 text-sm focus-visible:ring-indigo-500 text-slate-200"
                    onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400 font-medium">Desde</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-slate-950/50 border-slate-800 h-9 text-xs text-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400 font-medium">Hasta</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-slate-950/50 border-slate-800 h-9 text-xs text-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50 mt-auto">
              <Button
                type="button"
                onClick={handleApplyFilters}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 h-10 transition-all"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                Buscar Registros
              </Button>
            </div>
          </Card>
        </div>

        {/* Tabla principal */}
        <div className="w-full xl:w-3/4 space-y-4">
          <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/30">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-medium text-slate-200">Resultados</h3>
                <span className="ml-3 inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400 ring-1 ring-inset ring-slate-700">
                  {total} registros
                </span>
              </div>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 bg-slate-950/40 hover:bg-slate-950/40">
                    <TableHead className="text-slate-400 text-xs font-medium uppercase tracking-wider">Fecha</TableHead>
                    <TableHead className="text-slate-400 text-xs font-medium uppercase tracking-wider">Actor</TableHead>
                    <TableHead className="text-slate-400 text-xs font-medium uppercase tracking-wider">Entidad</TableHead>
                    <TableHead className="text-slate-400 text-xs font-medium uppercase tracking-wider">Acción</TableHead>
                    <TableHead className="text-slate-400 text-xs font-medium uppercase tracking-wider">Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-[300px] text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-400 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-[300px] text-center text-slate-500 text-sm">
                        No hay registros que coincidan con la búsqueda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <TableRow key={r.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                        <TableCell className="text-slate-300 text-xs whitespace-nowrap">
                          {new Date(r.fecha).toLocaleString("es-VE", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate">
                          <div className="text-slate-200 text-sm font-medium">{r.user?.name ?? "Desconocido"}</div>
                          <div className="text-slate-500 text-[10px] uppercase tracking-wider mt-0.5">{r.user?.role ?? "Sin Rol"}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-slate-300 text-sm">{r.entidad.replace(/_/g, " ")}</div>
                          <div className="text-slate-500 text-[10px] font-mono mt-0.5 truncate max-w-[140px]">{r.entidad_id}</div>
                        </TableCell>
                        <TableCell>
                          <ActionBadge action={r.accion} />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-full"
                            onClick={() => {
                              setDetailRow(r);
                              setDetailOpen(true);
                            }}
                          >
                            <span className="sr-only">Ver detalle</span>
                            <Search className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-900/30">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-xs text-slate-500 font-medium">
                Página {page} de {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={loading || totalPages === 0 || page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 shadow-2xl text-slate-200 max-w-3xl p-0 overflow-hidden rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/20">
                <History className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-slate-100">
                  Detalle de Auditoría
                </DialogTitle>
                <p className="text-xs text-slate-400 mt-0.5">Revisión de cambios del registro</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full"
              onClick={() => setDetailOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {detailRow && (
            <div className="max-h-[70vh] overflow-y-auto">
              <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/30">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Fecha</div>
                  <div className="text-sm font-medium text-slate-300">
                    {new Date(detailRow.fecha).toLocaleString("es-VE")}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Actor</div>
                  <div className="text-sm font-medium text-slate-300">
                    {detailRow.user?.name ?? "Desconocido"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Entidad</div>
                  <div className="text-sm font-medium text-slate-300">{detailRow.entidad}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Acción</div>
                  <div><ActionBadge action={detailRow.accion} /></div>
                </div>
              </div>

              <div className="p-5">
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                  Campos Modificados
                </h4>
                <div className="rounded-lg border border-slate-800 overflow-hidden bg-slate-950/50">
                  <div className="grid grid-cols-[minmax(140px,1.2fr)_1fr_1fr] bg-slate-900 px-4 py-2.5 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800 font-medium">
                    <span>Campo</span>
                    <span>Valor Anterior</span>
                    <span>Nuevo Valor</span>
                  </div>
                  <div>
                    {diffRows.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-center text-slate-500">
                        No se detectaron cambios en los campos o la acción no modificó datos.
                      </div>
                    ) : (
                      diffRows.map((row) => (
                        <div
                          key={row.key}
                          className="grid grid-cols-[minmax(140px,1.2fr)_1fr_1fr] gap-4 px-4 py-3 border-b border-slate-800/50 last:border-b-0 hover:bg-slate-900/50 transition-colors"
                        >
                          <div className="text-slate-300 text-xs font-medium pt-0.5">
                            {row.label}
                          </div>
                          <div className="text-xs break-all text-rose-300/90 font-mono bg-rose-500/5 p-2 rounded border border-rose-500/10">
                            {row.beforeText}
                          </div>
                          <div className="text-xs break-all text-emerald-300/90 font-mono bg-emerald-500/5 p-2 rounded border border-emerald-500/10">
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
