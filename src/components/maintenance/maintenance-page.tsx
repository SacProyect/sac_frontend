import { Link } from "react-router-dom";
import { Clock, Landmark, Wrench } from "lucide-react";
import { Button } from "@/components/UI/button";
import {
  getMaintenanceMessage,
  getMaintenanceTitle,
  isMaintenanceModeEnabled,
} from "@/config/feature-flags";

export function MaintenancePage() {
  const title = getMaintenanceTitle();
  const message = getMaintenanceMessage();

  return (
    <div className="min-h-screen bg-slate-950 text-foreground flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 flex-col items-center justify-center p-12">
        <div className="text-center max-w-md">
          <div className="mb-8 flex justify-center">
            <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Landmark className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">S.A.C Fiscal</h1>
          <p className="text-blue-200 text-lg">
            Estamos realizando mejoras para ofrecerte un mejor servicio.
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-slate-950">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/25">
            <Wrench className="h-8 w-8 text-blue-400" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Clock className="h-4 w-4 text-blue-400" />
            <span>Vuelve a intentarlo en unos minutos</span>
          </div>

          {isMaintenanceModeEnabled && (
            <div className="pt-2 border-t border-slate-800">
              <p className="text-xs text-slate-500 mb-3">
                ¿Eres administrador del sistema?
              </p>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                <Link to="/login">Acceso administrativo</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
