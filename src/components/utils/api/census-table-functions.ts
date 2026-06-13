import { apiConnection } from './api-connection';
import type {
  CensusTableParams,
  CensusTableResponse,
  CensusRecordRow,
  FiscalWithStats,
  UnitWithStats,
} from '@/types/census-table';

function buildQueryString(params?: CensusTableParams): string {
  if (!params) return '';
  const entries: [string, string][] = [];
  if (params.page !== undefined) entries.push(['page', String(params.page)]);
  if (params.limit !== undefined) entries.push(['limit', String(params.limit)]);
  if (params.status) entries.push(['status', params.status]);
  if (params.sort) entries.push(['sort', params.sort]);
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries).toString();
}

function handleError(error: any): { success: false; message: string; data: null } {
  if (error.response) {
    const errorData = error.response.data;
    const msg =
      typeof errorData?.error === 'string'
        ? errorData.error
        : errorData?.message || 'Ocurrió un error.';
    return { success: false, message: msg, data: null };
  }
  if (error.request) {
    return { success: false, message: 'No hay respuesta del servidor. Revise la conexión.', data: null };
  }
  return { success: false, message: 'Ocurrió un error inesperado. Por favor, intente de nuevo más tarde.', data: null };
}

// ── My Census (FISCAL) ──────────────────────────────────────────────

export async function getCensusTableMyCensus(
  params?: CensusTableParams
): Promise<CensusTableResponse<CensusRecordRow>> {
  try {
    const query = buildQueryString(params);
    const response = await apiConnection.get(`/census/table/my-census${query}`);
    if (response.data?.success) {
      return {
        success: true,
        data: response.data.censos ?? null,
        pagination: response.data.pagination,
      };
    }
    return { success: false, data: null, message: response.data?.message || 'Error al obtener censos.' };
  } catch (error: any) {
    return handleError(error);
  }
}

// ── My Fiscales (SUPERVISOR) ────────────────────────────────────────

export async function getCensusTableMyFiscales(
  params?: CensusTableParams
): Promise<CensusTableResponse<FiscalWithStats>> {
  try {
    const query = buildQueryString(params);
    const response = await apiConnection.get(`/census/table/my-fiscales${query}`);
    if (response.data?.success) {
      return {
        success: true,
        data: response.data.fiscales ?? null,
        pagination: response.data.pagination,
      };
    }
    return { success: false, data: null, message: response.data?.message || 'Error al obtener fiscales.' };
  } catch (error: any) {
    return handleError(error);
  }
}

// ── Fiscal's Censuses (SUPERVISOR drill-down) ───────────────────────

export async function getCensusTableFiscalCensos(
  fiscalId: string,
  params?: CensusTableParams
): Promise<CensusTableResponse<CensusRecordRow>> {
  try {
    const query = buildQueryString(params);
    const response = await apiConnection.get(`/census/table/my-fiscales/${fiscalId}/censos${query}`);
    if (response.data?.success) {
      return {
        success: true,
        data: response.data.censos ?? null,
        pagination: response.data.pagination,
      };
    }
    return { success: false, data: null, message: response.data?.message || 'Error al obtener censos del fiscal.' };
  } catch (error: any) {
    return handleError(error);
  }
}

// ── My Coordinated Group (COORDINATOR) ─────────────────────────────

export async function getCensusTableMyCoordinatedGroup(
  params?: CensusTableParams
): Promise<CensusTableResponse<FiscalWithStats>> {
  try {
    const query = buildQueryString(params);
    const response = await apiConnection.get(`/census/table/my-coordinated-group${query}`);
    if (response.data?.success) {
      return {
        success: true,
        data: response.data.fiscales ?? null,
        pagination: response.data.pagination,
      };
    }
    return { success: false, data: null, message: response.data?.message || 'Error al obtener grupo coordinado.' };
  } catch (error: any) {
    return handleError(error);
  }
}

// ── Group Fiscal Censuses (COORDINATOR drill-down) ──────────────────

