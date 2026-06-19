import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import type { AgentPageContext } from '@/components/utils/api/subscription-functions';

const TAXPAYER_ID_PATTERN =
    /\/(?:fine|warning|payment|payment_compromise|observations)\/([0-9a-f-]{36})/i;

export function useAgentPageContext(): AgentPageContext | undefined {
    const { pathname } = useLocation();

    return useMemo(() => {
        const match = pathname.match(TAXPAYER_ID_PATTERN);
        const taxpayerId = match?.[1];
        const module = pathname.split('/').filter(Boolean)[0];
        if (!taxpayerId && !module) return undefined;
        return { taxpayerId, module };
    }, [pathname]);
}
