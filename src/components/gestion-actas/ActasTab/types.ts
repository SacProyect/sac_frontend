// Re-exporta el tipo del API para no acoplar el código del tab al path interno
// del módulo `fiscal-operaciones-functions`. Si el backend renombra el shape,
// el cambio queda contenido en `api.ts`.
import type { RepairReportResumenItem } from '@/components/utils/api/fiscal-operaciones-functions';

/** Una fila de la tabla de Actas de Reparo (alias semántico local). */
export type ActaReparo = RepairReportResumenItem;

/** Estado del buscador y paginación del tab. */
export type ActasFilterState = {
    q: string;
    page: number;
    pageSize: number;
};

/** Respuesta normalizada del wrapper de API para el tab. */
export type ActasListResponse = {
    items: ActaReparo[];
    /** Total reportado por el backend; `undefined` cuando el endpoint aún no lo expone. */
    total?: number;
    page: number;
    pageSize: number;
};

/* -------------------------------------------------------------------------- */
/* TASK-004b — filtros avanzados del drawer lateral                          */
/* -------------------------------------------------------------------------- */

/** Tipos de impuesto aceptados por la plantilla de actas. */
export type ImpuestoTipo = 'IVA-ISLR' | 'ISLR' | 'IVA';

/** Estado de vinculación visible en la tabla. */
export type EstadoVinculado = 'VINCULADO' | 'PENDIENTE';

/**
 * Filtros estructurados que se aplican sobre la lista client-side.
 *
 * El endpoint `listRepairReportsResumen` actual solo acepta `q` y `limit`, por
 * lo que estos filtros se evalúan en el navegador sobre el array recibido. Si
 * en el futuro el backend expone filtros server-side, este shape se puede
 * mapear 1-a-1 a query params sin tocar la UI.
 */
export type ActasAdvancedFilters = {
    fechaEntregaDesde: string; // YYYY-MM-DD o ''
    fechaEntregaHasta: string;
    impuestoTipo: '' | ImpuestoTipo;
    fiscalUserId: string;
    fiscalName: string;
    supervisorUserId: string;
    supervisorName: string;
    estado: '' | EstadoVinculado;
};

export const defaultActasAdvancedFilters: ActasAdvancedFilters = {
    fechaEntregaDesde: '',
    fechaEntregaHasta: '',
    impuestoTipo: '',
    fiscalUserId: '',
    fiscalName: '',
    supervisorUserId: '',
    supervisorName: '',
    estado: '',
};
