import { User } from "./user"
import { Payment } from "./payment"
<<<<<<< HEAD
import { IVAReports } from "./IvaReports";


export interface Taxpayer {
    id: string,
    providenceNum: number,
    address: string,
=======


export interface Taxpayer{
    id: string,
    providenceNum: number,
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
    process: taxpayer_process,
    name: string,
    rif: string,
    contract_type: contract_type,
    status: boolean,
    officerId: string,
    officer: User,
    events: Event
<<<<<<< HEAD
    payment: Payment,
    emition_date: string;
    description: string;
    officerName: string;
    parish: Parish | null;
    taxpayer_category?: TaxpayerCategory | null;
    user: User;
    IVAReports: IVAReports[];
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
=======
    payment: Payment
}

export enum contract_type {
    SPECIAL,
    ORDINARY,
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
}

export enum taxpayer_process {
    FP = "FP",
    AF = "AF",
    VDF = "VDF",
    NA = "NA"
}

export enum event_type {
<<<<<<< HEAD
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
=======
    FINE,
    WARNING,
    PAYMENT_COMPROMISE
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
}