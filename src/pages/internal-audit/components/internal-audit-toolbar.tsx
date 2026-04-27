import { Button } from "@/components/UI/button";
import { Input } from "@/components/UI/input";
import { Label } from "@/components/UI/label";
import { Download, RefreshCw, SlidersHorizontal } from "lucide-react";
import { defaultAuditWindow, datetimeLocalValueToIso, isoToDatetimeLocalValue } from "../utils/datetime-local";
import type { InternalAuditQueryParams } from "@/types/internal-audit";

export type InternalAuditDraft = {
  fromLocal: string;
  toLocal: string;
  shortHours: number;
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
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-slate-300">
        <SlidersHorizontal className="h-4 w-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-200">Ventana de análisis</span>
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
          <p className="text-[10px] text-slate-500">KPI «últimas N horas» respecto al momento actual</p>
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
    </div>
  );
}

/** Estado inicial del borrador a partir de params aplicados */
export function draftFromQuery(q: InternalAuditQueryParams): InternalAuditDraft {
  const def = defaultAuditWindow();
  const fromIso = q.from ?? def.fromIso;
  const toIso = q.to ?? def.toIso;
  return {
    fromLocal: isoToDatetimeLocalValue(fromIso),
    toLocal: isoToDatetimeLocalValue(toIso),
    shortHours: q.shortHours ?? 24,
  };
}

export function queryFromDraft(draft: InternalAuditDraft): InternalAuditQueryParams {
  return {
    from: datetimeLocalValueToIso(draft.fromLocal),
    to: datetimeLocalValueToIso(draft.toLocal),
    shortHours: draft.shortHours,
  };
}
