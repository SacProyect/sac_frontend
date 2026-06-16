// Re-exports de los tipos del API + alias semánticos locales.
//
// Si el backend renombra el shape de `CasosPorFiscalRow` o el response, el
// cambio queda contenido en este archivo (ver §3.3.1 de la guía).

import type {
    CasosPorFiscalReportJson,
    CasosPorFiscalRow,
} from '@/components/utils/api/fiscal-operaciones-functions';

/** Una fila de la tabla de Control de Expedientes (alias semántico local). */
export type ExpedienteRow = CasosPorFiscalRow;

/** Response JSON normalizado del endpoint `getCasosPorFiscalReport`. */
export type ExpedientesReport = CasosPorFiscalReportJson;

/** Modo de vista del tab `expedientes` (persistido en localStorage). */
export type ExpedientesViewMode = 'cards' | 'table';

/** Estado de filtros del tab (referencia, no todos los campos son
 *  persistidos: `view` sí, `q` no por ser efímero). */
export type ExpedientesFilterState = {
    year: number;
    q: string;
    view: ExpedientesViewMode;
    page: number;
    pageSize: number;
};
