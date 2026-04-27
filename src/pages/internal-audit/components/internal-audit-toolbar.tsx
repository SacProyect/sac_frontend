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
  onApply: () => void;
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
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-slate-300">
        <SlidersHorizontal className="h-4 w-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-200">Ventana de análisis (eventos de auditoría en el sistema)</span>
        <div className="flex flex-wrap gap-2 ml-auto">
          <Button type="button" variant="secondary" size="sm" onClick={() => onPresetDays(7)}>
            7 días
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => onPresetDays(30)}>
            30 días
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => onPresetDays(90)}>
            90 días
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="space-y-1.5">
          <Label className="text-slate-400 text-xs">Desde</Label>
          <Input
            type="datetime-local"
            className="bg-slate-950 border-slate-600 text-slate-100"
            value={draft.fromLocal}
            onChange={(e) => onDraftChange({ ...draft, fromLocal: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-400 text-xs">Hasta</Label>
          <Input
            type="datetime-local"
            className="bg-slate-950 border-slate-600 text-slate-100"
            value={draft.toLocal}
            onChange={(e) => onDraftChange({ ...draft, toLocal: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-400 text-xs">Ventana corta (horas)</Label>
          <Input
            type="number"
            min={1}
            max={168}
            className="bg-slate-950 border-slate-600 text-slate-100"
            value={draft.shortHours}
            onChange={(e) =>
              onDraftChange({ ...draft, shortHours: Math.min(168, Math.max(1, Number(e.target.value) || 24)) })
            }
          />
          <p className="text-[10px] text-slate-500">KPI de actividad: últimas N horas respecto a ahora</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onApply} disabled={busy} className="flex-1 min-w-[120px]">
            Aplicar filtros
          </Button>
          <Button type="button" variant="outline" onClick={() => void onRefresh()} disabled={busy}>
            <RefreshCw className={`h-4 w-4 mr-2 ${busy ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button type="button" variant="outline" onClick={() => void onExportCsv()} disabled={busy}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      <div className="border-t border-slate-700 pt-4 flex flex-wrap items-start gap-3">
        <CalendarRange className="h-4 w-4 text-slate-500 mt-1 shrink-0" />
        <div className="flex-1 min-w-[200px] space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-200">Cartera fiscal y declaraciones</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Independiente de la ventana de arriba: aquí eliges el <strong className="text-slate-400">año civil</strong> para
            contar casos asignados, pendientes de culminar y contribuyentes sin declaración IVA o ISLR en ese año (misma
            regla que el módulo Estadísticas por fiscal).
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5 w-[140px]">
              <Label className="text-slate-400 text-xs">Año cartera</Label>
              <Select
                value={String(draft.statsYear)}
                onValueChange={(v) => onDraftChange({ ...draft, statsYear: parseInt(v, 10) })}
              >
                <SelectTrigger className="bg-slate-950 border-slate-600 text-slate-100">
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
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={onApply} disabled={busy}>
              Aplicar año cartera
            </Button>
          </div>
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
