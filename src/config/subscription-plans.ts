export type SubscriptionPlanId = 'BASIC' | 'PLUS' | 'PREMIUM';
export type BillingCycle = 'MONTHLY' | 'ANNUAL';

/** Precios base por tier (catálogo por rol en subscription-plan-catalog.ts) */
export const PLAN_PRICES: Record<SubscriptionPlanId, { monthlyUsd: number; annualUsd: number }> = {
    BASIC: { monthlyUsd: 12, annualUsd: 120 },
    PLUS: { monthlyUsd: 22, annualUsd: 220 },
    PREMIUM: { monthlyUsd: 38, annualUsd: 380 },
};

export function getPlanPrice(
    plan: { monthlyUsd: number; annualUsd: number },
    cycle: BillingCycle,
): number {
    return cycle === 'MONTHLY' ? plan.monthlyUsd : plan.annualUsd;
}

export function getPlanPriceById(id: SubscriptionPlanId, cycle: BillingCycle): number {
    return getPlanPrice(PLAN_PRICES[id], cycle);
}

export const WHATSAPP_SUBSCRIPTION_NUMBER =
    import.meta.env.VITE_WHATSAPP_SUBSCRIPTION_NUMBER || '584121234567';

export function buildWhatsAppSubscriptionUrl(params: {
    planName: string;
    billingCycle: BillingCycle;
    amountUsd: number;
    referenceCode: string;
    userName: string;
    userRole: string;
    featuresSummary?: string;
}): string {
    const cycleLabel = params.billingCycle === 'MONTHLY' ? 'Mensual' : 'Anual';
    const message = [
        'Hola, quiero activar mi plan de automatización SAC:',
        '',
        `📋 Plan: ${params.planName} (${cycleLabel})${params.featuresSummary ? ` — ${params.featuresSummary}` : ''}`,
        `💰 Monto: $${params.amountUsd} USD`,
        `🔖 Referencia: ${params.referenceCode}`,
        `👤 Usuario: ${params.userName} (${params.userRole})`,
        '',
        'Adjunto comprobante de pago. Gracias.',
    ].join('\n');

    return `https://wa.me/${WHATSAPP_SUBSCRIPTION_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** Nombre legible del tier (para aprobaciones / historial) */
export function getPlanDisplayName(id: SubscriptionPlanId): string {
    const names: Record<SubscriptionPlanId, string> = {
        BASIC: 'Fiscal Pro',
        PLUS: 'Fiscal Plus',
        PREMIUM: 'Fiscal IA',
    };
    return names[id];
}

/** @deprecated Usar getPlanOffering */
export function getPlanById(id: SubscriptionPlanId) {
    const prices = PLAN_PRICES[id];
    if (!prices) return undefined;
    return { id, name: getPlanDisplayName(id), ...prices };
}
