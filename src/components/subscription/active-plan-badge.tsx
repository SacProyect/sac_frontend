import { useSubscriptionFeatures } from '@/hooks/use-subscription-features';
import { getPlanDisplayName } from '@/config/subscription-plans';
import { isSubscriptionExempt } from '@/config/subscription-role-config';
import { useAuth } from '@/hooks/use-auth';
import { Check, Sparkles, Star } from 'lucide-react';

export function ActivePlanBadge() {
    const { user } = useAuth();
    const { active, plan, status, expiresAt, loading } = useSubscriptionFeatures();

    if (!user || isSubscriptionExempt(user.role) || loading) return null;

    if (!active || !plan) {
        // No active plan - show nothing (CTA banner handles prompting)
        return null;
    }

    const isPending = status === 'PENDING';
    const isApproved = status === 'APPROVED';

    return (
        <div className="px-3 py-2 rounded-xl border bg-gradient-to-r from-emerald-950/40 to-indigo-950/30 border-emerald-500/20">
            <div className="flex items-center gap-2">
                {isPending && (
                    <>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
                            <Star className="h-3.5 w-3.5 text-amber-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">Pago pendiente</p>
                            <p className="text-xs font-medium text-amber-200 truncate">
                                {getPlanDisplayName(plan)} · Esperando aprobación
                            </p>
                        </div>
                    </>
                )}
                {isApproved && (
                    <>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">Plan activo</p>
                            <p className="text-xs font-medium text-emerald-200 truncate">
                                {getPlanDisplayName(plan)}
                                {expiresAt && (
                                    <span className="text-emerald-300/60"> · Vence {new Date(expiresAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}</span>
                                )}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}