import { User } from "./user";


export interface Errors {
    id?: string,
    title?: string,
    description: string,
    type: app_error,
    user: User,
    userId: string,
    created_at: Date,
    closed_at?: Date,
    error_images?: ErrorImages[],
}

export interface ErrorImages {
    id?: string,
    img_src: string,
    img_alt: string,
    errorId?: string,
    error: Errors
}



export enum app_error {
    HOME = "HOME",
    TAXPAYER_DETAILS = "TAXPAYER_DETAILS",
    TAXPAYERS = "TAXPAYERS",
    WARNING = "WARNING",
    FINES = "FINES",
    PAYMENT= "PAYMENT",
    PAYMENT_COMPROMISE = "PAYMENT_COMPROMISE",
    STATS = "STATS",
    OTHER = "OTHER",
}