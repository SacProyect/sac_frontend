import { ISLRReports } from "@/types/islr-reports";
import { IVAReports } from "@/types/iva-reports";

/** Formato Decimal.js que usa el backend para los montos monetarios */
export interface DecimalValue {
    s: number;   // signo: 1 = positivo, -1 = negativo
    e: number;   // exponente del primer grupo de dígitos
    d: number[]; // grupos de dígitos (d[0] libre, d[1..] con padding de 7)
}

export interface GroupData {
    id: string;
    name: string;
    coordinatorId?: string;
    coordinator?: { name: string };
    created_at?: string;
    members: Member[];
    collected: DecimalValue;
    totalFines: DecimalValue;
    collectedFines: DecimalValue;
    totalIva: DecimalValue;
    totalIslr: DecimalValue;
    supervisorsStats: SupervisorsStat[];
}

export interface SupervisorsStat {
    supervisorId: string;
    totalCollected: DecimalValue;
    collectedIva: DecimalValue;
    collectedISLR: DecimalValue;
    collectedFines: DecimalValue;
    totalFines: DecimalValue;
    supervisorName: string;
}

export interface Member {
    id: string;
    name: string;
    role: string;
    personId: number;
    password: string;
    status: boolean;
    updated_at: Date;
    groupId: string;
    taxpayer: Taxpayer[];
    collected: string;
    supervisorId?: string;
}

export interface Taxpayer {
    id: string;
    providenceNum: number;
    process: Process;
    name: string;
    rif: string;
    contract_type: ContractType;
    status: boolean;
    officerId: string;
    updated_at: Date;
    event: Event[];
    payment: Payment[];
    IVAReports: IVAReports[];
    ISLRReports: ISLRReports[];
}

export enum ContractType {
    Ordinary = "ORDINARY",
    Special = "SPECIAL",
}

export interface Event {
    id: string;
    date: Date;
    amount: string;
    type: Type;
    status: boolean;
    debt: string;
    taxpayerId: string;
    expires_at: Date;
    updated_at: Date;
    fineEventId: null | string;
}

export enum Type {
    Fine = "FINE",
    PaymentCompromise = "PAYMENT_COMPROMISE",
    Warning = "WARNING",
}

export interface Payment {
    id: string;
    amount: string;
    date: Date;
    status: boolean;
    eventId: string;
    taxpayerId: string;
    updated_at: Date;
}

export enum Process {
    AF = "AF",
    FP = "FP",
    Vdf = "VDF",
}
