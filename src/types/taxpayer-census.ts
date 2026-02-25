/**
 * Backend devuelve fiscal solo con { name } (select optimizado).
 */
export type TaxpayerCensus = {
    id: string;
    number: number;
    process?: "FP" | "AF" | "VDF";
    name: string;
    rif: string;
    type?: "ORDINARY" | "SPECIAL";
    address?: string;
    emition_date?: Date;
    userId: string;
    role?: string;
    fiscal: { name: string };
}

export interface NewTaxpayerCensusInput {
    number: number;
    process?: "FP" | "AF" | "VDF";
    name: string;
    rif: string;
    type?: "ORDINARY" | "SPECIAL";
    address?: string;
    emition_date?: Date;
    userId: string;
    role?: string;
}