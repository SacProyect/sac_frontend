import { useEffect, useState } from "react";
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
import { Download, RefreshCw, SlidersHorizontal, CalendarRange } from "lucide-react";
import { defaultAuditWindow, datetimeLocalValueToIso, isoToDatetimeLocalValue } from "../utils/datetime-local";
import type { InternalAuditQueryParams } from "@/types/internal-audit";

const CARTERA_YEAR_MIN = 2018;
const CARTERA_YEAR_MAX = 2032;

const inputDense =
  "h-8 text-xs bg-slate-900 border-slate-700/80 text-slate-100 py-1 px-2 shadow-none";

function clampShortHours(n: number): number {
  return Math.min(168, Math.max(1, Math.round(n)));
}

/** Vacío o inválido → fallback (último valor conocido del borrador). */
function parseShortHoursInput(raw: string, fallback: number): number {
  const t = raw.trim();
  if (t === "") return clampShortHours(fallback);
  const n = parseInt(t, 10);
  if (Number.isNaN(n)) return clampShortHours(fallback);
  return clampShortHours(n);
}

function yearOptions(): number[] {
  const out: number[] = [];
  for (let y = CARTERA_YEAR_MAX; y >= CARTERA_YEAR_MIN; y -= 1) out.push(y);
  return out;
}

export type InternalAuditDraft = {
  fromLocal: string;
  toLocal: string;
  shortHours: number;
  /** Año civil para casos / pendientes IVA·ISLR (mismo criterio que estadísticas del fiscal). */
  statsYear: number;
};

type Props = {
  draft: InternalAuditDraft;
  onDraftChange: (d: InternalAuditDraft) => void;
  /** Recibe el borrador consolidado (horas cortas tomadas del input). */
  onApply: (next: InternalAuditDraft) => void;
  onExportCsv: () => void;
  onRefresh: () => void;
  busy?: boolean;
  onPresetDays: (days: number) => void;
};

export function InternalAuditToolbar({
  draft,
  onDraftChange,
  onApply,
  onExportCsv,
  onRefresh,
  busy,
  onPresetDays,
}: Props) {
  const [hoursStr, setHoursStr] = useState(() => String(draft.shortHours));

  useEffect(() => {
    setHoursStr(String(draft.shortHours));
  }, [draft.shortHours]);

  const mergeCommittedShortHours = (base: InternalAuditDraft): InternalAuditDraft => {
    const shortHours = parseShortHoursInput(hoursStr, base.shortHours);
    setHoursStr(String(shortHours));
    return { ...base, shortHours };
  };

  const runApply = () => {
    const next = mergeCommittedShortHours(draft);
    onDraftChange(next);
    onApply(next);
  };

  return (
    <div className="rounded-lg border border-slate-800/90 bg-slate-950/80 p-3 space-y-3">
      {/* Fila 1: título + presets */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between gap-y-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-cyan-400/70" aria-hidden />
          <span className="text-xs font-medium text-slate-200 truncate">
            Ventana de adopción <span className="text-slate-500 font-normal">(auditoría)</span>
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {([7, 30, 90] as const).map((d) => (
            <Button
              key={d}
              type="button"
              variant="secondary"
              size="sm"
              className="h-7 px-2 text-[11px]"
              onClick={() => onPresetDays(d)}
            >
              {d}d
            </Button>
          ))}
        </div>
      </div>

      {/* Fila 2: fechas + horas + acciones — grilla densa alineada */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-3 gap-y-2 items-end">
        <div className="space-y-0.5 sm:col-span-1 lg:col-span-3">
          <Label className="text-[10px] uppercase tracking-wide text-slate-500">Desde</Label>
          <Input
            type="datetime-local"
            className={inputDense}
            value={draft.fromLocal}
            onChange={(e) => onDraftChange({ ...draft, fromLocal: e.target.value })}
          />
        </div>
        <div className="space-y-0.5 sm:col-span-1 lg:col-span-3">
          <Label className="text-[10px] uppercase tracking-wide text-slate-500">Hasta</Label>
          <Input
            type="datetime-local"
            className={inputDense}
            value={draft.toLocal}
            onChange={(e) => onDraftChange({ ...draft, toLocal: e.target.value })}
          />
        </div>
        <div className="space-y-0.5 sm:col-span-1 lg:col-span-2">
          <Label
            className="text-[10px] uppercase tracking-wide text-slate-500"
            title="KPI actividad: últimas N horas desde ahora"
          >
            Horas cortas
          </Label>
          <Input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={3}
            className={`${inputDense} tabular-nums`}
            value={hoursStr}
            onChange={(e) => setHoursStr(e.target.value)}
            onBlur={() => {
              const n = parseShortHoursInput(hoursStr, draft.shortHours);
              setHoursStr(String(n));
              if (n !== draft.shortHours) onDraftChange({ ...draft, shortHours: n });
            }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5 sm:col-span-2 lg:col-span-4 lg:justify-end">
          <Button type="button" size="sm" className="h-8 text-xs px-3" onClick={runApply} disabled={busy}>
            Aplicar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs px-2.5"
            onClick={() => void onRefresh()}
            disabled={busy}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${busy ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs px-2.5"
            onClick={() => void onExportCsv()}
            disabled={busy}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            CSV
          </Button>
        </div>
      </div>

      {/* Fila 3: cartera — una sola línea compacta */}
      <div className="border-t border-slate-800/80 pt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap sm:gap-x-3 sm:gap-y-1">
        <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
          <CalendarRange className="h-3.5 w-3.5" aria-hidden />
          <span className="text-xs font-medium text-slate-300">Cartera</span>
        </div>
        <div className="flex flex-wrap items-end gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Label htmlFor="audit-stats-year" className="text-[10px] uppercase tracking-wide text-slate-500 sr-only">
              Año cartera
            </Label>
            <span className="text-[10px] text-slate-500 hidden sm:inline">Año</span>
            <Select
              value={String(draft.statsYear)}
              onValueChange={(v) => onDraftChange({ ...draft, statsYear: parseInt(v, 10) })}
            >
              <SelectTrigger
                id="audit-stats-year"
                className="h-8 w-[88px] text-xs bg-slate-900 border-slate-700/80 text-slate-100"
                title="Año civil para casos, pendientes y ∅ IVA/ISLR (misma regla que estadísticas por fiscal)."
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions().map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="secondary" size="sm" className="h-8 text-xs px-2.5" onClick={runApply} disabled={busy}>
              Aplicar año
            </Button>
          </div>
          <p className="text-[10px] text-slate-500 sm:ml-auto max-w-[min(100%,28rem)] leading-snug">
            Independiente de las fechas de arriba: métricas de cartera usan este año civil.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Estado inicial del borrador a partir de params aplicados */
export function draftFromQuery(q: InternalAuditQueryParams): InternalAuditDraft {
  const def = defaultAuditWindow();
  const fromIso = q.from ?? def.fromIso;
  const toIso = q.to ?? def.toIso;
  const y = q.statsYear ?? new Date().getUTCFullYear();
  return {
    fromLocal: isoToDatetimeLocalValue(fromIso),
    toLocal: isoToDatetimeLocalValue(toIso),
    shortHours: q.shortHours ?? 24,
    statsYear: Math.min(CARTERA_YEAR_MAX, Math.max(CARTERA_YEAR_MIN, y)),
  };
}

export function queryFromDraft(draft: InternalAuditDraft): InternalAuditQueryParams {
  return {
    from: datetimeLocalValueToIso(draft.fromLocal),
    to: datetimeLocalValueToIso(draft.toLocal),
    shortHours: draft.shortHours,
    statsYear: draft.statsYear,
  };
}
