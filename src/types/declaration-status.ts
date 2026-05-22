export interface TaxpayerDeclarationStatus {
  id: string;
  name: string;
  rif: string;
  process: string;
  fase: string;
  contract_type: string;
  ivaMonths: number[];      // meses (1-12) con IVA cargado
  hasIVA: boolean;
  islrFiled: boolean;
  hasISLR: boolean;
  fineMonths: number[];     // meses (1-12) con multas
  hasFine: boolean;
}

export interface DeclarationStatusSummary {
  total: number;
  conIVA: number;
  sinIVA: number;
  conISLR: number;
  sinISLR: number;
  conMultas: number;
  sinMultas: number;
}

export interface FiscalDeclarationStatusResponse {
  taxpayers: TaxpayerDeclarationStatus[];
  summary: DeclarationStatusSummary;
}
