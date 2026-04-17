import { NavItem } from '@/types/nav';
import { User } from '@/types/user';
import { sharedRoutes, routeBlocks, settingsRoute, RESTRICTED_ROUTES, RESTRICTED_USER_IDS, auditTrailNavItem } from '@/config/nav-routes';
import { isNotificationsFeatureEnabled } from '@/config/feature-flags';

/**
 * Contrato que debe cumplir cada estrategia de navegación.
 * Cada rol implementa este tipo.
 */
type NavStrategy = (user: User) => NavItem[];

// ─── Estrategias por rol ──────────────────────────────────────────────────────

/**
 * ADMIN: Acceso completo a todas las rutas, incluyendo índice IVA y contribuciones.
 */
const adminStrategy: NavStrategy = () => [
    ...sharedRoutes,
    auditTrailNavItem,
    ...routeBlocks.ivaIslr,
    ...routeBlocks.indexIva,
    ...routeBlocks.contributions,
];

/**
 * COORDINATOR: Igual que ADMIN en términos de acceso a rutas.
 */
const coordinatorStrategy: NavStrategy = () => [
    ...sharedRoutes,
    auditTrailNavItem,
    ...routeBlocks.ivaIslr,
    ...routeBlocks.indexIva,
    ...routeBlocks.contributions,
];

/**
 * SUPERVISOR: Acceso a IVA/ISLR, contribuciones, y estadísticas personales.
 */
const supervisorStrategy: NavStrategy = (user) => [
    ...sharedRoutes,
    ...routeBlocks.fiscalStats(user.id),
    auditTrailNavItem,
    ...routeBlocks.ivaIslr,
    ...routeBlocks.contributions,
];

/**
 * FISCAL: Acceso a IVA/ISLR y estadísticas personales. Sin contribuciones.
 */
const fiscalStrategy: NavStrategy = (user) => [
    ...sharedRoutes.filter((item) => item.href !== '/stats' && item.href !== '/fiscal-review'),
    {
        href: `/stats/fiscal/${user.id}`,
        label: 'Revisión Fiscal',
        icon: routeBlocks.fiscalStats(user.id)[0].icon,
    },
    ...routeBlocks.ivaIslr,
];

// ─── Mapa de estrategias ──────────────────────────────────────────────────────

/**
 * Mapea cada rol a su estrategia de navegación correspondiente.
 * Para agregar un nuevo rol: añadir una entrada aquí y su estrategia arriba.
 */
const NAV_STRATEGIES: Record<string, NavStrategy> = {
    ADMIN:       adminStrategy,
    COORDINATOR: coordinatorStrategy,
    SUPERVISOR:  supervisorStrategy,
    FISCAL:      fiscalStrategy,
};

// ─── Función de post-procesamiento ───────────────────────────────────────────

/**
 * Aplica restricciones especiales según el ID del usuario.
 * Separado de las estrategias de rol para mantener Single Responsibility.
 */
const applyUserRestrictions = (items: NavItem[], userId: string): NavItem[] => {
    if (!RESTRICTED_USER_IDS.has(userId)) return items;
    return items.filter((item) => !RESTRICTED_ROUTES.has(item.href));
};

const applyFeatureFlags = (items: NavItem[]): NavItem[] => {
    if (isNotificationsFeatureEnabled) return items;
    return items.filter((item) => item.href !== '/notifications');
};

// ─── Función pública ──────────────────────────────────────────────────────────

/**
 * Resuelve los ítems de navegación para un usuario dado.
 * Retorna array vacío si el usuario no existe o su rol no está registrado.
 *
 * @param user - El usuario autenticado
 * @returns Lista de NavItems filtrada según rol y restricciones del usuario
 */
export const resolveNavItems = (user: User | null): NavItem[] => {
    if (!user) return [];

    const strategy = NAV_STRATEGIES[user.role];

    if (!strategy) {
        console.warn(`[NavStrategies] Rol desconocido: "${user.role}". No se mostrarán rutas.`);
        return [];
    }

    const items = strategy(user);
    const filtered = applyFeatureFlags(applyUserRestrictions(items, user.id));

    // Ajustes siempre al último, visible para todos los roles
    return [...filtered, settingsRoute];
};
