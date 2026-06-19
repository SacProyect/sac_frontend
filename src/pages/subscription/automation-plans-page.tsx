import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Sparkles, Bot, Users, FileSpreadsheet, MessageCircle, Loader2, Scale, Star, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/UI/v2/page-header';
import { Button } from '@/components/UI/button';
import { Card } from '@/components/UI/card';
import { useAuth } from '@/hooks/use-auth';
import type { BillingCycle, SubscriptionPlanId } from '@/config/subscription-plans';
import { buildWhatsAppSubscriptionUrl } from '@/config/subscription-plans';
import { getPlanOfferingsForRole, getOfferingPrice, getPlanOffering } from '@/config/subscription-plan-catalog';
import { SUBSCRIPTION_SCOPE_NOTE, SUBSCRIPTION_ROLE_SUMMARY } from '@/config/subscription-policy';
import {
    getRolePlanContext,
    isPaidSubscriptionRole,
    isSubscriptionExempt,
    ROLE_LABELS,
} from '@/config/subscription-role-config';
import { requestSubscription, getMySubscription, AutomationSubscription } from '@/components/utils/api/subscription-functions';

const PLAN_ICONS: Record<SubscriptionPlanId, React.ReactNode> = {
    BASIC: <Users className="h-6 w-6" />,
    PLUS: <FileSpreadsheet className="h-6 w-6" />,
    PREMIUM: <Bot className="h-6 w-6" />,
};

const PLAN_GRADIENTS: Record<SubscriptionPlanId, string> = {
    BASIC: 'from-slate-600/80 to-slate-700/60',
    PLUS: 'from-indigo-600/80 to-indigo-700/60',
    PREMIUM: 'from-violet-600/80 to-indigo-600/60',
};

