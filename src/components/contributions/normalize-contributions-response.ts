import type { DecimalValue, GroupData, Member, Taxpayer } from './contribution-types';
import { Type } from './contribution-types';
import type { IVAReports } from '@/types/iva-reports';
import type { ISLRReports } from '@/types/islr-reports';

function isDecimalValue(val: unknown): val is DecimalValue {
    return (
        typeof val === 'object' &&
        val !== null &&
        's' in val &&
        'e' in val &&
        'd' in val &&
        Array.isArray((val as DecimalValue).d)
    );
}

/** Convierte montos del API: número, string, Decimal.js `{ s, e, d }`. */
export function coerceMoney(val: unknown): number {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number' && !Number.isNaN(val)) return val;
    if (typeof val === 'string') {
        const n = parseFloat(val.replace(/\s/g, '').replace(',', '.'));
        return Number.isNaN(n) ? 0 : n;
    }
    if (isDecimalValue(val)) {
        const d = val;
        if (!d.d.length) return 0;
        let str = d.d[0].toString();
        for (let i = 1; i < d.d.length; i++) {
            str += d.d[i].toString().padStart(7, '0');
        }
        const exp = d.e - str.length + 1;
        return d.s * parseFloat(str) * Math.pow(10, exp);
    }
    return 0;
}

/** Normaliza `event.type` del backend al enum usado en la UI. */
export function normalizeEventType(raw: unknown): Type | null {
    const u = String(raw ?? '')
        .toUpperCase()
        .trim()
        .replace(/\s+/g, '_');
    if (u === 'FINE') return Type.Fine;
    if (u === 'WARNING') return Type.Warning;
    if (u === 'PAYMENT_COMPROMISE' || u === 'PAYMENTCOMPROMISE') return Type.PaymentCompromise;
    return null;
}

function normalizeIvaRow(raw: unknown): IVAReports {
    const r = raw as Record<string, unknown>;
    return {
        ...(r as unknown as IVAReports),
        paid: coerceMoney(r.paid),
    };
}

function normalizeIslrRow(raw: unknown): ISLRReports {
    const r = raw as Record<string, unknown> & Partial<ISLRReports>;
    return {
        ...r,
        paid: coerceMoney(r.paid),
    } as unknown as ISLRReports;
}

function normalizeEventRow(raw: unknown) {
    const r = raw as Record<string, unknown>;
    const type = normalizeEventType(r.type);
    const amount = coerceMoney(r.amount);
    return {
        ...r,
        type: type ?? String(r.type ?? ''),
        amount: String(amount),
    };
}

function normalizeTaxpayer(raw: unknown): Taxpayer {
    const t = raw as Record<string, unknown>;
    const events = Array.isArray(t.event) ? t.event.map(normalizeEventRow) : [];
    const iva = Array.isArray(t.IVAReports) ? t.IVAReports.map(normalizeIvaRow) : [];
    const islr = Array.isArray(t.ISLRReports) ? t.ISLRReports.map(normalizeIslrRow) : [];
    const payments = Array.isArray(t.payment) ? t.payment : [];

    return {
        ...(t as unknown as Taxpayer),
        event: events as Taxpayer['event'],
        IVAReports: iva,
        ISLRReports: islr,
        payment: payments as Taxpayer['payment'],
    };
}

function normalizeMember(raw: unknown): Member {
    const m = raw as Record<string, unknown>;
    const taxpayers = Array.isArray(m.taxpayer) ? m.taxpayer.map(normalizeTaxpayer) : [];
    return {
        ...(m as unknown as Member),
        taxpayer: taxpayers,
    };
}

function normalizeGroup(raw: unknown): GroupData {
    const g = raw as Record<string, unknown>;
    const members = Array.isArray(g.members) ? g.members.map(normalizeMember) : [];
    const supervisorsStats = Array.isArray(g.supervisorsStats) ? g.supervisorsStats : [];

    return {
        ...(g as unknown as GroupData),
        members,
        supervisorsStats: supervisorsStats as GroupData['supervisorsStats'],
    };
}

/** Aplana el JSON de `reports/fiscal-groups` al shape que consume la UI. */
export function normalizeContributionsGroups(raw: unknown): GroupData[] {
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizeGroup);
}

/** Respuesta de `GET /reports/fiscal-groups/:groupId/members` → lista normalizada de fiscales con `taxpayer[]`. */
export function normalizeFiscalGroupMembersResponse(raw: unknown): Member[] {
    if (!raw || typeof raw !== 'object') return [];
    const list = (raw as Record<string, unknown>).members;
    if (!Array.isArray(list)) return [];
    return list.map(normalizeMember);
}
