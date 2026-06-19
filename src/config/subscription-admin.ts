/**
 * Usuario(s) autorizados para aprobar pagos de suscripción.
 * Solo Gabriel Longa por defecto — configurar IDs en env para producción.
 */
const ADMIN_IDS_RAW = import.meta.env.VITE_SUBSCRIPTION_ADMIN_USER_ID ?? '';

const SUBSCRIPTION_ADMIN_IDS = new Set<string>(
    ADMIN_IDS_RAW.split(',').map((id: string) => id.trim()).filter(Boolean),
);

/** Cédula de Gabriel Longa — fallback para desarrollo local y entornos donde el UUID no coincide. */
const SUBSCRIPTION_ADMIN_PERSON_IDS = new Set(['28338232']);

export function isSubscriptionAdmin(
    user: { id: string; role: string; personId?: string } | null | undefined,
    devRoleOverride?: string | null,
): boolean {
    if (!user) return false;

    if (import.meta.env.DEV && devRoleOverride && devRoleOverride !== 'ADMIN') {
        return false;
    }

    if (SUBSCRIPTION_ADMIN_IDS.size > 0 && SUBSCRIPTION_ADMIN_IDS.has(user.id)) {
        return true;
    }

    if (user.personId && SUBSCRIPTION_ADMIN_PERSON_IDS.has(String(user.personId))) {
        return true;
    }

    return false;
}
