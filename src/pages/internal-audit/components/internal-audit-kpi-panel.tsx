import { Card } from "@/components/UI/card";
import { Users, Activity, FileStack, AlertTriangle } from "lucide-react";
import type { InternalAuditDashboard } from "@/types/internal-audit";

const SPOTLIGHT = "ring-2 ring-blue-400/90 shadow-xl shadow-blue-500/25 z-[1] scale-[1.01]";

type Props = {
  data: InternalAuditDashboard;
  tvSpotlightIndex?: number;
};

export function InternalAuditKpiPanel({ data, tvSpotlightIndex }: Props) {
  const h = data.window.shortWindowHours;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <Card
        className={`bg-slate-800/90 border-slate-700 p-5 transition-all ${
          tvSpotlightIndex === 0 ? SPOTLIGHT : ""
        }`}
      >
        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wide">
          <Users className="h-4 w-4" />
          Cartera cubierta
        </div>
        <p className="text-3xl font-bold text-white mt-2">{data.totals.taxpayerAssignmentsTotal}</p>
        <p className="text-slate-500 text-xs mt-1">Contribuyentes activos asignados a fiscales en alcance</p>
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
        <p className="text-slate-500 text-xs mt-1">Eventos de auditoría en las últimas {h} horas (móvil respecto a ahora)</p>
      </Card>
      <Card
        className={`bg-slate-800/90 border-slate-700 p-5 transition-all ${
          tvSpotlightIndex === 2 ? SPOTLIGHT : ""
        }`}
      >
        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wide">
          <FileStack className="h-4 w-4" />
          Rango seleccionado
        </div>
        <p className="text-3xl font-bold text-sky-400 mt-2">{data.totals.auditsInWindow}</p>
        <p className="text-slate-500 text-xs mt-1">Eventos de auditoría entre inicio y fin de la ventana</p>
      </Card>
      <Card
        className={`bg-slate-800/90 border-slate-700 p-5 transition-all ${
          tvSpotlightIndex === 3 ? SPOTLIGHT : ""
        }`}
      >
        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wide">
          <AlertTriangle className="h-4 w-4 text-amber-500/90" />
          Fiscales con actividad
        </div>
        <p className="text-3xl font-bold text-amber-300 mt-2">
          {data.totals.activeFiscalsInWindow}
          <span className="text-slate-500 text-lg font-normal"> / {data.totals.fiscalHeadcount}</span>
        </p>
        <p className="text-slate-500 text-xs mt-1">Con al menos un evento de auditoría en el rango</p>
      </Card>
    </div>
  );
}
