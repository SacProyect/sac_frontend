import axios, { AxiosError } from "axios";
import { apiConnection } from "./api-connection";
import { isNotificationsFeatureEnabled } from "@/config/feature-flags";
import {
  DefaultThreshold,
  EscalationConfig,
  EscalationConfigInput,
  NotificationItem,
  NotificationsPage,
  NotificationThreshold,
  ProcedureType,
  UnreadCountResponse,
} from "@/types/notifications";

interface NotificationsApiResponse {
  notifications?: NotificationItem[];
  data?: NotificationItem[];
  items?: NotificationItem[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

interface ApiErrorPayload {
  message?: string;
  error?: string;
}

const normalizeApiError = (error: unknown, defaultMessage: string): Error => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorPayload>;
    const message =
      axiosError.response?.data?.message ??
      axiosError.response?.data?.error ??
      axiosError.message ??
      defaultMessage;
    return new Error(message);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(defaultMessage);
};

const normalizeNotificationsPage = (
  payload: NotificationsApiResponse,
  page: number,
  limit: number
): NotificationsPage => {
  const pagination = payload.pagination;
  const resolvedPage = pagination?.page ?? payload.page ?? page;
  const resolvedLimit = pagination?.limit ?? payload.limit ?? limit;
  const resolvedTotal = pagination?.total ?? payload.total ?? 0;
  const resolvedTotalPages = pagination?.pages ?? payload.totalPages ?? 1;

  return {
    items: payload.notifications ?? payload.items ?? payload.data ?? [],
    page: resolvedPage,
    limit: resolvedLimit,
    total: resolvedTotal,
    totalPages: resolvedTotalPages,
  };
};

export const getNotifications = async (
  page = 1,
  limit = 20
): Promise<NotificationsPage> => {
  if (!isNotificationsFeatureEnabled) {
    return normalizeNotificationsPage({}, page, limit);
  }

  try {
    const response = await apiConnection.get<NotificationsApiResponse>("/notifications", {
      params: { page, limit },
    });

    return normalizeNotificationsPage(response.data, page, limit);
  } catch (error) {
    throw normalizeApiError(error, "No se pudieron obtener las notificaciones.");
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  if (!isNotificationsFeatureEnabled) {
    return;
  }

  try {
    await apiConnection.patch(`/notifications/${notificationId}/read`);
  } catch (error) {
    throw normalizeApiError(error, "No se pudo marcar la notificación como leída.");
  }
};

export const getUnreadNotificationsCount = async (): Promise<number> => {
  if (!isNotificationsFeatureEnabled) {
    return 0;
  }

  try {
    const response = await apiConnection.get<UnreadCountResponse>("/notifications/unread-count");
    return response.data.count ?? 0;
  } catch (error) {
    throw normalizeApiError(error, "No se pudo obtener el contador de no leídas.");
  }
};

export const createNotificationThreshold = async (
  payload: NotificationThreshold
): Promise<NotificationThreshold> => {
  if (!isNotificationsFeatureEnabled) {
    return payload;
  }

  try {
    const response = await apiConnection.post<NotificationThreshold>("/notifications/threshold", payload);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, "No se pudo crear el umbral de notificación.");
  }
};

export const getNotificationThreshold = async (
  procedureType: ProcedureType
): Promise<NotificationThreshold | null> => {
  if (!isNotificationsFeatureEnabled) {
    return null;
  }

  try {
    const response = await apiConnection.get<NotificationThreshold>(
      `/notifications/threshold/${procedureType}`
    );
    return response.data ?? null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw normalizeApiError(error, "No se pudo obtener el umbral de notificación.");
  }
};

export const updateDefaultNotificationThreshold = async (
  payload: DefaultThreshold
): Promise<DefaultThreshold> => {
  if (!isNotificationsFeatureEnabled) {
    return payload;
  }

  try {
    const response = await apiConnection.put<DefaultThreshold>(
      "/notifications/threshold/default",
      payload
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, "No se pudo actualizar el umbral por defecto.");
  }
};

export const getDefaultNotificationThreshold = async (): Promise<DefaultThreshold | null> => {
  if (!isNotificationsFeatureEnabled) {
    return null;
  }

  try {
    const response = await apiConnection.get<DefaultThreshold>("/notifications/threshold/default");
    return response.data ?? null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw normalizeApiError(error, "No se pudo obtener el umbral por defecto.");
  }
};

export const getEscalationConfigs = async (): Promise<EscalationConfig[]> => {
  if (!isNotificationsFeatureEnabled) {
    return [];
  }

  try {
    const response = await apiConnection.get<EscalationConfig[]>(
      "/notifications/escalation-config"
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    throw normalizeApiError(error, "No se pudieron obtener las configuraciones de escalamiento.");
  }
};

export const updateEscalationConfig = async (
  procedureType: ProcedureType,
  payload: EscalationConfigInput
): Promise<EscalationConfig> => {
  if (!isNotificationsFeatureEnabled) {
    return {
      procedureType,
      escalationDays: payload.escalationDays,
      notifyRole: payload.notifyRole,
    };
  }

  try {
    const response = await apiConnection.put<EscalationConfig>(
      `/notifications/escalation-config/${procedureType}`,
      payload
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, "No se pudo actualizar la configuración de escalamiento.");
  }
};
