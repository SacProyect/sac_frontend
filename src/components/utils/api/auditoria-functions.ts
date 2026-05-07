import { apiConnection } from "./api-connection";
import type { AuditoriaListResponse } from "@/types/auditoria";

export type GetAuditoriaParams = {
  page?: number;
  limit?: number;
  entidad?: string;
  accion?: string;
  actorId?: string;
  entidadId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export async function getAuditoria(
  params: GetAuditoriaParams = {},
): Promise<AuditoriaListResponse> {
  const response = await apiConnection.get<AuditoriaListResponse>("/auditoria", {
    params: {
      page: params.page,
      limit: params.limit,
      entidad: params.entidad || undefined,
      accion: params.accion || undefined,
      actorId: params.actorId || undefined,
      entidadId: params.entidadId || undefined,
      dateFrom: params.dateFrom || undefined,
      dateTo: params.dateTo || undefined,
    },
  });
  return response.data;
}
