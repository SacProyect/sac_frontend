import Decimal from "decimal.js";


export interface ISLRReports {
    id: string;
    incomes: Decimal;
    costs: Decimal;
    expent: Decimal;
    emition_date: Date;
    taxpayerId: string;
    taxpayer:  TaxpayerReduced
}

export interface TaxpayerReduced {
    name: string,
    process: string
}