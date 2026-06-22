import { useLocation, useOutlet } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import {
  canAccessAppDuringMaintenance,
  isMaintenanceModeEnabled,
} from "@/config/feature-flags";
import { MaintenancePage } from "@/components/maintenance/maintenance-page";

/**
 * Bloquea toda la app cuando el modo mantenimiento está activo.
 * Solo los usuarios ADMIN pueden continuar; el resto ve la página de mantenimiento.
 * La ruta /login permanece accesible para que los administradores puedan autenticarse.
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

  if (location.pathname === "/login") {
    return outlet;
  }

  return <MaintenancePage />;
}
