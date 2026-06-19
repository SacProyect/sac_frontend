import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { resolveNavItems } from '@/config/nav-strategies';
import { groupNavItems } from '@/config/nav-groups';
import { NavStructure } from '@/types/nav';

/**
 * Hook que expone la estructura de navegación agrupada del usuario autenticado.
 */
export const useNavStructure = (): NavStructure => {
    const { user, devRoleOverride } = useAuth();

    return useMemo(() => {
        const items = resolveNavItems(user ?? null, devRoleOverride);
        return groupNavItems(items);
    }, [user, devRoleOverride]);
};

/** @deprecated Usar useNavStructure para menú con grupos */
export const useNavItems = () => {
    const { groups, settings } = useNavStructure();
    return useMemo(
        () => [...groups.flatMap((g) => g.items), ...(settings ? [settings] : [])],
        [groups, settings],
    );
};
