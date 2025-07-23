import { ISLRReports } from "@/types/ISLRReports";
import { IVAReports } from "@/types/IvaReports";
import Decimal from "decimal.js";

export interface GroupData {
    id: string;
    name: string;
    coordinatorId: string;
    created_at: string; // puede mantenerse como string (ISO) si no parseas a Date
    members: Member[]; // no lo usas directamente aún
    collected: string;
    totalFines: string;
    collectedFines: string;
    totalIva: string;
    totalIslr: string;
    supervisorsStats: SupervisorsStat[];
}

export interface SupervisorsStat {
    supervisorId: string;
    totalCollected: string;
    collectedIva: string;
    collectedISLR: string;
    collectedFines: string;
    totalFines: string;
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
