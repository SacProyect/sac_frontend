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

export interface ProcessCompliance {
    tipo: string;
    nombre: string;
    descripcion: string;
    esperado: number;
    recaudado: number;
    cumplimiento: number;
}

export interface ComplianceInterface {
    name: string;
    rif: string;
    complianceRate: number;
    totalCollected: number;
    totalIva: number;
    totalIslr: number;
    totalFines: number;
}

export interface GetCompleteReportParams {
    groupId?: string;
    startDate?: string;
    endDate?: string;
    process?: "AF" | "VDF" | "FP";
}

export interface FiscalAnalisis {
    taxpayerWithMostCollected: TaxpayerWithMostCollected;
    totalCollected: number;
    totalIva: number;
    totalIslr: number;
    totalFines: number;
    avgIva: number;
    avgIslr: number;
    avgFines: number;
    taxpayersWithFines: number;
}

export interface TaxpayerWithMostCollected {
    name: string;
    rif: string;
    totalCollected: number;
    iva: number;
    islr: number;
    fines: number;
}

