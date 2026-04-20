import { Taxpayer } from "./taxpayer";
import { Event } from "./event";

/**
 * Pago. Según endpoint:
 * - getPaymentHistory: cada ítem tiene event como objeto (no array) con id, amount, type, date, taxpayerId. No taxpayer.
 */
export interface Payment {
    id: string;
    amount: number;
    date: string;
    status?: boolean;
    eventId: string;
    taxpayerId: string;
    taxpayer?: Taxpayer[];
    /** Backend getPaymentHistory devuelve event como un solo objeto con id, amount, type, date, taxpayerId */
    event: Event | Event[];
    debt?: number;
    compliance_rate?: number;
    average_delay?: number;
    last_payments?: number;
    total_amount?: number;
    payments_number?: number;
    total_payments?: number;
}

/** Respuesta de getPaymentHistory */
export interface PaymentHistoryResponse {
    payments: Payment[];
    payments_number: number;
    total_payments: number;
    total_amount: number;
    last_payments: Payment[];
    compliance_rate: number;
    average_delay: number;
}









