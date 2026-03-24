import { Taxpayer } from "./taxpayer";
import { Event } from "./event";

export interface Payment {
    id: string,
    amount: number,
    date: string,
    status: boolean,
    eventId: string,
    taxpayerId: String,
    taxpayer: Taxpayer[],
    event: Event[],
    debt: number,


    compliance_rate: number;
    average_delay: number;
    last_payments: number;
    total_amount: number;
    payments_number: number;
    total_payments: number;
}









