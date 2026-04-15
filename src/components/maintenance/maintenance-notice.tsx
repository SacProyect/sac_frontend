import { AlertTriangle, Wrench } from "lucide-react";
import { Button } from "@/components/UI/button";
import { useNotifications } from "@/hooks/use-notifications";

export function MaintenanceNotice() {
  const {
    maintenanceAlert,
    maintenanceStart,
    clearMaintenanceAlert,
    clearMaintenanceStart,
  } = useNotifications();

  if (maintenanceStart) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/95 px-4">
        <div className="w-full max-w-xl rounded-xl border border-amber-500/30 bg-slate-900 p-6 text-slate-100 shadow-xl">
          <div className="mb-3 flex items-center gap-3">
            <Wrench className="h-6 w-6 text-amber-400" />
            <h2 className="text-lg font-semibold">
              {maintenanceStart.title ?? "Mantenimiento en curso"}
            </h2>
          </div>
          <p className="text-sm text-slate-300">
            {maintenanceStart.message || "El sistema está temporalmente en mantenimiento."}
          </p>
          <div className="mt-4">
            <Button
              type="button"
              onClick={clearMaintenanceStart}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              Entendido
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!maintenanceAlert) {
    return null;
  }

  return (
    <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-100">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-300" />
          <div>
            <p className="text-sm font-semibold">
              {maintenanceAlert.title ?? "Mantenimiento programado"}
            </p>
            <p className="text-xs text-amber-200">{maintenanceAlert.message}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={clearMaintenanceAlert}
          className="border-amber-500/40 bg-transparent text-amber-100 hover:bg-amber-500/20"
        >
          Cerrar
        </Button>
      </div>
    </div>
  );
}
