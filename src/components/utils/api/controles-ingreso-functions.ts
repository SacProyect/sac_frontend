import { apiConnection } from "./api-connection";
import type {
  ControlIngreso,
  ControlIngresoTemplate,
  ControlIngresoAssignee,
  ControlIngresoDocument,
  ControlIngresoAuditLog,
  ControlesIngresoStats,
  ControlIngresoStatus,
  Coordinacion,
} from "@/types/controles-ingreso";

const BASE = "/controles-de-ingreso";

// ── Types de payload ─────────────────────────────────────────────────────────

export type CreateControlPayload = {
  coordination_id: Coordinacion;
  template_id?: string;
  taxpayer_id?: string | null;
  subject_name: string;
  subject_rif: string;
  subject_address: string;
  subject_parish_id?: string;
  start_date: string;
  notes?: string | null;
};

export type UpdateControlPayload = Partial<CreateControlPayload> & {
  end_date?: string | null;
  issue_date?: string | null;
  status?: ControlIngresoStatus;
};

export type ListControlesQuery = {
  status?: ControlIngresoStatus;
  coordination_id?: Coordinacion;
  q?: string;
  page?: number;
  pageSize?: number;
};

export type AddAssigneesPayload = {
  assignees: Array<{
    full_name: string;
    identity_document: string;
    role_name: string;
    position?: string | null;
    is_manual?: boolean;
  }>;
};

export type ReorderAssigneesPayload = {
  assignee_ids: string[];
};

// ── Funciones API ────────────────────────────────────────────────────────────

/** Listar controles con filtros */
export async function listControles(query: ListControlesQuery = {}) {
  const params: Record<string, any> = {};
  if (query.status) params.status = query.status;
  if (query.coordination_id) params.coordination_id = query.coordination_id;
  if (query.q) params.q = query.q;
  if (query.page) params.page = query.page;
  if (query.pageSize) params.pageSize = query.pageSize;

  const response = await apiConnection.get(BASE, { params });
  return response.data;
}

/** Obtener estadísticas del dashboard */
export async function getControlesStats() {
  const response = await apiConnection.get(`${BASE}/stats`);
  return response.data;
}

/** Listar plantillas activas */
export async function listTemplates(coordinationId?: Coordinacion) {
  const params: Record<string, any> = {};
  if (coordinationId) params.coordination_id = coordinationId;

  const response = await apiConnection.get(`${BASE}/templates`, { params });
  return response.data;
}

/** Obtener control por ID */
export async function getControlById(id: string) {
  const response = await apiConnection.get(`${BASE}/${id}`);
  return response.data;
}

/** Crear nuevo control */
export async function createControl(payload: CreateControlPayload) {
  const response = await apiConnection.post(BASE, payload);
  return response.data;
}

/** Actualizar control */
export async function updateControl(id: string, payload: UpdateControlPayload) {
  const response = await apiConnection.patch(`${BASE}/${id}`, payload);
  return response.data;
}

/** Agregar fiscales asignados */
export async function addAssignees(controlId: string, payload: AddAssigneesPayload) {
  const response = await apiConnection.post(`${BASE}/${controlId}/assignees`, payload);
  return response.data;
}

/** Quitar fiscal asignado */
export async function removeAssignee(controlId: string, assigneeId: string) {
  const response = await apiConnection.delete(`${BASE}/${controlId}/assignees/${assigneeId}`);
  return response.data;
}

/** Reordenar fiscales asignados */
export async function reorderAssignees(controlId: string, payload: ReorderAssigneesPayload) {
  const response = await apiConnection.patch(`${BASE}/${controlId}/assignees/reorder`, payload);
  return response.data;
}

/** Generar documento desde plantilla */
export async function generateDocument(controlId: string, templateId?: string) {
  const response = await apiConnection.post(`${BASE}/${controlId}/generate-document`, {
    template_id: templateId,
  });
  return response.data;
}

/** Obtener URL de descarga del documento en formato DOCX o PDF */
export async function getDocumentDownloadUrl(controlId: string, format: 'docx' | 'pdf') {
  const response = await apiConnection.get(`${BASE}/${controlId}/download-url`, {
    params: { format },
  });
  return response.data;
}

/** Obtener logs de auditoría */
export async function getAuditLogs(controlId: string) {
  const response = await apiConnection.get(`${BASE}/${controlId}/audit-logs`);
  return response.data;
}