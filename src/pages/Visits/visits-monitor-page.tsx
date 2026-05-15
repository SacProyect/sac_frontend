import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card";
import { Input } from "@/components/UI/input";
import { Badge } from "@/components/UI/badge";
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
import { Skeleton } from "@/components/UI/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/UI/dialog";
import { useVisitsMonitor } from "@/hooks/use-visits-monitor";
import { VisitStatus } from "@/types/visits";

const statusClassName: Record<VisitStatus, string> = {
  espera: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  atendido: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  finalizado: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rechazado: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  reprogramado: "bg-sky-500/15 text-sky-300 border-sky-500/30",
};

const statusLabel: Record<VisitStatus, string> = {
  espera: "espera",
  atendido: "atendido",
  finalizado: "finalizado",
  rechazado: "rechazado",
  reprogramado: "reprogramado",
};

const wsStatusLabel: Record<string, string> = {
  connecting: "Conectando",
  connected: "Conectado",
  disconnected: "Desconectado",
  error: "Error de conexión",
};

const wsStatusClassName: Record<string, string> = {
  connecting: "bg-amber-500/20 text-amber-300 border-amber-500/20",
  connected: "bg-emerald-500/20 text-emerald-300 border-emerald-500/20",
  disconnected: "bg-slate-500/20 text-slate-300 border-slate-500/20",
  error: "bg-rose-500/20 text-rose-300 border-rose-500/20",
};

const realtimeEventLabel: Record<string, string> = {
  "visit.created": "Nueva visita registrada",
  "visit.attended": "Visita atendida",
  "visit.updated": "Visita actualizada",
  "visit.exited": "Salida registrada",
  "visit.deleted": "Visita eliminada",
};

const formatDateTime = (date: string, time: string) => {
  if (!date && !time) return "-";
  if (!date) return time;
  return `${new Date(`${date}T00:00:00`).toLocaleDateString("es-VE")} ${time ?? ""}`;
};

const getVisitContributorName = (visit: any): string => {
  return visit?.contributor_name ?? visit?.contributor?.name ?? visit?.contribuyente ?? "-";
};

const getVisitContributorRif = (visit: any): string => {
  return visit?.contributor_rif ?? visit?.contributor?.rif ?? visit?.rif ?? "-";
};

const getVisitPhotoUrl = (visit: any): string | null => {
  const photos = Array.isArray(visit?.photos) ? visit.photos : [];
  const fromPhotos = photos[0]?.photo_url;
  const fromSignature = visit?.signature_image_url;
  return fromPhotos ?? fromSignature ?? null;
};

