import type { BillingCycle, SubscriptionPlanId } from '@/config/subscription-plans';
import type { AutomationSubscription, SubscriptionStatus } from '@/components/utils/api/subscription-functions';
import type { SubscriptionFeatures } from '@/types/subscription-features';
import { getPlanById, getPlanPrice } from '@/config/subscription-plans';
import { isDevPaidRoleSimulation } from '@/config/subscription-role-config';

const STORAGE_KEY = 'sac_dev_subscription_v1';
const DEV_ROLE_OVERRIDE_KEY = 'dev-role-override';

type DevStore = {
    subscriptions: AutomationSubscription[];
};

function readDevRoleOverride(): string | null {
    try {
        const raw = localStorage.getItem(DEV_ROLE_OVERRIDE_KEY);
        if (!raw || raw === 'null') return null;
        return JSON.parse(raw) as string;
    } catch {
        return null;
    }
}

function readStoredUser(): { id: string; name: string; role: string; personId?: string } | null {
    try {
        const u = localStorage.getItem('user');
        if (u) return JSON.parse(u);
    } catch {
        /* ignore */
    }
    return null;
}

function fakeUser() {
    const stored = readStoredUser();
    const override = readDevRoleOverride();
    const validRoles = ['ADMIN', 'COORDINATOR', 'SUPERVISOR', 'FISCAL'] as const;

    if (stored) {
        if (override && validRoles.includes(override as typeof validRoles[number])) {
            return { ...stored, role: override };
        }
        return stored;
    }

    const role = sessionStorage.getItem('dev-fake-role') ?? 'ADMIN';
    return {
        id: role === 'ADMIN' ? 'dev-admin-fake-id' : `dev-${role.toLowerCase()}-fake-id`,
        name: `Usuario Demo (${role})`,
        role,
        personId: '12345678',
    };
}

function isRealSubscriptionAdmin(): boolean {
    const stored = readStoredUser();
    if (!stored) return false;
    return (
        stored.id === 'f10bf84c-6523-4e72-874c-e2f43eb40115'
        || String(stored.personId) === '28338232'
    );
}

function loadStore(): DevStore {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as DevStore;
    } catch {
        /* ignore */
    }
    return { subscriptions: [] };
}

function saveStore(store: DevStore) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new Event('sac-subscription-changed'));
}

function computeExpiresAt(cycle: BillingCycle): string {
    const d = new Date();
    if (cycle === 'MONTHLY') d.setMonth(d.getMonth() + 1);
    else d.setFullYear(d.getFullYear() + 1);
    return d.toISOString();
}

export const isSubscriptionDevMock =
    import.meta.env.DEV && import.meta.env.VITE_DEV_MOCK_SUBSCRIPTION === 'true';

/** Sandbox local al simular FISCAL/SUPERVISOR/COORDINATOR con el DevTool de roles. */
export function isDevSubscriptionSandbox(): boolean {
    if (!import.meta.env.DEV) return false;
    if (isSubscriptionDevMock) return true;
    return isDevPaidRoleSimulation(readDevRoleOverride());
}

