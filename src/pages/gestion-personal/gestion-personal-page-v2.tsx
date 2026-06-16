import { useAuth } from "@/hooks/use-auth";
import { isActasExpedientesEnabled } from "@/config/feature-flags";
import { PersonalFiscalPanel } from "@/components/gestion-personal/personal-fiscal-panel";
import { DeprecationBanner } from "@/components/gestion-actas/shared/DeprecationBanner";
import { BackButton } from "@/components/UI/v2";

/**
 * Módulo «Gestión de personal»: solo muestra el panel de personal fiscal.
 * Las secciones de Casos por Fiscal, Permisos/Vacaciones y Actas de Reparo
 * fueron migradas a /gestion-actas (TASK-006).
 */
export default function GestionPersonalPageV2() {
    const { user } = useAuth();
    const isAdmin = user?.role === "ADMIN";
    const showDeprecationBanner = isAdmin && isActasExpedientesEnabled;

    return (
        <div className="space-y-5 max-w-[1680px] mx-auto pb-8">
            <BackButton to="/admin" hideLabelOnMobile className="mb-2" />
            {showDeprecationBanner && (
                <DeprecationBanner
                    title="Nueva página disponible: Centro de Mando de Actas y Expedientes"
                    description="Hemos mejorado la página con un Command Center renovado. Las secciones de Actas y Expedientes ahora están en su propia página dedicada."
                    linkTo="/gestion-actas"
                    linkLabel="Ir a la nueva página"
                    dismissableSession
                />
            )}
            <header className="space-y-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                    SAC Fiscal · Operaciones de Campo
                </p>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Gestión de Personal</h1>
                <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                    Panel de personal fiscal con métricas y estado del equipo.
                </p>
            </header>

            <section>
                <PersonalFiscalPanel />
            </section>
        </div>
    );
}
