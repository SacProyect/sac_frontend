import type { User } from "./user"
import type { Payment } from "./payment"
import type { IVAReports } from "./iva-reports"
import type { Event } from "./event"

/**
 * Usuario asignado (fiscal) - lo que envía el backend en listados y detalle.
 * En listados solo viene { id, name }; en detalle puede incluir group/coordinator/supervisorId.
 */
export interface TaxpayerUser {
    id?: string;
    name: string;
    group?: { coordinatorId?: string; coordinator?: { name?: string } };
    supervisorId?: string | null;
}

/**
 * Contribuyente. Campos opcionales según endpoint:
 * - Listados (get-taxpayers): id, name, rif, address, process, providenceNum, contract_type, emition_date, taxpayer_category?, parish?, user: { id, name }. Sin officer, events, payment, IVAReports.
 * - Detalle (taxpayer/data/:id): incluye user (con group/coordinator), IVAReports, etc.
 * - get-taxpayers-for-events: incluye event, IVAReports, ISLRReports, user: { name }.
 */
export interface Taxpayer {
    id: string;
    providenceNum: number;
    address: string;
    process: taxpayer_process;
    name: string;
    rif: string;
    contract_type: contract_type;
    status?: boolean;
    officerId?: string | null;
    /** @deprecated Preferir user (backend envía user, no officer) */
    officer?: User;
    events?: Event[];
    payment?: Payment[];
    emition_date: string;
    description?: string;
    officerName?: string;
    parish?: Parish | null;
    taxpayer_category?: TaxpayerCategory | null;
    /** Fiscal asignado. En listados: { id, name }. En detalle: con group, coordinator, supervisorId. */
    user?: TaxpayerUser;
    IVAReports?: IVAReports[];
}

/** Respuesta paginada de get-taxpayers (findAll). */
export interface TaxpayersListResponse {
    data: Taxpayer[];
    total: number;
    page: number;
    totalPages: number;
    limit: number;
}

export interface Parish {
    id: string;
    name: string;
}

export interface TaxpayerCategory {
    id: string;
    name: string;
}

export enum contract_type {
    SPECIAL = "SPECIAL",
    ORDINARY = "ORDINARY",
}

export enum taxpayer_process {
    FP = "FP",
    AF = "AF",
    VDF = "VDF",
    NA = "NA"
}

export enum event_type {
    FINE = "FINE",
    WARNING = "WARNING",
    PAYMENT_COMPROMISE = "PAYMENT_COMPROMISE"
}

export interface FiscalTaxpayer {
    id: string
    name: string
    rif: string
    address: string
    date: string
    emition_date: string
    fase: string
    process: string
    culminated: boolean
    collectedIva: string
    collectedIslr: string
    collectedFines: string
    totalCollected: string
    deadline: number
    delayDays?: number
}

export interface FiscalTaxpayerStatsResponse {
    vdfOnTime: FiscalTaxpayer[]
    vdfLate: FiscalTaxpayer[]
    afOnTime: FiscalTaxpayer[]
    afLate: FiscalTaxpayer[]
}