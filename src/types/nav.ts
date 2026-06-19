import { ReactNode } from 'react';

/**
 * Representa un ítem de navegación en el sidebar.
 */
export interface NavItem {
    href: string;
    label: string;
    icon: ReactNode;
}

/**
 * Grupo colapsable de ítems de navegación relacionados.
 */
export interface NavGroup {
    id: string;
    label: string;
    icon: ReactNode;
    items: NavItem[];
}

export interface NavStructure {
    groups: NavGroup[];
    settings: NavItem | null;
}

export function isNavGroup(entry: NavItem | NavGroup): entry is NavGroup {
    return 'items' in entry;
}
