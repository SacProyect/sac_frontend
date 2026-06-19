import apiConnection from '@/components/utils/api/api-connection';
import type { BillingCycle, SubscriptionPlanId } from '@/config/subscription-plans';
import type { SubscriptionFeatures } from '@/types/subscription-features';
import { EMPTY_SUBSCRIPTION_FEATURES } from '@/types/subscription-features';
import {
    isDevSubscriptionSandbox,
    devRequestSubscription,
    devGetMySubscription,
    devGetSubscriptionFeatures,
    devListPending,
    devGetPendingForRealAdmin,
    devApproveSubscription,
    devRejectSubscription,
    devFiscalAiChat,
} from '@/dev/subscription-dev-mock';

export type SubscriptionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface AutomationSubscription {
    id: string;
    userId: string;
    plan: SubscriptionPlanId;
    billingCycle: BillingCycle;
    status: SubscriptionStatus;
    referenceCode: string;
    amountUsd: number;
    requestedAt: string;
    approvedAt?: string | null;
    expiresAt?: string | null;
    notes?: string | null;
    user?: { id: string; name: string; role: string; personId: number };
}

export async function getSubscriptionFeatures(): Promise<SubscriptionFeatures> {
    if (isDevSubscriptionSandbox()) return devGetSubscriptionFeatures();
    try {
        const { data } = await apiConnection.get<SubscriptionFeatures & { success: boolean }>(
            '/subscription/features',
        );
        return {
            active: data.active,
            plan: data.plan,
            status: data.status,
            expiresAt: data.expiresAt,
            features: data.features,
        };
    } catch {
        return EMPTY_SUBSCRIPTION_FEATURES;
    }
}

export type BulkIvaRow = {
    taxpayerId: string;
    purchases: string | number;
    sells: string | number;
    paid: string | number;
    date: string;
    iva?: string | number;
    excess?: string | number;
};

export async function bulkImportIvaReports(reports: BulkIvaRow[]) {
    if (isDevSubscriptionSandbox()) {
        const features = await devGetSubscriptionFeatures();
        if (!features.features.ivaAutomation) {
            throw new Error('Función no disponible. Requiere plan de automatización activo (ivaAutomation).');
        }
        await new Promise((r) => setTimeout(r, 600));
        return {
            success: true,
            created: reports.length,
            failed: 0,
            results: reports.map((r, i) => ({ index: i, taxpayerId: r.taxpayerId, ok: true })),
        };
    }
    const { data } = await apiConnection.post<{
        success: boolean;
        created: number;
        failed: number;
        results: Array<{ index: number; taxpayerId: string; ok: boolean; error?: string }>;
    }>('/subscription/bulk-iva', { reports });
    return data;
}

export async function fiscalAiChat(message: string, context?: string) {
    if (isDevSubscriptionSandbox()) return devFiscalAiChat(message);
    const { data } = await apiConnection.post<{ success: boolean; reply: string }>(
        '/subscription/ai/chat',
        { message, context },
    );
    return data.reply;
}

export async function fiscalAiChatWithTools(message: string) {
    if (isDevSubscriptionSandbox()) return { reply: await devFiscalAiChat(message), toolResults: [] };
    const { data } = await apiConnection.post<{
        success: boolean;
        reply: string;
        toolResults: Array<{ tool: string; content: string }>;
    }>('/ai/chat/with-tools', { message });
    return { reply: data.reply, toolResults: data.toolResults ?? [] };
}

export async function createTaxpayerBulkRow(payload: Record<string, unknown>) {
    if (isDevSubscriptionSandbox()) {
        const features = await devGetSubscriptionFeatures();
        if (!features.features.bulkImport) {
            throw new Error('Función no disponible. Requiere plan de automatización activo (bulkImport).');
        }
        await new Promise((r) => setTimeout(r, 300));
        return { id: crypto.randomUUID(), ...payload, demo: true };
    }
    const { data } = await apiConnection.post('/taxpayer/create-taxpayer', payload);
    return data;
}

export async function requestSubscription(plan: SubscriptionPlanId, billingCycle: BillingCycle) {
    if (isDevSubscriptionSandbox()) return devRequestSubscription(plan, billingCycle);
    const { data } = await apiConnection.post<{ success: boolean; subscription: AutomationSubscription }>(
        '/subscription/request',
        { plan, billingCycle },
    );
    return data.subscription;
}

export async function getMySubscription() {
    if (isDevSubscriptionSandbox()) return devGetMySubscription();
    const { data } = await apiConnection.get<{ success: boolean; subscription: AutomationSubscription | null }>(
        '/subscription/me',
    );
    return data.subscription;
}

export async function listPendingSubscriptions() {
    if (isDevSubscriptionSandbox()) return devListPending();
    if (import.meta.env.DEV) {
        const localPending = devGetPendingForRealAdmin();
        if (localPending.length > 0) return localPending;
    }
    const { data } = await apiConnection.get<{ success: boolean; subscriptions: AutomationSubscription[] }>(
        '/subscription/pending',
    );
    return data.subscriptions;
}

export async function listAllSubscriptions() {
    if (isDevSubscriptionSandbox()) {
        const { devListAll } = await import('@/dev/subscription-dev-mock');
        return devListAll();
    }
    const { data } = await apiConnection.get<{ success: boolean; subscriptions: AutomationSubscription[] }>(
        '/subscription/history',
    );
    return data.subscriptions;
}

export async function approveSubscription(id: string) {
    if (isDevSubscriptionSandbox() || (import.meta.env.DEV && devGetPendingForRealAdmin().some((s) => s.id === id))) {
        return devApproveSubscription(id);
    }
    const { data } = await apiConnection.patch<{ success: boolean; subscription: AutomationSubscription }>(
        `/subscription/${id}/approve`,
    );
    return data.subscription;
}

export async function rejectSubscription(id: string, notes?: string) {
    if (isDevSubscriptionSandbox() || (import.meta.env.DEV && devGetPendingForRealAdmin().some((s) => s.id === id))) {
        return devRejectSubscription(id);
    }
    const { data } = await apiConnection.patch<{ success: boolean; subscription: AutomationSubscription }>(
        `/subscription/${id}/reject`,
        { notes },
    );
    return data.subscription;
}
