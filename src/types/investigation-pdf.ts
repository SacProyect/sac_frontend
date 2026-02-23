import { Taxpayer } from "./taxpayer"


export type InvestigationPdf =  {
    id: string,
    pdf_url: string,
    taxpayerId: string,
    taxpayer: Taxpayer
}