export default function VisitsMonitorPage() {
  const [selectedImage, setSelectedImage] = useState<{ url: string; label: string } | null>(null);
  const {
    loading,
    error,
    wsStatus,
    lastRealtimeEvent,
    dashboard,
    liveVisits,
    history,
    filters,
    setSearchFilter,
    setStatusFilter,
  } = useVisitsMonitor();

  const totals = useMemo(
    () => ({
      active: dashboard?.totals?.in_waiting ?? 0,
      entries: dashboard?.totals?.entries ?? 0,
      finished: dashboard?.totals?.finished ?? 0,
      delta: dashboard?.comparison?.vs_previous_day_pct ?? 0,
    }),
    [dashboard]
  );

  return (
    <div className="space-y-6 text-slate-100">
      <Dialog open={Boolean(selectedImage)} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl border-slate-700 bg-slate-950 p-3 sm:p-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-slate-100">Foto de visita</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
              <img
                src={selectedImage.url}
                alt={selectedImage.label}
                className="max-h-[75vh] w-full rounded-md object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <section className="rounded-xl border border-slate-800/70 bg-slate-950/70 px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Monitoreo SAC</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Monitoreo de Visitas</h1>
            <p className="mt-1 text-sm text-slate-400">
              Seguimiento operativo en tiempo real de ingresos y estado de visitas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={wsStatusClassName[wsStatus]}>{wsStatusLabel[wsStatus]}</Badge>
            {lastRealtimeEvent && (
              <span className="text-xs text-slate-400">
                {realtimeEventLabel[lastRealtimeEvent.type] ?? lastRealtimeEvent.type} ·{" "}
                {new Date(lastRealtimeEvent.occurredAt).toLocaleTimeString("es-VE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-800/70 bg-slate-900/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">Visitas activas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-white">{totals.active}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-800/70 bg-slate-900/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ingresos hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-white">{totals.entries}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-800/70 bg-slate-900/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-white">{totals.finished}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-800/70 bg-slate-900/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">Variación diaria</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-semibold ${totals.delta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
              {totals.delta >= 0 ? "+" : ""}
              {totals.delta.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-xl border border-slate-800/70 bg-slate-900/50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Input
            value={filters.search}
            onChange={(event) => setSearchFilter(event.target.value)}
            placeholder="Buscar por contribuyente, RIF, ID o zona..."
            className="h-10 border-slate-700 bg-slate-950 text-slate-100 md:max-w-md"
          />
          <Select value={filters.status} onValueChange={(value) => setStatusFilter(value as "todos" | VisitStatus)}>
            <SelectTrigger className="h-10 w-full border-slate-700 bg-slate-950 text-slate-100 md:w-[220px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="espera">espera</SelectItem>
              <SelectItem value="atendido">atendido</SelectItem>
              <SelectItem value="finalizado">finalizado</SelectItem>
              <SelectItem value="rechazado">rechazado</SelectItem>
              <SelectItem value="reprogramado">reprogramado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800/70 bg-slate-900/50">
        <div className="flex items-center justify-between border-b border-slate-800/70 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Visitas en vivo</h2>
          <span className="text-xs text-slate-500">{liveVisits.length} resultados</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800/70 hover:bg-transparent">
              <TableHead className="text-slate-400">Foto</TableHead>
              <TableHead className="hidden text-slate-400 sm:table-cell">ID</TableHead>
              <TableHead className="text-slate-400">Visitante</TableHead>
              <TableHead className="text-slate-400">RIF</TableHead>
              <TableHead className="text-slate-400">Zona / Depto.</TableHead>
              <TableHead className="text-slate-400">Estado</TableHead>
              <TableHead className="text-right text-slate-400">Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 7 }).map((_, index) => (
                  <TableRow key={`live-skeleton-${index}`} className="border-slate-800/60">
                    <TableCell colSpan={7}>
                      <Skeleton className="h-5 w-full bg-slate-800" />
                    </TableCell>
                  </TableRow>
                ))
              : liveVisits.map((visit) => (
                  <TableRow key={visit.id} className="border-slate-800/60 hover:bg-slate-800/30">
                    <TableCell>
                      {getVisitPhotoUrl(visit) ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedImage({
                              url: getVisitPhotoUrl(visit) ?? "",
                              label: `Foto de ${getVisitContributorName(visit)}`,
                            })
                          }
                          className="group relative rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                        >
                          <img
                            src={getVisitPhotoUrl(visit) ?? ""}
                            alt={`Foto de ${getVisitContributorName(visit)}`}
                            className="h-10 w-10 rounded-md object-cover border border-slate-700/80 transition-all group-hover:brightness-110 group-hover:border-slate-500"
                            loading="lazy"
                          />
                        </button>
                      ) : (
                        <div className="h-10 w-10 rounded-md border border-slate-700/80 bg-slate-800/70 flex items-center justify-center text-[10px] text-slate-400">
                          S/F
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs text-indigo-300 sm:table-cell">
                      {visit.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="font-medium text-slate-100">{getVisitContributorName(visit)}</TableCell>
                    <TableCell className="text-slate-300">{getVisitContributorRif(visit)}</TableCell>
                    <TableCell className="text-slate-300">{visit.department ?? "-"}</TableCell>
                    <TableCell>
                      <Badge className={statusClassName[visit.status]}>{statusLabel[visit.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-slate-300">
                      {formatDateTime(visit.entry_date, visit.entry_time)}
                    </TableCell>
                  </TableRow>
                ))}
            {!loading && liveVisits.length === 0 && (
              <TableRow className="border-slate-800/60">
                <TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">
                  No hay visitas en vivo para los filtros seleccionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      {/* <section className="rounded-xl border border-slate-800/70 bg-slate-900/50">
        <div className="flex items-center justify-between border-b border-slate-800/70 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Historial</h2>
          <span className="text-xs text-slate-500">{history.total} total</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800/70 hover:bg-transparent">
              <TableHead className="text-slate-400">ID</TableHead>
              <TableHead className="text-slate-400">Contribuyente</TableHead>
              <TableHead className="text-slate-400">RIF</TableHead>
              <TableHead className="text-slate-400">Registro</TableHead>
              <TableHead className="text-slate-400">Estado</TableHead>
              <TableHead className="text-right text-slate-400">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`history-skeleton-${index}`} className="border-slate-800/60">
                    <TableCell colSpan={6}>
                      <Skeleton className="h-5 w-full bg-slate-800" />
                    </TableCell>
                  </TableRow>
                ))
              : history.items.map((item) => (
                  <TableRow key={item.id} className="border-slate-800/60 hover:bg-slate-800/30">
                    <TableCell className="font-mono text-xs text-indigo-300">{item.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium text-slate-100">{item.contribuyente}</TableCell>
                    <TableCell className="text-slate-300">{item.rif}</TableCell>
                    <TableCell className="text-slate-300">{item.registro || "-"}</TableCell>
                    <TableCell>
                      <Badge className={statusClassName[item.estado]}>{statusLabel[item.estado]}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-slate-300">-</TableCell>
                  </TableRow>
                ))}
            {!loading && history.items.length === 0 && (
              <TableRow className="border-slate-800/60">
                <TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500">
                  No hay registros de historial disponibles.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section> */}

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}
    </div>
  );
}
