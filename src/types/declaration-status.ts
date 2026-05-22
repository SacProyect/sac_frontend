export interface TaxpayerDeclarationStatus {
  id: string;
  name: string;
  rif: string;
  process: string;
  fase: string;
  contract_type: string;
  hasIVA: boolean;
  hasISLR: boolean;
}

export interface DeclarationStatusSummary {
  total: number;
  conIVA: number;
  sinIVA: number;
  conISLR: number;
  sinISLR: number;
}

export interface FiscalDeclarationStatusResponse {
  taxpayers: TaxpayerDeclarationStatus[];
  summary: DeclarationStatusSummary;
}
