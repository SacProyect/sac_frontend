import { isSubscriptionDevMock, devResetSubscriptions, isDevSubscriptionSandbox } from '@/dev/subscription-dev-mock';
import { Button } from '@/components/UI/button';
import { FlaskConical, Info, RefreshCw } from 'lucide-react';

/**
 * DevTool indicator for subscription sandbox mode.
 * Shows when VITE_DEV_MOCK_SUBSCRIPTION=true OR when dev role override is FISCAL/SUPERVISOR/COORDINATOR.
 *
 * Testing flow:
 * 1. Use DevTool (bottom-right) → switch to FISCAL role
 * 2. Go to /automatizacion/planes → select a plan → request
 * 3. Use DevTool → switch back to ADMIN
 * 4. Go to /aprobaciones-suscripcion → approve the request
 * 5. Use DevTool → switch to FISCAL again → verify features are unlocked
 */
export function DevSubscriptionBanner() {
    if (!isSubscriptionDevMock) return null;

    const isSandbox = isDevSubscriptionSandbox();

    return (
        <div className="mb-4 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 to-indigo-950/30 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 ring-1 ring-cyan-500/25">
                    <FlaskConical className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-xs sm:text-sm font-semibold text-cyan-200">
                            Modo demo de suscripciones
                        </p>
                        {isSandbox && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                                Sandbox activo
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-cyan-300/70 mt-0.5 leading-relaxed">
                        {isSandbox
                            ? 'Suscripciones simuladas en localStorage. Sin backend ni pago real.'
                            : 'Suscripciones reales del backend (dev). Sin mock activo.'}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1.5 text-[11px] text-cyan-300/80">
                    <Info className="h-3 w-3 shrink-0" />
                    <span>Probar: FISCAL → planes → ADMIN → aprobar</span>
                </div>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-cyan-500/40 text-cyan-200 hover:bg-cyan-500/10 h-8 text-xs"
                    onClick={() => {
                        devResetSubscriptions();
                        window.dispatchEvent(new Event('sac-subscription-changed'));
                        window.location.reload();
                    }}
                >
                    <RefreshCw className="h-3 w-3 mr-1.5" />
                    Reiniciar demo
                </Button>
            </div>
        </div>
    );
}
