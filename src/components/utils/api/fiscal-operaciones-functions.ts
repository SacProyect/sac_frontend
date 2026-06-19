import axios from "axios";
import { apiConnection } from "./api-connection";
import type { RepairReportUploadMeta } from "./taxpayer-functions";

const base = "fiscal-operaciones";

export type TipoOperativoFiscal =
    | "VDF"
    | "SANCION_RESOLUCION"
    | "DESTRUCCION_FACTURAS"
    | "DIVULGACION"
    | "PRESENCIA_FISCAL"
    | "ACTA_REPARO";

export type TipoEstatusPersonal = "PERMISO" | "REPOSO" | "VACACIONES";

export interface OperativoFiscalRow {
    id: string;
    tipo: TipoOperativoFiscal;
    fecha: string;
    parishId: string | null;
    taxpayerId: string | null;
    tipoContribuyente: string | null;
    creadoPorId: string;
    coordinadorId: string | null;
    fiscalGroupId: string | null;
    operativoOrigenId: string | null;
    repairReportId: string | null;
    notas: string | null;
    detalle: unknown;
    parish?: { id: string; name: string } | null;
    taxpayer?: { id: string; name: string; rif: string; contract_type: string } | null;
    creadoPor?: { id: string; name: string; role: string };
}

export interface GestionPersonalRow {
    id: string;
    usuarioId: string;
    estatus: TipoEstatusPersonal;
    motivo: string | null;
    fechaInicio: string;
    fechaFin: string;
    coordinadorId: string;
    usuario?: { id: string; name: string; role: string; personId: number };
    coordinador?: { id: string; name: string };
}

export interface GrupoMiembro {
    id: string;
    name: string;
    role: string;
    personId: number;
}

export async function listOperativosFiscales(params: {
    dateFrom?: string;
    dateTo?: string;
    tipo?: TipoOperativoFiscal;
}) {
    const res = await apiConnection.get<{
        success: boolean;
        items: OperativoFiscalRow[];
        dateFrom: string;
        dateTo: string;
    }>(`${base}/operativos`, { params });
    return res.data;
}

/** Crea operativo ACTA_REPARO vinculado a un reporte de reparo existente. */
export interface RepairReportListItem {
    id: string;
    pdf_url: string;
    taxpayerId: string;
    vinculadoAOperativo: boolean;
}

/** Lista PDFs de reparo del contribuyente (para elegir acta al registrar ACTA_REPARO). */
export async function listRepairReportsForTaxpayer(taxpayerId: string) {
    const res = await apiConnection.get<{
        success: boolean;
        items: RepairReportListItem[];
    }>(`${base}/reparos/${taxpayerId}`);
    return res.data;
}

/** Actas de reparo visibles en el módulo (admin / coordinador). */
export interface RepairReportResumenItem {
    id: string;
    pdf_url: string;
    taxpayerId: string;
    contribuyente: string;
    rif: string;
    fiscalId: string | null;
    fiscalNombre: string | null;
    vinculadoAOperativo: boolean;
    fechaEntrega: string | null;
    fiscalActuante: string | null;
    supervisorNombre: string | null;
    fiscalActuanteUserId: string | null;
    supervisorUserId: string | null;
    fiscalGroupId: string | null;
    fiscalGroupName: string | null;
    impuestoTipo: string | null;
    numeroExpediente: string | null;
    ejercicioFiscalPeriodo: string | null;
    numeroReparo: string | null;
    fechaNotificado: string | null;
    montoIslr: number | null;
    montoIva: number | null;
    montoAceptacionPago: number | null;
    montoTotal: number | null;
    status: string;
    fechaVencimiento: string | null;
    /** El acta incluye débito fiscal (IVA sobre ventas). */
    esDebitoFiscal?: boolean;
    /** El acta incluye crédito fiscal (IVA sobre compras). */
    esCreditoFiscal?: boolean;
    /** Periodos fiscales cubiertos por el acta (ISLR). */
    periods?: Array<{ id?: string; year: number; periodo?: string | null; monto?: number | null }>;
}

