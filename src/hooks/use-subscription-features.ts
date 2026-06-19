import { useEffect, useState, useCallback } from 'react';
import { getSubscriptionFeatures } from '@/components/utils/api/subscription-functions';
import { EMPTY_SUBSCRIPTION_FEATURES, SubscriptionFeatures } from '@/types/subscription-features';
import { useAuth } from '@/hooks/use-auth';

export function useSubscriptionFeatures() {
    const { devRoleOverride } = useAuth();
    const [data, setData] = useState<SubscriptionFeatures>(EMPTY_SUBSCRIPTION_FEATURES);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const features = await getSubscriptionFeatures();
            setData(features);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
        const onChange = () => refresh();
        window.addEventListener('sac-subscription-changed', onChange);
        return () => window.removeEventListener('sac-subscription-changed', onChange);
    }, [refresh, devRoleOverride]);

    return { ...data, loading, refresh };
}
