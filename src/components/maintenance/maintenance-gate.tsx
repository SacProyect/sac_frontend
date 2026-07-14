import { useLocation, useOutlet } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import {
  canAccessAppDuringMaintenance,
  isMaintenanceModeEnabled,
} from "@/config/feature-flags";
import { MaintenancePage } from "@/components/maintenance/maintenance-page";

/**
 * Bloquea la app cuando el modo mantenimiento está activo.
 * Permite landing pública (/) y /login para que cualquiera llegue a la puerta de entrada.
 */
export function MaintenanceGate() {
  const outlet = useOutlet();
  const location = useLocation();
  const { user } = useAuth();

  if (!isMaintenanceModeEnabled) {
    return outlet;
  }

  if (canAccessAppDuringMaintenance(user)) {
    return outlet;
  }

  const publicPaths = ["/", "/login"];
  if (publicPaths.includes(location.pathname)) {
    return outlet;
  }

  return <MaintenancePage />;
}
