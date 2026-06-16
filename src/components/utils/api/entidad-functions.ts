import { apiConnection } from "./api-connection";
import type { Entidad, CreateEntidadPayload, UpdateEntidadPayload, EntidadFilters, EntidadPaginatedResponse, EntidadImportResponse, EnrichmentNextResponse } from "@/types/entidad";

const BASE = "/entidad";

export async function listEntidades(filters?: EntidadFilters, signal?: AbortSignal): Promise<EntidadPaginatedResponse> {
    const res = await apiConnection.get<EntidadPaginatedResponse>(BASE, { params: filters, signal });
    return res.data;
}

export async function getEntidadById(id: number): Promise<{ success: boolean; data: Entidad }> {
    const res = await apiConnection.get<{ success: boolean; data: Entidad }>(`${BASE}/${id}`);
    return res.data;
}

export async function createEntidad(data: CreateEntidadPayload): Promise<{ success: boolean; data: Entidad }> {
    const res = await apiConnection.post<{ success: boolean; data: Entidad }>(BASE, data);
    return res.data;
}

export async function updateEntidad(id: number, data: UpdateEntidadPayload): Promise<{ success: boolean; data: Entidad }> {
    const res = await apiConnection.patch<{ success: boolean; data: Entidad }>(`${BASE}/${id}`, data);
    return res.data;
}

export async function deleteEntidad(id: number): Promise<{ success: boolean; message: string }> {
    const res = await apiConnection.delete<{ success: boolean; message: string }>(`${BASE}/${id}`);
    return res.data;
}

export async function importEntidadesXlsx(file: File): Promise<EntidadImportResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiConnection.post<EntidadImportResponse>(`${BASE}/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
}

export async function exportEntidadesXlsx(filters?: EntidadFilters): Promise<void> {
    const res = await apiConnection.get(`${BASE}/export`, {
        params: filters,
        responseType: "blob",
    });
    const blob = res.data;
    if (blob.type.includes("json")) {
        const text = await blob.text();
        const json = JSON.parse(text);
        throw new Error(json.error?.message || "Error al exportar");
    }
    const cd = res.headers["content-disposition"];
    let filename = "reporte_entidades.xlsx";
    const m = /filename="([^"]+)"/i.exec(cd || "");
    if (m?.[1]) filename = m[1];
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

// ─── ENRICHMENT API ─────────────────────────────────────────

export async function getNextEnrichmentEntity(): Promise<EnrichmentNextResponse> {
    const res = await apiConnection.get<EnrichmentNextResponse>(`${BASE}/enrichment/next`);
    return res.data;
}

export async function updateEnrichmentFields(
    id: number,
    data: { tiene_maquina_fiscal?: string; tipo_facturacion?: string; abierto_cerrado?: string }
): Promise<{ success: boolean; data: Entidad }> {
    const res = await apiConnection.patch<{ success: boolean; data: Entidad }>(`${BASE}/enrichment/${id}`, data);
    return res.data;
}

export async function getEntidadParroquias(): Promise<{ success: boolean; data: string[] }> {
    const res = await apiConnection.get<{ success: boolean; data: string[] }>(`${BASE}/parroquias`);
    return res.data;
}

export async function getEntidadOrdinarioEspecialList(): Promise<{ success: boolean; data: string[] }> {
    const res = await apiConnection.get<{ success: boolean; data: string[] }>(`${BASE}/ordinario-especial-list`);
    return res.data;
}