export default function AutomationPlansPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
    const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlanId | null>(null);
    const [activeSub, setActiveSub] = useState<AutomationSubscription | null>(null);
    const [hoveredPlan, setHoveredPlan] = useState<SubscriptionPlanId | null>(null);

    const roleContext = user ? getRolePlanContext(user.role) : null;
    const offerings = useMemo(
        () => (user ? getPlanOfferingsForRole(user.role) : []),
        [user],
    );

    useEffect(() => {
        if (user && isSubscriptionExempt(user.role)) {
            navigate('/admin', { replace: true });
            return;
        }
        getMySubscription().then(setActiveSub).catch(() => {});
    }, [user, navigate]);

    const handleSelectPlan = async (planId: SubscriptionPlanId) => {
        if (!user) return;
        const offering = getPlanOffering(user.role, planId);
        if (!offering) return;

        setLoadingPlan(planId);
        try {
            const subscription = await requestSubscription(planId, billingCycle);
            const amount = getOfferingPrice(offering, billingCycle);
            const featuresSummary = offering.includes.slice(0, 2).map((s) => s.length > 40 ? s.slice(0, 37) + '...' : s).join(' + ');
            const whatsappUrl = buildWhatsAppSubscriptionUrl({
                planName: offering.name,
                billingCycle,
                amountUsd: amount,
                referenceCode: subscription.referenceCode,
                userName: user.name,
                userRole: ROLE_LABELS[user.role] ?? user.role,
                featuresSummary,
            });

            toast.success('Solicitud creada. Te redirigimos a WhatsApp para coordinar el pago.');
            window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'No se pudo crear la solicitud';
            toast.error(message);
        } finally {
            setLoadingPlan(null);
        }
    };

    if (!user || isSubscriptionExempt(user.role)) return null;

    const roleLabel = ROLE_LABELS[user.role] ?? user.role;
    const roleSummary = isPaidSubscriptionRole(user.role)
        ? SUBSCRIPTION_ROLE_SUMMARY[user.role]
        : null;

    // Empty state for supervisor/coordinator (only 1 plan available)
    const isSinglePlan = offerings.length === 1;

    return (
        <div className="space-y-8 max-w-6xl mx-auto px-1">
            <PageHeader
                title={roleContext?.headline ?? 'Planes de automatización'}
                description={roleContext?.description}
                backTo="/admin"
            />

            {roleSummary && (
                <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/10 px-4 py-3">
                    <p className="text-sm text-indigo-100/90">
                        <span className="font-semibold text-indigo-200">{roleLabel}:</span> {roleSummary}
                    </p>
                </div>
            )}

            {activeSub?.status === 'APPROVED' && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 flex items-center gap-3">
                    <Check className="h-5 w-5 text-emerald-400 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-emerald-300">
                            Plan activo: {getPlanOffering(user.role, activeSub.plan)?.name ?? activeSub.plan}
                        </p>
                        <p className="text-xs text-emerald-200/80">
                            {activeSub.expiresAt
                                ? `Válido hasta ${new Date(activeSub.expiresAt).toLocaleDateString('es-VE')}`
                                : 'Suscripción activa'}
                        </p>
                    </div>
                </div>
            )}

            {activeSub?.status === 'APPROVED' && activeSub.expiresAt && (() => {
                const daysLeft = Math.ceil((new Date(activeSub.expiresAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                if (daysLeft > 7) return null;
                return (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-amber-300">
                                {daysLeft <= 0 ? 'Tu plan ha expirado' : `Tu plan vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`}
                            </p>
                            <p className="text-xs text-amber-200/80 mt-0.5">
                                Contacta al administrador para renovar tu suscripción y no perder acceso a las funciones automatizadas.
                            </p>
                        </div>
                    </div>
                );
            })()}

            {activeSub?.status === 'PENDING' && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                    <p className="text-sm font-semibold text-amber-300">Pago pendiente de verificación</p>
                    <p className="text-xs text-amber-200/80 mt-1">
                        Referencia <span className="font-mono font-bold">{activeSub.referenceCode}</span> — Envía tu comprobante por WhatsApp.
                    </p>
                </div>
            )}

            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 flex items-start gap-3">
                <Scale className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-100/90">{SUBSCRIPTION_SCOPE_NOTE}</p>
            </div>

            <div className="flex justify-center">
                <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1 w-full max-w-xs sm:max-w-none sm:w-auto">
                    <button
                        type="button"
                        onClick={() => setBillingCycle('MONTHLY')}
                        className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                            billingCycle === 'MONTHLY'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Mensual
                    </button>
                    <button
                        type="button"
                        onClick={() => setBillingCycle('ANNUAL')}
                        className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                            billingCycle === 'ANNUAL'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Anual
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">
                            -17%
                        </span>
                    </button>
                </div>
            </div>

            {/* Single plan empty state for supervisor/coordinator */}
            {isSinglePlan ? (
                <div className="max-w-lg mx-auto">
                    <Card
                        className={`relative flex flex-col p-6 transition-all duration-300 border-indigo-500/50 bg-indigo-950/20 shadow-xl shadow-indigo-900/20`}
                    >
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap bg-emerald-600 text-white">
                            Plan disponible
                        </span>

                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg">
                            {PLAN_ICONS.PREMIUM}
                        </div>

                        <h3 className="text-xl font-bold text-foreground">
                            {offerings[0].name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{offerings[0].tagline}</p>
                        <p className="text-xs text-muted-foreground/80 mt-2 leading-relaxed">{offerings[0].description}</p>

                        <div className="mt-4 mb-4">
                            <span className="text-3xl font-bold text-foreground">${getOfferingPrice(offerings[0], billingCycle)}</span>
                            <span className="text-muted-foreground text-sm ml-1">
                                USD / {billingCycle === 'MONTHLY' ? 'mes' : 'año'}
                            </span>
                        </div>

                        <div className="mb-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2">
                                Qué incluye
                            </p>
                            <ul className="space-y-2">
                                {offerings[0].includes.map((item) => (
                                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                                        <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mb-6 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 mb-2">
                                Limitaciones
                            </p>
                            <ul className="space-y-2">
                                {offerings[0].limitations.map((item) => (
                                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground/90">
                                        <X className="h-4 w-4 shrink-0 mt-0.5 text-amber-500/80" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                            <Sparkles className="h-4 w-4 text-violet-400" />
                            <span className="text-xs text-violet-300 font-medium">Asistente IA incluido</span>
                        </div>

                        <Button
                            onClick={() => handleSelectPlan(offerings[0].id)}
                            disabled={loadingPlan !== null || activeSub?.status === 'APPROVED'}
                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
                        >
                            {loadingPlan ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Pagar por WhatsApp
                                </>
                            )}
                        </Button>
                    </Card>
                </div>
            ) : (
                <div
                    className={`grid gap-6 ${
                        offerings.length === 2
                            ? 'grid-cols-1 lg:grid-cols-2 max-w-4xl mx-auto'
                            : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 max-w-6xl mx-auto'
                    }`}
                >
                    {offerings.map((offering) => {
                        const price = getOfferingPrice(offering, billingCycle);
                        const isLoading = loadingPlan === offering.id;
                        const isRecommended = roleContext?.recommendedPlan === offering.id;
                        const isHighlighted = isRecommended || offering.highlight;
                        const isHovered = hoveredPlan === offering.id;

                        return (
                            <Card
                                key={`${user.role}-${offering.id}`}
                                onMouseEnter={() => setHoveredPlan(offering.id)}
                                onMouseLeave={() => setHoveredPlan(null)}
                                className={`relative flex flex-col p-6 transition-all duration-300 ${
                                    isHighlighted
                                        ? 'border-indigo-500/50 bg-indigo-950/20 shadow-xl shadow-indigo-900/20'
                                        : 'border-border bg-card/50 hover:border-indigo-500/30'
                                } ${isHovered ? 'scale-[1.02] shadow-2xl' : ''}`}
                            >
                                {(isRecommended || offering.badge) && (
                                    <span
                                        className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap ${
                                            isRecommended ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                                        }`}
                                    >
                                        {isRecommended ? (
                                            <span className="flex items-center gap-1">
                                                <Star className="h-3 w-3" />
                                                Recomendado para ti
                                            </span>
                                        ) : (
                                            offering.badge
                                        )}
                                    </span>
                                )}

                                <div
                                    className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ${
                                        offering.id === 'PREMIUM'
                                            ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/30'
                                            : isHighlighted
                                                ? 'bg-indigo-600/20 text-indigo-400'
                                                : 'bg-muted text-muted-foreground'
                                    } ${isHovered ? 'scale-110' : ''}`}
                                >
                                    {PLAN_ICONS[offering.id]}
                                </div>

                                <h3 className="text-xl font-bold text-foreground">{offering.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{offering.tagline}</p>
                                <p className="text-xs text-muted-foreground/80 mt-2 leading-relaxed">{offering.description}</p>

                                <div className="mt-4 mb-4">
                                    <span className="text-3xl font-bold text-foreground">${price}</span>
                                    <span className="text-muted-foreground text-sm ml-1">
                                        USD / {billingCycle === 'MONTHLY' ? 'mes' : 'año'}
                                    </span>
                                </div>

                                <div className="mb-4">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2">
                                        Qué incluye
                                    </p>
                                    <ul className="space-y-2">
                                        {offering.includes.map((item) => (
                                            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="mb-6 flex-1">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 mb-2">
                                        Limitaciones
                                    </p>
                                    <ul className="space-y-2">
                                        {offering.limitations.map((item) => (
                                            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground/90">
                                                <X className="h-4 w-4 shrink-0 mt-0.5 text-amber-500/80" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {offering.id === 'PREMIUM' && (
                                    <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                                        <Sparkles className="h-4 w-4 text-violet-400" />
                                        <span className="text-xs text-violet-300 font-medium">Asistente IA incluido</span>
                                    </div>
                                )}

                                <Button
                                    onClick={() => handleSelectPlan(offering.id)}
                                    disabled={isLoading || activeSub?.status === 'APPROVED'}
                                    className={`w-full transition-all duration-300 ${
                                        offering.id === 'PREMIUM'
                                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500'
                                            : isHighlighted
                                                ? 'bg-indigo-600 hover:bg-indigo-500'
                                                : ''
                                    }`}
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <MessageCircle className="h-4 w-4 mr-2" />
                                            Pagar por WhatsApp
                                        </>
                                    )}
                                </Button>
                            </Card>
                        );
                    })}
                </div>
            )}

            <p className="text-center text-xs text-muted-foreground pb-4">
                Después de pagar, tu solicitud queda pendiente hasta que el administrador la apruebe.
                {' '}
                <button type="button" onClick={() => navigate('/admin')} className="text-indigo-400 hover:underline">
                    Volver al dashboard
                </button>
            </p>
        </div>
    );
}