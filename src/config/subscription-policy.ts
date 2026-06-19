/**
 * Módulos que NUNCA entran en los planes de automatización.
 */
export const SUBSCRIPTION_MANUAL_ONLY_MODULES = [
    {
        id: 'multas',
        label: 'Multas',
        reason: 'Por control y responsabilidad del acto fiscal, cada multa debe registrarse manualmente.',
    },
] as const;

export const SUBSCRIPTION_SCOPE_NOTE =
    'Los fiscales eligen Fiscal Pro (contribuyentes), Plus (+IVA) o Fiscal IA. Supervisores y coordinadores solo Fiscal IA. Las multas nunca se automatizan.';

export const SUBSCRIPTION_ROLE_SUMMARY = {
    FISCAL: 'Carga en campo → Fiscal Pro ($12), Plus con IVA ($22) o Fiscal IA ($38)',
    SUPERVISOR: 'Supervisión y reportes → solo Fiscal IA',
    COORDINATOR: 'Coordinación y seguimiento → solo Fiscal IA',
    ADMIN: 'Acceso completo sin costo',
} as const;