export async function listRepairReportsResumen(params?: { q?: string; limit?: number; page?: number }) {
    const res = await apiConnection.get<{
        success: boolean;
        items: RepairReportResumenItem[];
        total: number;
        page: number;
        pageSize: number;
    }>(`${base}/reparos`, { params });
    return res.data;
}

/** Contribuyente encontrado para asociar un acta (vista previa). */
export interface ContribuyenteReparoBusquedaItem {
    id: string;
    name: string;
    rif: string;
    providenceNum: string;
    process: string;
    address: string;
    emition_date: string;
    contract_type: string;
    parish: { id: string; name: string } | null;
    category: { id: string; name: string } | null;
    fiscalAsignado: {
        id: string;
        name: string;
        personId: number | null;
        supervisorId: string | null;
        supervisorName: string | null;
        groupId: string | null;
        groupName: string | null;
    } | null;
    supervisorAsignado: { id: string; name: string; personId: number | null } | null;
}

/** Fiscal o supervisor seleccionable en el acta (con grupo / supervisor en cadena). */
export interface UsuarioActaReparoRow {
    id: string;
    name: string;
    personId: number;
    role: string;
    groupId: string | null;
    groupName: string | null;
    supervisorId: string | null;
    supervisorName: string | null;
}

export async function searchUsuariosParaActaReparo(params: {
    tipo: "FISCAL" | "SUPERVISOR";
    q?: string;
    limit?: number;
}) {
    const res = await apiConnection.get<{
        success: boolean;
        items: UsuarioActaReparoRow[];
    }>(`${base}/reparos/buscar-personal-acta`, {
        params: {
            tipo: params.tipo,
            q: params.q,
            limit: params.limit ?? 25,
        },
    });
    return res.data;
}

export async function searchContribuyentesParaActaReparo(params: { q: string; limit?: number }) {
    const res = await apiConnection.get<{
        success: boolean;
        items: ContribuyenteReparoBusquedaItem[];
    }>(`${base}/reparos/buscar-contribuyentes`, {
        params: { q: params.q, limit: params.limit ?? 20 },
    });
    return res.data;
}

/** Metadatos del acta (sin PDF). Solo rol ADMIN. */
export async function adminUpdateReparoActa(reportId: string, body: RepairReportUploadMeta) {
    await apiConnection.patch(`${base}/reparos/actas/${reportId}`, body);
}

/** Solo rol ADMIN. */
export async function adminDeleteReparoActa(reportId: string) {
    await apiConnection.delete(`${base}/reparos/actas/${reportId}`);
}

/** CSV UTF-8 (BOM) para Excel. */
export async function downloadRepairReportsResumenCsv(params?: { q?: string }): Promise<void> {
    const res = await apiConnection.get<Blob>(`${base}/reparos/export/csv`, {
        params,
        responseType: "blob",
    });
    const blob = res.data;
    if (blob.type.includes("json")) {
        const text = await blob.text();
        try {
            const j = JSON.parse(text) as { error?: string };
            throw new Error(j.error ?? "No se pudo generar el CSV.");
        } catch {
            throw new Error("No se pudo generar el CSV.");
        }
    }
    const cd = res.headers["content-disposition"];
    let filename = `actas-reparo.csv`;
    if (cd) {
        const m = /filename="([^"]+)"/i.exec(cd);
        if (m?.[1]) filename = m[1];
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

/** Excel (.xlsx) usando la plantilla institucional de actas de reparo (columnas A–N). */
export async function downloadRepairReportsResumenXlsx(params?: { q?: string }): Promise<void> {
    const res = await apiConnection.get<Blob>(`${base}/reparos/export/xlsx`, {
        params,
        responseType: "blob",
    });
    const blob = res.data;
    if (blob.type.includes("json")) {
        const text = await blob.text();
        try {
            const j = JSON.parse(text) as { error?: string };
            throw new Error(j.error ?? "No se pudo generar el Excel.");
        } catch {
            throw new Error("No se pudo generar el Excel.");
        }
    }
    const cd = res.headers["content-disposition"];
    let filename = `actas-reparo.xlsx`;
    if (cd) {
        const m = /filename="([^"]+)"/i.exec(cd);
        if (m?.[1]) filename = m[1];
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

