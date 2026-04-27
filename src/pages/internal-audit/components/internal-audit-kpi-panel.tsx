import { Card } from "@/components/UI/card";
import { Users, Activity, FileStack, AlertTriangle, ClipboardList, FileWarning, Receipt } from "lucide-react";
import type { InternalAuditDashboard } from "@/types/internal-audit";

const SPOTLIGHT = "ring-2 ring-blue-400/90 shadow-xl shadow-blue-500/25 z-[1] scale-[1.01]";

type Props = {
  data: InternalAuditDashboard;
  tvSpotlightIndex?: number;
};

export function InternalAuditKpiPanel({ data, tvSpotlightIndex }: Props) {
  const h = data.window.shortWindowHours;
  const cy = data.carteraYear;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card
          className={`bg-slate-800/90 border-slate-700 p-5 transition-all ${
            tvSpotlightIndex === 0 ? SPOTLIGHT : ""
          }`}
        >
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wide">
            <Users className="h-4 w-4" />
            Casos en cartera ({cy})
          </div>
          <p className="text-3xl font-bold text-white mt-2">{data.totals.taxpayerAssignmentsTotal}</p>
          <p className="text-slate-500 text-xs mt-1">
            Contribuyentes en cartera del año {cy} (reglas iguales que estadísticas del fiscal)
          </p>
        </Card>
        <Card
          className={`bg-slate-800/90 border-slate-700 p-5 transition-all ${
            tvSpotlightIndex === 1 ? SPOTLIGHT : ""
          }`}
        >
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wide">
            <Activity className="h-4 w-4" />
            Ventana corta ({h} h)
          </div>
          <p className="text-3xl font-bold text-emerald-400 mt-2">{data.totals.auditsShortWindow}</p>
          <p className="text-slate-500 text-xs mt-1">Eventos en tabla auditoría · últimas {h} h (respecto a ahora)</p>
        </Card>
        <Card
          className={`bg-slate-800/90 border-slate-700 p-5 transition-all ${
            tvSpotlightIndex === 2 ? SPOTLIGHT : ""
          }`}
        >
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wide">
            <FileStack className="h-4 w-4" />
            Rango de fechas (auditoría)
          </div>
          <p className="text-3xl font-bold text-sky-400 mt-2">{data.totals.auditsInWindow}</p>
          <p className="text-slate-500 text-xs mt-1">Eventos entre &quot;Desde&quot; y &quot;Hasta&quot; del panel</p>
        </Card>
        <Card
          className={`bg-slate-800/90 border-slate-700 p-5 transition-all ${
            tvSpotlightIndex === 3 ? SPOTLIGHT : ""
          }`}
        >
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wide">
            <AlertTriangle className="h-4 w-4 text-amber-500/90" />
            Con actividad en auditoría
          </div>
          <p className="text-3xl font-bold text-amber-300 mt-2">
            {data.totals.activeFiscalsInWindow}
            <span className="text-slate-500 text-lg font-normal"> / {data.totals.fiscalHeadcount}</span>
          </p>
          <p className="text-slate-500 text-xs mt-1">Al menos un evento en el rango de fechas elegido</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900/70 border-slate-700 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wide">
            <ClipboardList className="h-4 w-4 text-orange-400/90" />
            Casos pendientes ({cy})
          </div>
          <p className="text-2xl font-bold text-orange-300 mt-2">{data.totals.carteraCasosPendientesTotal}</p>
          <p className="text-slate-500 text-xs mt-1">Procesos sin culminar en la cartera del año</p>
        </Card>
        <Card className="bg-slate-900/70 border-slate-700 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wide">
            <FileWarning className="h-4 w-4 text-rose-400/90" />
            Sin declaración IVA ({cy})
          </div>
          <p className="text-2xl font-bold text-rose-300 mt-2">{data.totals.carteraSinIvaTotal}</p>
          <p className="text-slate-500 text-xs mt-1">Contribuyentes en cartera sin registro IVA en el año</p>
        </Card>
        <Card className="bg-slate-900/70 border-slate-700 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wide">
            <Receipt className="h-4 w-4 text-violet-400/90" />
            Sin declaración ISLR ({cy})
          </div>
          <p className="text-2xl font-bold text-violet-300 mt-2">{data.totals.carteraSinIslrTotal}</p>
          <p className="text-slate-500 text-xs mt-1">Contribuyentes en cartera sin registro ISLR en el año</p>
        </Card>
      </div>
    </div>
  );
}
