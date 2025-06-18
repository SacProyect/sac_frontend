

export interface IVAReports {
    id: string;
    iva?: number;
    excess?: number;
    date: string;
    purchases: number;
    sells: number;
    paid: number;
    taxpayerId?: string;
}