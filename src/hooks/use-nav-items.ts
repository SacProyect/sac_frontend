import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { resolveNavItems } from '@/config/nav-strategies';
import { NavItem } from '@/types/nav';

/**
 * Hook que expone los ítems de navegación del usuario autenticado.
 * 
 * Usa `useMemo` para evitar recalcular las rutas en cada render.
 * La lógica real vive en `nav-strategies.ts` (Strategy Pattern).
 * 
 * @returns Lista de NavItems calculada según el rol y restricciones del usuario.
 */
export const useNavItems = (): NavItem[] => {
    const { user } = useAuth();

    return useMemo(() => resolveNavItems(user ?? null), [user]);
};
