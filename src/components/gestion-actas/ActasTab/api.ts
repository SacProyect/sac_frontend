import { listRepairReportsResumen } from '@/components/utils/api/fiscal-operaciones-functions';
import type { ActasListResponse } from './types';

export type FetchActasReparoParams = {
    q?: string;
    page?: number;
    pageSize?: number;
};

/**
 * Wrapper del endpoint `listRepairReportsResumen` para el tab de Actas.
 */
export async function fetchActasReparo(
    params: FetchActasReparoParams,
): Promise<ActasListResponse> {
    const pageSize = params.pageSize ?? 250;
    const data = await listRepairReportsResumen({
        q: params.q?.trim() || undefined,
        limit: pageSize,
        page: params.page ?? 1,
    });
    return {
        items: data.items ?? [],
        page: params.page ?? 1,
        pageSize,
        total: data.total ?? 0,
    };
}