export async function getCensusTableGroupFiscalCensos(
  fiscalId: string,
  params?: CensusTableParams
): Promise<CensusTableResponse<CensusRecordRow>> {
  try {
    const query = buildQueryString(params);
    const response = await apiConnection.get(`/census/table/my-coordinated-group/${fiscalId}/censos${query}`);
    if (response.data?.success) {
      return {
        success: true,
        data: response.data.censos ?? null,
        pagination: response.data.pagination,
      };
    }
    return { success: false, data: null, message: response.data?.message || 'Error al obtener censos del grupo.' };
  } catch (error: any) {
    return handleError(error);
  }
}

// ── Coordinations (ADMIN) ──────────────────────────────────────────

export async function getCensusTableCoordinations(
  params?: CensusTableParams
): Promise<CensusTableResponse<UnitWithStats>> {
  try {
    const query = buildQueryString(params);
    const response = await apiConnection.get(`/census/table/coordinations${query}`);
    if (response.data?.success) {
      return {
        success: true,
        data: response.data.units ?? null,
        pagination: response.data.pagination,
      };
    }
    return { success: false, data: null, message: response.data?.message || 'Error al obtener coordinaciones.' };
  } catch (error: any) {
    return handleError(error);
  }
}

// ── Coordinacion Fiscales (ADMIN drill-down level 1) ───────────────

export async function getCensusTableCoordinacionFiscales(
  groupId: string,
  params?: CensusTableParams
): Promise<CensusTableResponse<FiscalWithStats>> {
  try {
    const query = buildQueryString(params);
    const response = await apiConnection.get(`/census/table/coordinations/${groupId}/fiscales${query}`);
    if (response.data?.success) {
      return {
        success: true,
        data: response.data.fiscales ?? null,
        pagination: response.data.pagination,
      };
    }
    return { success: false, data: null, message: response.data?.message || 'Error al obtener fiscales de la coordinación.' };
  } catch (error: any) {
    return handleError(error);
  }
}

// ── Coordinacion Fiscal Censuses (ADMIN drill-down level 2) ────────

export async function getCensusTableCoordinacionFiscalCensos(
  groupId: string,
  fiscalId: string,
  params?: CensusTableParams
): Promise<CensusTableResponse<CensusRecordRow>> {
  try {
    const query = buildQueryString(params);
    const response = await apiConnection.get(
      `/census/table/coordinations/${groupId}/fiscales/${fiscalId}/censos${query}`
    );
    if (response.data?.success) {
      return {
        success: true,
        data: response.data.censos ?? null,
        pagination: response.data.pagination,
      };
    }
    return { success: false, data: null, message: response.data?.message || 'Error al obtener censos.' };
  } catch (error: any) {
    return handleError(error);
  }
}

// ── Complete Census Record (FISCAL) ───────────────────────────────

export interface CompleteCensusInput {
  commercial_name?: string;
  activity_type?: string;
  billing_method?: 'MANUAL' | 'ELECTRONICA' | 'MIXTA';
  employee_count?: number;
  has_fiscal_machine?: boolean;
  has_homologated_system?: boolean;
  homologated_system_name?: string;
  admin_unit_id?: string;
}

export async function completeCensusRecord(
  id: string,
  data: CompleteCensusInput
): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await apiConnection.patch(`/census/${id}/complete`, data);
    if (response.data?.success) {
      return { success: true, data: response.data.data };
    }
    return { success: false, message: response.data?.message || 'Error al guardar censo.' };
  } catch (error: any) {
    return handleError(error);
  }
}

// ── Verify Census Record ────────────────────────────────────────────

export async function verifyCensusRecord(
  id: string
): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await apiConnection.put(`/census/${id}/verify`);
    if (response.data?.success) {
      return { success: true, data: response.data.data };
    }
    return { success: false, message: response.data?.message || 'Error al verificar censo.' };
  } catch (error: any) {
    return handleError(error);
  }
}
