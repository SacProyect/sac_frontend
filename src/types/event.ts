import { Payment } from "./payment";
import { event_type, Taxpayer } from "./taxpayer";

/**
 * Evento (multa, advertencia, compromiso). Según endpoint:
 * - getFineHistory: sin payment ni taxpayer.
 * - getPendingPayments: taxpayer viene como string (nombre + RIF). payment no incluido.
 */
export interface Event {
    id: string;
    date: string;
    amount: number;
    type: event_type;
    status?: boolean;
    taxpayerId: string;
    /** En listados puede ser array; en getPendingPayments el backend mapea a string "Nombre RIF: x" */
    taxpayer?: Taxpayer[] | string;
    payment?: Payment[] | { date: string }[];
    debt?: number;
    expires_at?: string;
    description?: string;
    officerId?: string;
}