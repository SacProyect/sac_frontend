import { TaxCase } from "@/types/tax-case";
import { Button } from "@/components/UI/button";
import { Plus } from "lucide-react";

interface CaseSelectorProps {
  cases: TaxCase[];
  selectedCaseId: string | null;
  onSelect: (caseId: string | null) => void;
  onCreateCase?: () => void;
}

const faseColors: Record<string, string> = {
  FISCALIZACION: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  CITACION: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  REQUERIMIENTO: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  INFORME_FINAL: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  CIERRE_FISCAL: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  NOTIFICACION: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
};

function getFaseColor(fase: string): string {
  return faseColors[fase] ?? "bg-slate-500/15 text-slate-400 border-slate-500/30";
}

function formatFase(fase: string): string {
  return fase
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export default function CaseSelector({
  cases,
  selectedCaseId,
  onSelect,
  onCreateCase,
}: CaseSelectorProps) {
  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 px-4 rounded-lg border border-dashed border-slate-700/60 bg-slate-800/40">
        <div className="text-3xl">📋</div>
        <p className="text-sm text-slate-400 text-center">
          Este contribuyente no tiene casos fiscales aún.
        </p>
        {onCreateCase && (
          <Button
            type="button"
            onClick={onCreateCase}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md flex items-center gap-2 transition-all duration-200 min-h-[40px] px-4 text-sm"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Crear primer caso
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-800/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60">
        <h3 className="text-sm font-semibold text-slate-200">Casos Fiscales</h3>
        {onCreateCase && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCreateCase}
            className="h-8 gap-1.5 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo Caso
          </Button>
        )}
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-700/40">
        {/* "Todos los casos" row */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors duration-150 ${
            selectedCaseId === null
              ? "bg-indigo-500/10 border-l-2 border-l-indigo-500"
              : "border-l-2 border-l-transparent hover:bg-slate-700/30"
          }`}
        >
          <span
            className={`flex-shrink-0 w-2 h-2 rounded-full ${
              selectedCaseId === null ? "bg-indigo-400" : "bg-slate-600"
            }`}
          />
          <span
            className={`text-sm ${
              selectedCaseId === null
                ? "text-slate-100 font-medium"
                : "text-slate-400"
            }`}
          >
            Todos los casos
          </span>
        </button>

        {/* Case rows */}
        {cases.map((c) => {
          const isSelected = c.id === selectedCaseId;
          const createdDate = new Date(c.created_at).toLocaleDateString(
            "es-VE",
            { day: "2-digit", month: "2-digit", year: "numeric" }
          );

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className={`w-full text-left px-4 py-2.5 transition-colors duration-150 ${
                isSelected
                  ? "bg-indigo-500/10 border-l-2 border-l-indigo-500"
                  : "border-l-2 border-l-transparent hover:bg-slate-700/30"
              }`}
            >
              {/* Desktop layout */}
              <div className="hidden sm:flex items-center gap-3">
                <span
                  className={`flex-shrink-0 w-2 h-2 rounded-full ${
                    isSelected ? "bg-indigo-400" : "bg-slate-600"
                  }`}
                />
                <span
                  className={`text-sm font-medium min-w-0 ${
                    isSelected ? "text-slate-100" : "text-slate-300"
                  }`}
                >
                  {c.year} — {c.process}
                </span>
                <span className="text-xs text-slate-500 shrink-0 hidden md:inline">
                  Creado: {createdDate}
                </span>
                <span className="ml-auto flex items-center gap-2 shrink-0">
                  <span
                    className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${getFaseColor(
                      c.fase
                    )}`}
                  >
                    {formatFase(c.fase)}
                  </span>
                  {c.culminated ? (
                    <span className="inline-flex items-center rounded border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                      CULMINADO
                    </span>
                  ) : c.notified ? (
                    <span className="inline-flex items-center rounded border border-green-500/30 bg-green-500/15 px-1.5 py-0.5 text-[10px] font-medium text-green-400">
                      NOTIFICADO
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded border border-red-500/30 bg-red-500/15 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                      PENDIENTE
                    </span>
                  )}
                </span>
              </div>

              {/* Mobile layout */}
              <div className="flex flex-col gap-1.5 sm:hidden">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex-shrink-0 w-2 h-2 rounded-full ${
                      isSelected ? "bg-indigo-400" : "bg-slate-600"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      isSelected ? "text-slate-100" : "text-slate-300"
                    }`}
                  >
                    {c.year} — {c.process}
                  </span>
                </div>
                <div className="flex items-center gap-2 pl-5">
                  <span
                    className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${getFaseColor(
                      c.fase
                    )}`}
                  >
                    {formatFase(c.fase)}
                  </span>
                  {c.culminated ? (
                    <span className="inline-flex items-center rounded border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                      CULMINADO
                    </span>
                  ) : c.notified ? (
                    <span className="inline-flex items-center rounded border border-green-500/30 bg-green-500/15 px-1.5 py-0.5 text-[10px] font-medium text-green-400">
                      NOTIFICADO
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded border border-red-500/30 bg-red-500/15 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                      PENDIENTE
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500">
                    Creado: {createdDate}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
