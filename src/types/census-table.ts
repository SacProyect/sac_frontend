/**
 * Types for the Census Table feature.
 * Maps directly to backend response shapes.
 */

export type CensusStatus = 'DRAFT' | 'COMPLETED' | 'VERIFIED' | 'IMPORTED';

export interface CensusRecordRow {
  id: string;
  census_number: string;
  census_year: number;
  commercial_name: string | null;
  activity_type: string | null;
  billing_method: string | null;
  employee_count: number | null;
  has_fiscal_machine: boolean;
  has_homologated_system: boolean;
  homologated_system_name: string | null;
  admin_unit_id: string | null;
  census_status: CensusStatus;
  data_integrity_status: string;
  fiscal_name: string;
  taxpayer_rif: string | null;
  parish_name: string | null;
  address: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface CensusStatusStats {
  total: number;
  DRAFT: number;
  COMPLETED: number;
  VERIFIED: number;
}

export interface FiscalWithStats {
  id: string;
  name: string;
  role: string;
  census_stats: CensusStatusStats;
}

export interface UnitWithStats {
  id: string;
  name: string;
  fiscal_count: number;
  census_stats: CensusStatusStats;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CensusTableParams {
  page?: number;
  limit?: number;
  status?: CensusStatus | string;
  sort?: string;
}

export interface CensusTableResponse<T> {
  success: boolean;
  data: T[] | null;
  pagination?: PaginationMeta;
  message?: string;
}
