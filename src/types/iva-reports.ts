

/** Backend devuelve estos campos (select en findIvaReportsByTaxpayer). */
export interface IVAReports {
    id: string;
    iva?: number;
    excess?: number;
    date: string;
    purchases: number;
    sells: number;
    paid: number;
    taxpayerId?: string;
    updated_at?: string;
}