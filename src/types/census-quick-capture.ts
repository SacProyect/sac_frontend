export type BillingMethod = 'MANUAL' | 'ELECTRONICA' | 'MIXTA';

export type CensusStatus = 'DRAFT' | 'COMPLETED' | 'VERIFIED' | 'IMPORTED';
export type DataIntegrityStatus = 'COMPLETE' | 'PENDING_DATA' | 'NOT_VERIFIED';

export interface QuickCapturePayload {
  census_number: string;
  census_year: number;
  commercial_name: string;
  activity_type: string;
  billing_method: BillingMethod;
  has_fiscal_machine: boolean;
  has_homologated_system: boolean;
  homologated_system_name?: string;
  latitude: number;
  longitude: number;
  address?: string;
  parish_id: string;
  official_id: string;
  taxpayer_id?: string;
  rif?: string;
  name?: string;
  employee_count?: number;
  admin_unit_id?: string;
}

export interface QuickCaptureFormData extends QuickCapturePayload {
  photo: File;
}

export type SyncStatus = 'PENDING_SYNC' | 'SYNCING' | 'SYNCED' | 'SYNC_ERROR';

export interface OfflineCensusRecord {
  id: string;
  encryptedPayload: ArrayBuffer;
  payloadIv: Uint8Array;
  encryptedPhoto: ArrayBuffer;
  photoIv: Uint8Array;
  status: SyncStatus;
  retryCount: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}
