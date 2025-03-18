import { Payment } from "./payment";
import { event_type, Taxpayer } from "./taxpayer";


export interface Event {
    id: string,
    date: string,
    amount: number,
    type: event_type
    status: boolean,
    taxpayerId: string,
    taxpayer: Taxpayer[],
    payment: Payment[] | undefined,
    debt?: number;
<<<<<<< HEAD
    expires_at: string,
    description?: string;
    officerId?: string
=======

    
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
}