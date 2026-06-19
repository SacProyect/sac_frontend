import { useEffect, useState, useCallback } from 'react';
import { listPendingSubscriptions } from '@/components/utils/api/subscription-functions';
import { useAuth } from '@/hooks/use-auth';
import { isSubscriptionAdmin } from '@/config/subscription-admin';

/**
 * Contador de solicitudes pendientes — solo para el admin de suscripciones (Gabriel).
 */
export function usePendingSubscriptionCount() {
    const { user, devRoleOverride } = useAuth();
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const refresh = useCallback(async () => {
        if (!isSubscriptionAdmin(user, devRoleOverride)) {
            setCount(0);
            return;
        }
        setLoading(true);
        try {
            const data = await listPendingSubscriptions();
            setCount(data.length);
        } catch {
            setCount(0);
        } finally {
            setLoading(false);
        }
    }, [user, devRoleOverride]);

    useEffect(() => {
        refresh();
        const onChange = () => refresh();
        window.addEventListener('sac-subscription-changed', onChange);
        return () => window.removeEventListener('sac-subscription-changed', onChange);
    }, [refresh]);

    return { count, loading, refresh, isAdmin: isSubscriptionAdmin(user, devRoleOverride) };
}