export async function createOperativoVincularReparo(body: {
    repairReportId: string;
    fecha?: string;
    notas?: string | null;
    operativoOrigenId?: string | null;
}) {
    const res = await apiConnection.post<{ success: boolean; item: OperativoFiscalRow }>(
        `${base}/operativos/vincular-reparo`,
        body,
    );
    return res.data;
}

export async function createOperativoFiscal(body: {
    tipo: TipoOperativoFiscal;
    fecha?: string;
    parishId?: string | null;
    taxpayerId?: string | null;
    tipoContribuyente?: "SPECIAL" | "ORDINARY" | null;
    operativoOrigenId?: string | null;
    repairReportId?: string | null;
    notas?: string | null;
    detalle?: Record<string, unknown> | null;
}) {
    const res = await apiConnection.post<{ success: boolean; item: OperativoFiscalRow }>(
        `${base}/operativos`,
        body,
    );
    return res.data;
}

export async function listGestionPersonal(params: { dateFrom?: string; dateTo?: string }) {
    const res = await apiConnection.get<{
        success: boolean;
        items: GestionPersonalRow[];
        dateFrom: string;
        dateTo: string;
    }>(`${base}/personal`, { params });
    return res.data;
}

export async function createGestionPersonal(body: {
    usuarioId: string;
    estatus: TipoEstatusPersonal;
    motivo?: string | null;
    fechaInicio: string;
    fechaFin: string;
    coordinadorId: string;
}) {
    const res = await apiConnection.post<{ success: boolean; item: GestionPersonalRow }>(
        `${base}/personal`,
        body,
    );
    return res.data;
}

export async function listFormularioMiembros(params?: { coordinatorId?: string }) {
    const res = await apiConnection.get<{ success: boolean; members: GrupoMiembro[] }>(
        `${base}/formulario/miembros`,
        { params: params?.coordinatorId ? { coordinatorId: params.coordinatorId } : undefined },
    );
    return res.data;
}

export async function listFormularioCoordinadores() {
    const res = await apiConnection.get<{
        success: boolean;
        coordinators: { id: string; name: string; personId: number }[];
    }>(`${base}/formulario/coordinadores`);
    return res.data;
}

/** Presets alineados al backend (fase 3 — filtros temporales). */
export type PeriodPreset = "MONTH" | "QUARTER" | "HALF_YEAR" | "YEAR";

export interface DashboardResumenResponse {
    success: boolean;
    periodo: {
        preset: PeriodPreset;
        from: string;
        to: string;
    };
    operativos: {
        total: number;
        porTipo: { tipo: TipoOperativoFiscal; count: number }[];
        porTipoContribuyente: { tipoContribuyente: string | null; count: number }[];
        porParroquia: { parishId: string; parishName: string; count: number }[];
    };
    personal: {
        totalIncidencias: number;
        porEstatus: { estatus: TipoEstatusPersonal; count: number }[];
    };
}

export async function getDashboardResumen(params: {
    preset: PeriodPreset;
    referenceDate?: string;
}) {
    const res = await apiConnection.get<DashboardResumenResponse>(`${base}/dashboard/resumen`, {
        params: {
            preset: params.preset,
            ...(params.referenceDate ? { referenceDate: params.referenceDate } : {}),
        },
    });
    return res.data;
}

