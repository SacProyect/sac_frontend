import { User } from "./user"
import { Payment } from "./payment"


export interface Taxpayer{
    id: string,
    providenceNum: number,
    process: taxpayer_process,
    name: string,
    rif: string,
    contract_type: contract_type,
    status: boolean,
    officerId: string,
    officer: User,
    events: Event
    payment: Payment
}

export enum contract_type {
    SPECIAL,
    ORDINARY,
}

export enum taxpayer_process {
    FP = "FP",
    AF = "AF",
    VDF = "VDF",
    NA = "NA"
}

export enum event_type {
    FINE,
    WARNING,
    PAYMENT_COMPROMISE
}