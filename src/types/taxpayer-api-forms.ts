import type Decimal from "decimal.js";

/**
 * Tipos compartidos para las llamadas API en `taxpayer-functions.ts`.
 * Viven aquí para evitar dependencias circulares:
 * taxpayer-functions → componentes de formulario → useCachedData → taxpayer-functions.
 */

export interface NewEvent {
  date: string;
  amount?: number;
  taxpayerId: string;
  eventId?: string;
  debt?: number;
  expires_at?: string;
  fineEventId?: string;
}

export interface ObservationsForm {
  taxpayerId: string;
  description: string;
  date: string;
}

export interface IvaReportFormData {
  taxpayerId: string;
  iva?: Decimal;
  purchases: Decimal;
  sells: Decimal;
  excess?: Decimal;
  date: string;
  paid: Decimal;
}

export interface IslrReportFormData {
  taxpayerId: string;
  incomes: string;
  costs: string;
  expent: string;
  emition_date: string;
  paid: string;
}