/** Fase 4: descarga el PDF generado en backend (mismos query que el resumen JSON). */
export async function downloadDashboardResumenPdf(params: {
    preset: PeriodPreset;
    referenceDate?: string;
}): Promise<void> {
    try {
        const res = await apiConnection.get<Blob>(`${base}/dashboard/export-pdf`, {
            params: {
                preset: params.preset,
                ...(params.referenceDate ? { referenceDate: params.referenceDate } : {}),
            },
            responseType: "blob",
        });

        const blob = res.data;
        if (blob.type.includes("json")) {
            const text = await blob.text();
            const j = JSON.parse(text) as { error?: string };
            throw new Error(j.error ?? "No se pudo generar el PDF.");
        }

        let filename = `sac-fiscalizacion-${params.preset}.pdf`;
        const cd = res.headers["content-disposition"];
        if (cd) {
            const m = /filename="([^"]+)"/i.exec(cd);
            if (m?.[1]) filename = m[1];
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch (e: unknown) {
        if (axios.isAxiosError(e) && e.response?.data instanceof Blob) {
            const t = await e.response.data.text();
            let msg = "No se pudo generar el PDF.";
            try {
                const j = JSON.parse(t) as { error?: string };
                if (j.error) msg = j.error;
            } catch {
                /* cuerpo no JSON */
            }
            throw new Error(msg);
        }
        throw e;
    }
}

export interface CasosPorFiscalRow {
    fiscalId: string;
    funcionario: string;
    cedula: string;
    nroCasos: number;
    vdfTotal: number;
    vdfCulminados: number;
    vdfEnProceso: number;
    vdfAnulados: number;
    afTotal: number;
    afPuntuales: number;
    afIntegrales: number;
    afCulmPuntuales: number;
    afCulmIntegrales: number;
    afProcPuntuales: number;
    afProcIntegrales: number;
    afAnulPuntuales: number;
    afAnulIntegrales: number;
    totalCulminados: number;
    totalEnProceso: number;
    coordinacion: number | null;
    observaciones: string;
}

export interface CasosPorFiscalReportJson {
    success: boolean;
    year: number;
    meta: {
        filtroEmision: string;
        anuladosRegla: string;
        observacionesFuente: string;
    };
    totals: Omit<CasosPorFiscalRow, "fiscalId">;
    rows: CasosPorFiscalRow[];
}

export async function getCasosPorFiscalReport(year: number) {
    const res = await apiConnection.get<CasosPorFiscalReportJson>(`${base}/reporte/casos-por-fiscal/datos`, {
        params: { year },
    });
    return res.data;
}

/** Reporte Excel alineado a la plantilla «CASOS POR FISCALES» (contribuyentes VDF/AF por fiscal). */
export async function downloadCasosPorFiscalExcel(year: number): Promise<void> {
    try {
        const res = await apiConnection.get<Blob>(`${base}/reporte/casos-por-fiscal`, {
            params: { year },
            responseType: "blob",
        });
        const blob = res.data;
        if (blob.type.includes("json")) {
            const text = await blob.text();
            const j = JSON.parse(text) as { error?: string };
            throw new Error(j.error ?? "No se pudo generar el Excel.");
        }
        let filename = `CASOS-POR-FISCALES-${year}.xlsx`;
        const cd = res.headers["content-disposition"];
        if (cd) {
            const m = /filename="([^"]+)"/i.exec(cd);
            if (m?.[1]) filename = m[1];
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch (e: unknown) {
        if (axios.isAxiosError(e) && e.response?.data instanceof Blob) {
            const t = await e.response.data.text();
            let msg = "No se pudo generar el Excel.";
            try {
                const j = JSON.parse(t) as { error?: string };
                if (j.error) msg = j.error;
            } catch {
                /* cuerpo no JSON */
            }
            throw new Error(msg);
        }
        throw e;
    }
}

/**
 * Ejecuta manualmente el check de notificaciones WhatsApp.
 * Solo ADMIN puede ejecutar esto.
 */
export async function runNotificationCheck(): Promise<{ success: boolean; message: string }> {
  const response = await apiConnection.post('/notifications/run-check');
  return response.data;
}

/**
 * Obtiene estadísticas de la cola de notificaciones.
 */
export async function getNotificationStats(): Promise<{
  total: number;
  pending: number;
  sending: number;
  sent: number;
  failed: number;
}> {
  const response = await apiConnection.get('/notifications/stats');
  return response.data.data;
}
