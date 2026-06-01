export interface TaxCase {
  id: string;
  taxpayerId: string;
  year: number;
  process: string;
  contract_type: string;
  fase: string;
  officerId?: string;
  notified: boolean;
  culminated: boolean;
  emition_date: string;
  created_at: string;
}
