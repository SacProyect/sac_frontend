import { taxpayer_process } from "./taxpayer";

export type FiscalInfo = {
    fiscalName: string;
    fiscalId: string;
    totalTaxpayers: number;
    totalProcess: number;
    totalCompleted: number;
    totalNotified: number;
}

export interface TaxpayersList {
    id: string;
    name: string;
    address: string;
    emition_date: Date;
    rif: string;
    fase: string;
    collectedIva: string;
    collectedIslr: string;
    collectedFines: string;
    totalCollected: string;
    culminated: boolean;
    process: taxpayer_process;
}

export interface FiscalMonthlyCollect {
    month: string;
    iva: number;
    islr: number;
    fines: number;
    total: number;
}

export interface FiscalMonthlyGrowth {
    month: string;
    currentCollected: number;
    previousCollected: number;
    variation: number;
}
