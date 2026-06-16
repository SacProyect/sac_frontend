export interface Entidad {
    id: number;
    rif: string;
    razon_social: string;
    gerencia_dependencia: string | null;
    parroquia: string | null;
    municipio: string | null;
    estado: string | null;
    tipo_contribuyente: string | null;
    situacion: string | null;
    flag_rif_vencido: string | null;
    estado_rif: string | null;
    telefono: string | null;
    actividad_economica: string | null;
    correo: string | null;
    observacion: string | null;
    tiene_maquina_fiscal: string | null;
    tipo_facturacion: string | null;
    abierto_cerrado: string | null;
    created_at: string;
    updated_at: string;
}

export type CreateEntidadPayload = Pick<Entidad, "rif" | "razon_social"> & Partial<Omit<Entidad, "id" | "rif" | "razon_social" | "created_at" | "updated_at">>;

export type UpdateEntidadPayload = Partial<CreateEntidadPayload>;

export interface EntidadFilters {
    search?: string;
    rif?: string;
    razon_social?: string;
    parroquia?: string;
    municipio?: string;
    estado?: string;
    situacion?: string;
    tipo_contribuyente?: string;
    estado_rif?: string;
    tiene_maquina_fiscal?: string;
    tipo_facturacion?: string;
    abierto_cerrado?: string;
    pending_enrichment?: boolean;
    page?: number;
    limit?: number;
}

export interface EntidadPaginatedResponse {
    success: boolean;
    data: Entidad[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface EntidadImportResponse {
    success: boolean;
    data: {
        imported: number;
        totalRows: number;
        skipped: number;
        errors: Array<{ row: number; reason: string }>;
    };
}

export interface EnrichmentNextResponse {
    data: Entidad | null;
    total_pending: number;
    completed: number;
}
