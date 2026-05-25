import { apiConnection } from "./api-connection";
import type {
  DocumentItem,
  DocumentScope,
  DocumentTab,
  ListDocumentsResponse,
  DocumentDetailResponse,
  DownloadResponse,
  FiscalGroupListResponse,
} from "@/types/documents";

const BASE = "/documentos";

export interface ListDocumentsQuery {
  tab?: DocumentTab;
  q?: string;
  tipo?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  pageSize?: number;
}

export async function listDocuments(query: ListDocumentsQuery = {}): Promise<ListDocumentsResponse> {
  const params: Record<string, string> = {};
  if (query.tab) params.tab = query.tab;
  if (query.q) params.q = query.q;
  if (query.tipo) params.tipo = query.tipo;
  if (query.desde) params.desde = query.desde;
  if (query.hasta) params.hasta = query.hasta;
  if (query.page) params.page = String(query.page);
  if (query.pageSize) params.pageSize = String(query.pageSize);

  const response = await apiConnection.get(BASE, { params });
  return response.data;
}

export async function uploadDocument(
  file: File,
  name: string,
  scope: DocumentScope,
  fiscalGroupIds?: string[],
): Promise<{ success: boolean; data: DocumentItem }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", name);
  formData.append("scope", scope);
  if (fiscalGroupIds?.length) {
    fiscalGroupIds.forEach((id) => formData.append("fiscalGroupIds[]", id));
  }

  const response = await apiConnection.post(BASE, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function getDocumentDetail(id: string): Promise<DocumentDetailResponse> {
  const response = await apiConnection.get(`${BASE}/${id}`);
  return response.data;
}

export async function deleteDocument(id: string): Promise<{ success: boolean; data: DocumentItem }> {
  const response = await apiConnection.delete(`${BASE}/${id}`);
  return response.data;
}

export async function downloadDocument(id: string): Promise<DownloadResponse> {
  const response = await apiConnection.get(`${BASE}/${id}/download`);
  return response.data;
}

export async function changeDocumentScope(id: string, scope: DocumentScope): Promise<{ success: boolean; data: DocumentItem }> {
  const response = await apiConnection.patch(`${BASE}/${id}/scope`, { scope });
  return response.data;
}

export async function shareDocumentWith(id: string, fiscalGroupIds: string[]): Promise<{ success: boolean; data: DocumentItem }> {
  const response = await apiConnection.post(`${BASE}/${id}/share`, { fiscalGroupIds });
  return response.data;
}

export async function unshareDocumentFrom(id: string, fiscalGroupId: string): Promise<{ success: boolean; data: DocumentItem }> {
  const response = await apiConnection.delete(`${BASE}/${id}/share/${fiscalGroupId}`);
  return response.data;
}

export async function listFiscalGroups(): Promise<FiscalGroupListResponse> {
  const response = await apiConnection.get(`${BASE}/groups`);
  return response.data;
}

// Helper para formatear tamaño de archivo
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Helper para obtener nombre legible del scope
export function getScopeLabel(scope: DocumentScope): string {
  const labels: Record<DocumentScope, string> = {
    PRIVATE: "Privado",
    SHARED: "Compartido",
  };
  return labels[scope];
}

// Helper para obtener el ícono según el mime type
export function getFileIcon(mimeType: string): string {
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊";
  if (mimeType.includes("image")) return "🖼️";
  if (mimeType.includes("text")) return "📃";
  return "📁";
}
