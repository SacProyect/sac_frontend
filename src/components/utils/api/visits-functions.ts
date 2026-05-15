import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  DashboardAdvancedResponse,
  PaginatedResponse,
  VisitHistoryItem,
  VisitHistoryParams,
  VisitItem,
  VisitsListParams,
} from "@/types/visits";

const API_PREFIX = "/api/v1";
const visitsBaseUrl =
  import.meta.env.VITE_BASE_URL_VISITS ||
  import.meta.env.VITE_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

const visitsApiConnection = axios.create({
  baseURL: visitsBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

visitsApiConnection.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const tokenString = localStorage.getItem("authToken");
    const token: string | null = tokenString && tokenString !== "undefined" ? JSON.parse(tokenString) : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError): Promise<AxiosError> => Promise.reject(error)
);

const asData = <T>(response: any): T => {
  return (response?.data?.data ?? response?.data ?? response) as T;
};

const normalizeDashboardAdvanced = (payload: any): DashboardAdvancedResponse => {
  // Formato esperado originalmente por frontend
  if (payload?.totals && payload?.comparison) {
    return payload as DashboardAdvancedResponse;
  }

  // Formato actual del backend de visitas
  return {
    date: payload?.date ?? "",
    totals: {
      entries: Number(payload?.entradas_dia?.hoy ?? 0),
      in_waiting: Number(payload?.visitas_en_curso ?? payload?.personas_dentro?.actual ?? 0),
      finished: Number(payload?.visitas_atendidas ?? 0),
    },
    comparison: {
      vs_previous_day_pct: Number(payload?.entradas_dia?.porcentaje_cambio ?? 0),
    },
    latest_visits: Array.isArray(payload?.ultimas_actividades)
      ? payload.ultimas_actividades.map((item: any) => ({
          id: item?.id ?? "",
          contributor_name: item?.contribuyente ?? "",
          fiscal_id: 0,
          status: item?.status ?? "espera",
          entry_time: item?.entry_time ?? "",
        }))
      : [],
  };
};

export const getAdvancedVisitsDashboard = async (targetDate?: string): Promise<DashboardAdvancedResponse> => {
  try {
    const response = await visitsApiConnection.get(`${API_PREFIX}/dashboard/advanced`, {
      params: targetDate ? { target_date: targetDate } : undefined,
    });
    const payload = asData<any>(response);
    return normalizeDashboardAdvanced(payload);
  } catch (error) {
    console.error(error);
    throw new Error("No se pudieron obtener las métricas de visitas.");
  }
};

export const getVisitsList = async (params?: VisitsListParams): Promise<VisitItem[]> => {
  try {
    const response = await visitsApiConnection.get(`${API_PREFIX}/visits/`, { params });
    const payload = asData<VisitItem[] | PaginatedResponse<VisitItem>>(response);
    if (Array.isArray(payload)) return payload;
    return payload?.items ?? [];
  } catch (error) {
    console.error(error);
    throw new Error("No se pudo obtener la lista de visitas.");
  }
};

export const getVisitsHistory = async (
  params?: VisitHistoryParams
): Promise<PaginatedResponse<VisitHistoryItem>> => {
  try {
    const response = await visitsApiConnection.get(`${API_PREFIX}/visits/history`, { params });
    const payload = asData<PaginatedResponse<VisitHistoryItem> | VisitHistoryItem[]>(response);

    if (Array.isArray(payload)) {
      return {
        total: payload.length,
        skip: 0,
        limit: payload.length,
        items: payload,
      };
    }

    return {
      total: payload?.total ?? 0,
      skip: payload?.skip ?? 0,
      limit: payload?.limit ?? 0,
      items: payload?.items ?? [],
    };
  } catch (error) {
    console.error(error);
    throw new Error("No se pudo obtener el historial de visitas.");
  }
};
