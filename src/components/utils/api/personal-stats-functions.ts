import { apiConnection } from "./api-connection";

export type StatsPeriodo = "dia" | "semana" | "mes" | "trimestre" | "anio";

export interface PersonalGestionStatsResponse {
    success: boolean;
    fiscal: {
        id: string;
        name: string;
        personId: number;
        activo: boolean;
    };
    periodo: {
        tipo: StatsPeriodo;
        from: string;
        to: string;
    };
    operativos: {
        vdf: number;
        actasReparo: number;
    };
    contribuyentesAtendidos: {
        ordinarios: number;
        especiales: number;
        sinClasificar: number;
        totalDistintos: number;
    };
    visitas: {
        total: number | null;
        servicioExternoConfigurado: boolean;
    };
}

/** Respuesta de GET /personal/stats/resumen-global (solo ADMIN). */
export interface PersonalGestionResumenGlobalResponse {
    success: boolean;
    alcance: "global";
    fiscalesActivos: number;
    periodo: {
        tipo: StatsPeriodo;
        from: string;
        to: string;
    };
    operativos: {
        vdf: number;
        actasReparo: number;
    };
    contribuyentesAtendidos: {
        ordinarios: number;
        especiales: number;
        sinClasificar: number;
        totalDistintos: number;
    };
    visitas: {
        total: number | null;
        servicioExternoConfigurado: boolean;
        agregacion: "suma_por_fiscal";
        fiscalesConsultados: number;
        fiscalesConConteoVisitas: number;
        fiscalesSinConteoVisitas: number;
    };
}

export type PersonalPanelStats = PersonalGestionStatsResponse | PersonalGestionResumenGlobalResponse;

export function isResumenGlobalStats(s: PersonalPanelStats | null): s is PersonalGestionResumenGlobalResponse {
    return Boolean(s && "alcance" in s && s.alcance === "global");
}

export async function getPersonalGestionStats(params: {
    fiscalId: string;
    periodo: StatsPeriodo;
    referenceDate?: string;
}) {
    const res = await apiConnection.get<PersonalGestionStatsResponse>(`/personal/stats/${params.fiscalId}`, {
        params: {
            periodo: params.periodo,
            ...(params.referenceDate ? { referenceDate: params.referenceDate } : {}),
        },
    });
    return res.data;
}

export async function getPersonalGestionResumenGlobal(params: {
    periodo: StatsPeriodo;
    referenceDate?: string;
}) {
    const res = await apiConnection.get<PersonalGestionResumenGlobalResponse>(`/personal/stats/resumen-global`, {
        params: {
            periodo: params.periodo,
            ...(params.referenceDate ? { referenceDate: params.referenceDate } : {}),
        },
    });
    return res.data;
}
