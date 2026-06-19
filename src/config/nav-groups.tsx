import { ReactNode } from 'react';
import {
    LayoutDashboard,
    CheckCircle,
    FileText,
    UserCog,
    Shield,
} from 'lucide-react';
import { NavGroup, NavItem, NavStructure } from '@/types/nav';
import { settingsRoute } from '@/config/nav-routes';

type GroupDef = {
    id: string;
    label: string;
    icon: ReactNode;
    /** Rutas exactas que pertenecen a este grupo */
    hrefs: string[];
    /** Prefijos de ruta (ej. /stats/fiscal/) */
    prefixHrefs?: string[];
};

const GROUP_DEFINITIONS: GroupDef[] = [
    {
        id: 'panel',
        label: 'Panel Principal',
        icon: <LayoutDashboard className="w-4 h-4" />,
        hrefs: ['/admin', '/census'],
    },
    {
        id: 'fiscalizacion',
        label: 'Fiscalización',
        icon: <CheckCircle className="w-4 h-4" />,
        hrefs: ['/fiscal-review', '/stats', '/gen-reports', '/visits-monitor'],
        prefixHrefs: ['/stats/fiscal'],
    },
    {
        id: 'impuestos',
        label: 'Impuestos y Contribuciones',
        icon: <FileText className="w-4 h-4" />,
        hrefs: ['/iva', '/islr', '/index-iva', '/contributions'],
    },
    {
        id: 'gestion',
        label: 'Gestión Institucional',
        icon: <UserCog className="w-4 h-4" />,
        hrefs: ['/documentos', '/gestion-personal', '/divulgacion-presencia-fiscal'],
    },
    {
        id: 'control',
        label: 'Control y Auditoría',
        icon: <Shield className="w-4 h-4" />,
        hrefs: ['/auditoria', '/auditoria-interna', '/notifications', '/aprobaciones-suscripcion'],
    },
];

function itemBelongsToGroup(item: NavItem, group: GroupDef): boolean {
    if (group.hrefs.includes(item.href)) return true;
    if (group.prefixHrefs?.some((prefix) => item.href.startsWith(prefix))) return true;
    return false;
}

/**
 * Organiza ítems planos del menú en grupos colapsables.
 * Ajustes queda siempre al final, fuera de los grupos.
 */
export function groupNavItems(items: NavItem[]): NavStructure {
    const settings = items.find((i) => i.href === settingsRoute.href) ?? null;
    const withoutSettings = items.filter((i) => i.href !== settingsRoute.href);

    const assigned = new Set<string>();
    const groups: NavGroup[] = [];

    for (const def of GROUP_DEFINITIONS) {
        const groupItems = withoutSettings.filter((item) => {
            if (assigned.has(item.href)) return false;
            return itemBelongsToGroup(item, def);
        });

        groupItems.forEach((item) => assigned.add(item.href));

        if (groupItems.length > 0) {
            groups.push({
                id: def.id,
                label: def.label,
                icon: def.icon,
                items: groupItems,
            });
        }
    }

    const orphans = withoutSettings.filter((item) => !assigned.has(item.href));
    if (orphans.length > 0) {
        groups.push({
            id: 'otros',
            label: 'Otros',
            icon: <LayoutDashboard className="w-4 h-4" />,
            items: orphans,
        });
    }

    return { groups, settings };
}
