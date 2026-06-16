import { listRepairReportsResumen } from '@/components/utils/api/fiscal-operaciones-functions';
import type { ActasListResponse } from './types';

export type FetchActasReparoParams = {
    q?: string;
    page?: number;
    pageSize?: number;
};

/**
 * Wrapper del endpoint `listRepairReportsResumen` para el tab de Actas.
 *
 * Limitaciones documentadas:
 * - El endpoint expone un hard-cap (`limit=250`); cuando el conteo retornado
 *   alcanza ese límite la página debe mostrar el banner "Mostrando hasta 250
 *   actas" (ver guía §3.3.1). Se delega a la UI detectar el cap.
 * - El endpoint actual no expone `total`; `total` se aproxima al largo del
 *   array recibido. Cuando el backend publique el conteo real, este wrapper
 *   lo propaga sin tocar la UI.
 */
export async function fetchActasReparo(
    params: FetchActasReparoParams,
): Promise<ActasListResponse> {
    const pageSize = params.pageSize ?? 250;
    const data = await listRepairReportsResumen({
        q: params.q?.trim() || undefined,
        limit: pageSize,
    });
    const items = data.items ?? [];
    return {
        items,
        page: params.page ?? 1,
        pageSize,
        // El backend aún no expone el total real. Aproximamos al largo del
        // array recibido; cuando se añada el conteo, se devuelve aquí sin
        // tocar la firma.
        total: items.length,
    };
}
