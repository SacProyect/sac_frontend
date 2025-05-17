import { User } from "./user"
import { Payment } from "./payment"
import { IVAReports } from "./IvaReports";


export interface Taxpayer {
    id: string,
    providenceNum: number,
    address: string,
    process: taxpayer_process,
    name: string,
    rif: string,
    contract_type: contract_type,
    status: boolean,
    officerId: string,
    officer: User,
    events: Event
    payment: Payment,
    emition_date: string;
    description: string;
    officerName: string;
    user: User;
    IVAReports: IVAReports[];
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