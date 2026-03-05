import { ReactNode } from 'react';

/**
 * Representa un ítem de navegación en el sidebar.
 */
export interface NavItem {
    href: string;
    label: string;
    icon: ReactNode;
}
