import {
    LayoutDashboard,
    Users,
    CheckCircle,
    FileBarChart,
    BarChart3,
    Settings2,
    FileText,
    ClipboardList,
    Wallet,
    Bell,
    Shield,
    Telescope,
} from 'lucide-react';
import { NavItem } from '@/types/nav';

/**
 * Rutas compartidas por TODOS los roles.
 * Si una ruta debe aparecer para todos, va aquí.
 */
/** Solo ADMIN y COORDINATOR (se añade en estrategias, no en shared). */
export const auditTrailNavItem: NavItem = {
    href: '/auditoria',
    label: 'Auditoría',
    icon: <Shield className="w-4 h-4" />,
};

/** Solo ADMIN y COORDINATOR — panel operativo detallado (no confundir con `/auditoria`). */
export const internalAuditNavItem: NavItem = {
    href: '/auditoria-interna',
    label: 'Auditoría interna',
    icon: <Telescope className="w-4 h-4" />,
};

export const sharedRoutes: NavItem[] = [
    { href: '/admin',        label: 'Administración', icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: '/census',       label: 'Tabla Censo',    icon: <Users className="w-4 h-4" /> },
    { href: '/fiscal-review',label: 'Revisión Fiscal',icon: <CheckCircle className="w-4 h-4" /> },
    { href: '/gen-reports',  label: 'Reportes',       icon: <FileBarChart className="w-4 h-4" /> },
    { href: '/stats',        label: 'Estadísticas',   icon: <BarChart3 className="w-4 h-4" /> },
    { href: '/notifications',label: 'Notificaciones', icon: <Bell className="w-4 h-4" /> },
];

/** Ruta de ajustes — siempre visible para todos los roles, siempre al final. */
export const settingsRoute: NavItem = { href: '/settings', label: 'Ajustes', icon: <Settings2 className="w-4 h-4" /> };

/**
 * Bloques de rutas reutilizables por múltiples roles.
 * Agrupa rutas relacionadas para evitar duplicación entre estrategias.
 */
export const routeBlocks = {
    ivaIslr: [
        { href: '/iva',  label: 'Reporte IVA',  icon: <FileText className="w-4 h-4" /> },
        { href: '/islr', label: 'Reporte ISLR', icon: <FileText className="w-4 h-4" /> },
    ] as NavItem[],

    indexIva: [
        { href: '/index-iva', label: 'Índice IVA', icon: <ClipboardList className="w-4 h-4" /> },
    ] as NavItem[],

    contributions: [
        { href: '/contributions', label: 'Contribuciones', icon: <Wallet className="w-4 h-4" /> },
    ] as NavItem[],

    /** Genera la ruta de estadísticas personalizada con el ID del usuario */
    fiscalStats: (userId: string): NavItem[] => [
        { href: `/stats/fiscal/${userId}`, label: 'Estadísticas', icon: <BarChart3 className="w-4 h-4" /> },
    ],
};

/**
 * IDs de usuarios con restricciones especiales de navegación.
 * En lugar de un magic string, se documenta aquí con contexto.
 */
export const RESTRICTED_USER_IDS: ReadonlySet<string> = new Set([
    'dc6734e1-77be-42bb-b708-27979e931f08', // Usuario con acceso restringido (Sólo lectura)
]);

/**
 * Rutas que serán filtradas para los usuarios con restricción especial.
 */
export const RESTRICTED_ROUTES: ReadonlySet<string> = new Set([
    '/fine', '/iva', '/islr', '/census',
    '/show-census', '/taxpayer', '/index-iva', '/warning',
    '/auditoria',
    '/auditoria-interna',
]);
