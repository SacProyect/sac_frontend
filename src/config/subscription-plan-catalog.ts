import type { BillingCycle, SubscriptionPlanId } from './subscription-plans';
import { getPlanPrice as baseGetPlanPrice } from './subscription-plans';

export type PaidSubscriptionRole = 'FISCAL' | 'SUPERVISOR' | 'COORDINATOR';

export function isPaidSubscriptionRole(role: string | undefined): role is PaidSubscriptionRole {
    return role === 'FISCAL' || role === 'SUPERVISOR' || role === 'COORDINATOR';
}

export interface PlanOffering {
    id: SubscriptionPlanId;
    name: string;
    tagline: string;
    description: string;
    monthlyUsd: number;
    annualUsd: number;
    highlight?: boolean;
    badge?: string;
    includes: string[];
    limitations: string[];
}

const PRICES = {
    BASIC: { monthlyUsd: 12, annualUsd: 120 },
    PLUS: { monthlyUsd: 22, annualUsd: 220 },
    PREMIUM: { monthlyUsd: 38, annualUsd: 380 },
} as const;

const MULTAS_LIMITATION =
    'Multas: siempre registro manual del fiscal (no automatizadas en ningún plan)';

export const ALLOWED_PLANS_BY_ROLE: Record<PaidSubscriptionRole, SubscriptionPlanId[]> = {
    FISCAL: ['BASIC', 'PLUS', 'PREMIUM'],
    SUPERVISOR: ['PREMIUM'],
    COORDINATOR: ['PREMIUM'],
};

const FISCAL_OFFERINGS: PlanOffering[] = [
    {
        id: 'BASIC',
        name: 'Fiscal Pro',
        tagline: 'Solo automatiza contribuyentes',
        description:
            'Para el fiscal que quiere dejar de cargar contribuyentes a mano, sin necesitar IVA masivo ni IA todavía.',
        ...PRICES.BASIC,
        includes: [
            'Importación masiva de contribuyentes (CSV/Excel)',
            'Validación automática de RIF y providencias',
            'Plantillas de carga reutilizables',
            'Soporte por WhatsApp en horario laboral',
        ],
        limitations: [
            'Sin carga automática de reportes IVA',
            'Sin asistente de IA',
            MULTAS_LIMITATION,
        ],
    },
    {
        id: 'PLUS',
        name: 'Fiscal Plus',
        tagline: 'Contribuyentes + IVA automatizado',
        description:
            'El plan más equilibrado para fiscales de campo: importación masiva y reportes IVA sin trabajo manual repetitivo.',
        ...PRICES.PLUS,
        highlight: true,
        badge: 'Más popular',
        includes: [
            'Todo lo incluido en Fiscal Pro',
            'Carga automática de reportes IVA',
            'Alertas de vencimiento y recordatorios',
            'Soporte prioritario por WhatsApp',
        ],
        limitations: [
            'Sin asistente de IA',
            'Sin análisis inteligente ni redacción asistida',
            MULTAS_LIMITATION,
        ],
    },
    {
        id: 'PREMIUM',
        name: 'Fiscal IA',
        tagline: 'Plus + asistente inteligente en campo',
        description:
            'Para el fiscal que quiere automatizar carga y además consultar, redactar y analizar casos al instante.',
        ...PRICES.PREMIUM,
        badge: 'IA incluida',
        includes: [
            'Todo lo incluido en Fiscal Plus',
            'Asistente IA para consultas tributarias al instante',
            'Redacción asistida de providencias y actas',
            'Análisis de patrones en contribuyentes de tu cartera',
            'Soporte VIP · activación en menos de 24 h',
        ],
        limitations: [
            MULTAS_LIMITATION,
            'La IA orienta y redacta; el registro oficial lo confirma el fiscal',
        ],
    },
];

const LEADERSHIP_OFFERING: PlanOffering = {
    id: 'PREMIUM',
    name: 'Fiscal IA',
    tagline: 'Supervisión y coordinación con inteligencia artificial',
    description:
        'Para supervisores y coordinadores que verifican el trabajo del equipo, piden reportes y toman decisiones — sin cargar contribuyentes ni IVA.',
    ...PRICES.PREMIUM,
    badge: 'Para supervisión',
    includes: [
        'Asistente IA para verificar reportes y avances del equipo',
        'Consultas sobre IVA, ISLR, providencias y procedimientos',
        'Redacción asistida de informes, actas y comunicaciones',
        'Análisis de casos y seguimiento de indicadores del grupo',
        'Soporte VIP · activación en menos de 24 h',
    ],
    limitations: [
        'No incluye importación masiva de contribuyentes (la hace el fiscal)',
        'No incluye carga automática de IVA (la hace el fiscal en campo)',
        MULTAS_LIMITATION,
        'La IA no sustituye la revisión humana ni el registro oficial',
    ],
};

export function getAllowedPlansForRole(role: string | undefined): SubscriptionPlanId[] {
    if (!isPaidSubscriptionRole(role)) return [];
    return ALLOWED_PLANS_BY_ROLE[role];
}

export function isPlanAllowedForRole(plan: SubscriptionPlanId, role: string | undefined): boolean {
    return getAllowedPlansForRole(role).includes(plan);
}

export function getPlanOfferingsForRole(role: string | undefined): PlanOffering[] {
    if (role === 'FISCAL') return FISCAL_OFFERINGS;
    if (role === 'SUPERVISOR' || role === 'COORDINATOR') return [LEADERSHIP_OFFERING];
    return [];
}

export function getPlanOffering(role: string | undefined, planId: SubscriptionPlanId): PlanOffering | undefined {
    return getPlanOfferingsForRole(role).find((p) => p.id === planId);
}

export function getOfferingPrice(offering: PlanOffering, cycle: BillingCycle): number {
    return baseGetPlanPrice(offering, cycle);
}
