import type { SubscriptionPlanId } from '@/config/subscription-plans';
import { SUBSCRIPTION_SCOPE_NOTE } from '@/config/subscription-policy';

export type SubscriptionFeatureKey = 'bulkImport' | 'ivaAutomation' | 'aiAssistant';

export interface SubscriptionFeatures {
    active: boolean;
    plan: SubscriptionPlanId | null;
    status: string | null;
    expiresAt: string | null;
    features: Record<SubscriptionFeatureKey, boolean>;
}

export const EMPTY_SUBSCRIPTION_FEATURES: SubscriptionFeatures = {
    active: false,
    plan: null,
    status: null,
    expiresAt: null,
    features: {
        bulkImport: false,
        ivaAutomation: false,
        aiAssistant: false,
    },
};

/** Re-export para UI de planes */
export { SUBSCRIPTION_SCOPE_NOTE };