export function devRequestSubscription(plan: SubscriptionPlanId, billingCycle: BillingCycle) {
    const store = loadStore();
    const user = fakeUser();
    const pending = store.subscriptions.find((s) => s.userId === user.id && s.status === 'PENDING');
    if (pending) return pending;

    const active = store.subscriptions.find(
        (s) => s.userId === user.id && s.status === 'APPROVED' && s.expiresAt && new Date(s.expiresAt) > new Date(),
    );
    if (active) throw new Error('Ya tienes un plan activo.');

    const planDef = getPlanById(plan)!;
    const sub: AutomationSubscription = {
        id: crypto.randomUUID(),
        userId: user.id,
        plan,
        billingCycle,
        status: 'PENDING',
        referenceCode: `SAC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        amountUsd: getPlanPrice(planDef, billingCycle),
        requestedAt: new Date().toISOString(),
        user: { id: user.id, name: user.name, role: user.role, personId: Number(user.personId ?? 0) },
    };
    store.subscriptions.unshift(sub);
    saveStore(store);
    return sub;
}

export function devGetMySubscription(): AutomationSubscription | null {
    const store = loadStore();
    const user = fakeUser();
    return (
        store.subscriptions.find((s) => {
            if (s.userId !== user.id) return false;
            if (s.status === 'PENDING') return true;
            if (s.status === 'APPROVED' && s.expiresAt && new Date(s.expiresAt) > new Date()) return true;
            return false;
        }) ?? null
    );
}

export function devGetSubscriptionFeatures(): SubscriptionFeatures {
    const user = fakeUser();
    if (user.role === 'ADMIN') {
        return {
            active: true,
            plan: 'PREMIUM',
            status: 'APPROVED',
            expiresAt: null,
            features: {
                bulkImport: true,
                ivaAutomation: true,
                aiAssistant: true,
            },
        };
    }

    const sub = devGetMySubscription();
    const active = sub?.status === 'APPROVED';
    const plan = active ? sub!.plan : null;

    if (!plan) {
        return {
            active: false,
            plan: null,
            status: sub?.status ?? null,
            expiresAt: sub?.expiresAt ?? null,
            features: {
                bulkImport: false,
                ivaAutomation: false,
                aiAssistant: false,
            },
        };
    }

    const features = featuresForDevPlanRole(plan, user.role);
    return {
        active: !!active,
        plan: active ? plan : null,
        status: sub?.status ?? null,
        expiresAt: sub?.expiresAt ?? null,
        features,
    };
}

function featuresForDevPlanRole(
    plan: SubscriptionPlanId,
    role: string,
): SubscriptionFeatures['features'] {
    if (role === 'FISCAL') {
        if (plan === 'PLUS') {
            return { bulkImport: true, ivaAutomation: true, aiAssistant: false };
        }
        if (plan === 'PREMIUM') {
            return { bulkImport: true, ivaAutomation: true, aiAssistant: true };
        }
        if (plan === 'BASIC') {
            return { bulkImport: true, ivaAutomation: false, aiAssistant: false };
        }
    }
    if (role === 'SUPERVISOR' || role === 'COORDINATOR') {
        return { bulkImport: false, ivaAutomation: false, aiAssistant: plan === 'PREMIUM' };
    }
    return {
        bulkImport: false,
        ivaAutomation: false,
        aiAssistant: false,
    };
}

export function devListPending(): AutomationSubscription[] {
    const override = readDevRoleOverride();
    if (!isRealSubscriptionAdmin() || (override && override !== 'ADMIN')) {
        return [];
    }
    return loadStore().subscriptions.filter((s) => s.status === 'PENDING');
}

export function devListAll(): AutomationSubscription[] {
    const override = readDevRoleOverride();
    if (!isRealSubscriptionAdmin() || (override && override !== 'ADMIN')) {
        return [];
    }
    return loadStore().subscriptions;
}

/** Pendientes del sandbox local para Gabriel cuando vuelve a rol ADMIN en dev. */
export function devGetPendingForRealAdmin(): AutomationSubscription[] {
    if (!isRealSubscriptionAdmin()) return [];
    return loadStore().subscriptions.filter((s) => s.status === 'PENDING');
}

export function devApproveSubscription(id: string): AutomationSubscription {
    const store = loadStore();
    const idx = store.subscriptions.findIndex((s) => s.id === id);
    if (idx < 0) throw new Error('Suscripción no encontrada');
    const sub = store.subscriptions[idx];
    if (sub.status !== 'PENDING') throw new Error('Ya procesada');
    const updated: AutomationSubscription = {
        ...sub,
        status: 'APPROVED' as SubscriptionStatus,
        approvedAt: new Date().toISOString(),
        expiresAt: computeExpiresAt(sub.billingCycle),
    };
    store.subscriptions[idx] = updated;
    saveStore(store);
    return updated;
}

export function devRejectSubscription(id: string): AutomationSubscription {
    const store = loadStore();
    const idx = store.subscriptions.findIndex((s) => s.id === id);
    if (idx < 0) throw new Error('Suscripción no encontrada');
    store.subscriptions[idx] = { ...store.subscriptions[idx], status: 'REJECTED' };
    saveStore(store);
    return store.subscriptions[idx];
}

export function devResetSubscriptions() {
    localStorage.removeItem(STORAGE_KEY);
}

export async function devFiscalAiChat(message: string): Promise<string> {
    await new Promise((r) => setTimeout(r, 800));
    if (/multa/i.test(message)) {
        return 'Las multas no están incluidas en los planes de automatización. En SAC, cada fiscal debe registrarlas manualmente desde Administración → botón Multa. Los planes cubren contribuyentes, IVA y asistencia IA.';
    }
    return `[Modo demo] Recibí tu consulta: "${message.slice(0, 120)}". En producción el asistente IA (Groq) respondería con normativa SENIAT, redacción de providencias y análisis de tu caso. Las multas siempre son carga manual del fiscal. Configura GROQ_API_KEY en el backend para respuestas reales.`;
}
