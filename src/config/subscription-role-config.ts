import type { SubscriptionPlanId } from '@/config/subscription-plans';
import { getPlanOfferingsForRole } from '@/config/subscription-plan-catalog';

export type { PaidSubscriptionRole } from '@/config/subscription-plan-catalog';
export { isPaidSubscriptionRole } from '@/config/subscription-plan-catalog';
import { isPaidSubscriptionRole, type PaidSubscriptionRole } from '@/config/subscription-plan-catalog';

export const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Administrador',
    COORDINATOR: 'Coordinador',
    SUPERVISOR: 'Supervisor',
    FISCAL: 'Fiscal',
};

export function isSubscriptionExempt(role: string | undefined): boolean {
    return role === 'ADMIN';
}

export interface RolePlanContext {
    headline: string;
    description: string;
    recommendedPlan: SubscriptionPlanId;
    bannerTitle: string;
    bannerSubtitle: string;
}

const ROLE_PLAN_CONTEXT: Record<PaidSubscriptionRole, RolePlanContext> = {
    FISCAL: {
        headline: 'Planes para fiscales de campo',
        description:
            'Elige según lo que automatizas: Fiscal Pro solo contribuyentes ($12), Fiscal Plus añade IVA ($22), Fiscal IA incluye asistente inteligente ($38).',
        recommendedPlan: 'PLUS',
        bannerTitle: 'Automatiza contribuyentes desde $12/mes',
        bannerSubtitle: 'Fiscal Pro · Plus con IVA · IA para consultas en campo',
    },
    SUPERVISOR: {
        headline: 'Fiscal IA para supervisión',
        description:
            'No cargas contribuyentes ni IVA: verificas, pides reportes y supervisas. El asistente IA te ayuda a analizar y decidir más rápido.',
        recommendedPlan: 'PREMIUM',
        bannerTitle: 'Supervisa con asistente IA',
        bannerSubtitle: 'Verificación y reportes del equipo · $38/mes',
    },
    COORDINATOR: {
        headline: 'Fiscal IA para coordinación',
        description:
            'Coordina equipos completos sin cargar datos en campo. La IA apoya verificación, seguimiento de reportes y redacción institucional.',
        recommendedPlan: 'PREMIUM',
        bannerTitle: 'Coordina con inteligencia artificial',
        bannerSubtitle: 'Análisis y reportes de coordinación · $38/mes',
    },
};

export function getRolePlanContext(role: string | undefined): RolePlanContext | null {
    if (!isPaidSubscriptionRole(role)) return null;
    return ROLE_PLAN_CONTEXT[role];
}

export function isDevPaidRoleSimulation(devRoleOverride: string | null | undefined): boolean {
    return import.meta.env.DEV && isPaidSubscriptionRole(devRoleOverride ?? undefined);
}

export function getVisiblePlanIds(role: string | undefined): SubscriptionPlanId[] {
    return getPlanOfferingsForRole(role).map((p) => p.id);
}
