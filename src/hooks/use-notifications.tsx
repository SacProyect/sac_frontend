import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
} from "@/components/utils/api/notifications-functions";
import {
  MaintenanceAlertPayload,
  MaintenanceStartPayload,
  NotificationItem,
  NotificationsPage,
  NotificationStatus,
  NotificationType,
  SocketConnectionStatus,
} from "@/types/notifications";

interface NotificationsContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  connectionStatus: SocketConnectionStatus;
  maintenanceAlert: MaintenanceAlertPayload | null;
  maintenanceStart: MaintenanceStartPayload | null;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  isLoadingPage: boolean;
  pageError: string | null;
  loadPage: (page?: number, limit?: number) => Promise<void>;
  refreshUnread: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  clearMaintenanceAlert: () => void;
  clearMaintenanceStart: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const DEFAULT_POLLING_MS = 30000;

const getSocketUrl = (): string => {
  return (
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:3000"
  );
};

const sortByDateDesc = (items: NotificationItem[]): NotificationItem[] => {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

const mergeNotifications = (
  current: NotificationItem[],
  incoming: NotificationItem[]
): NotificationItem[] => {
  const map = new Map<string, NotificationItem>();

  for (const item of current) {
    map.set(item.id, item);
  }

  for (const item of incoming) {
    map.set(item.id, item);
  }

  return sortByDateDesc(Array.from(map.values()));
};

const updateReadStatus = (
  current: NotificationItem[],
  notificationId: string
): NotificationItem[] => {
  return current.map((item) => {
    if (item.id !== notificationId) {
      return item;
    }

    return {
      ...item,
      status: NotificationStatus.CONFIRMED,
      readAt: item.readAt ?? new Date().toISOString(),
    };
  });
};
const normalizeNotificationPayload = (payload: unknown): NotificationItem | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const raw = payload as Record<string, unknown>;
  const source = (raw.notification as Record<string, unknown> | undefined) ?? raw;
  const id = source.id;
  const title = source.title;
  const message = source.message;
  const createdAt = source.createdAt;

  if (
    typeof id !== "string" ||
    typeof message !== "string" ||
    typeof createdAt !== "string"
  ) {
    return null;
  }

  const resolvedTitle =
    typeof title === "string" && title.trim().length > 0
      ? title
      : typeof source.type === "string"
        ? source.type
        : "Nueva notificacion";

  return {
    id,
    title: resolvedTitle,
    message,
    createdAt,
    type: typeof source.type === "string" ? source.type : "GENERAL",
    channel: typeof source.channel === "string" ? source.channel : "IN_APP",
    status: typeof source.status === "string" ? source.status : "SENT",
    readAt: typeof source.readAt === "string" ? source.readAt : null,
    metadata:
      source.metadata && typeof source.metadata === "object"
        ? (source.metadata as Record<string, unknown>)
        : null,
  };
};

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<SocketConnectionStatus>("idle");
  const [maintenanceAlert, setMaintenanceAlert] = useState<MaintenanceAlertPayload | null>(null);
  const [maintenanceStart, setMaintenanceStart] = useState<MaintenanceStartPayload | null>(null);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const pollingRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current !== null) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const switch_lang_title = (title: string) => {
    switch (title) {
      case NotificationType.ESCALATION_NEW_CONTRIBUTOR:
        return "Nueva Contribución";
    case NotificationType.ESCALATION_NEW_FINE:
      return "Nueva Multa Emitida";
    case NotificationType.MAINTENANCE_ALERT:
      return "Alerta de Mantenimiento";
    case NotificationType.MAINTENANCE_START:
      return "Mantenimiento Iniciado";
    default:
      return title;
    }
  };
  const switch_lang = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ESCALATION_NEW_CONTRIBUTOR:
        return "Nueva contribución";
    case NotificationType.ESCALATION_NEW_FINE:
      return "Nueva multa";
    case NotificationType.MAINTENANCE_ALERT:
      return "Mantenimiento programado";
    case NotificationType.MAINTENANCE_START:
      return "Mantenimiento en curso";
    default:
      return "Nueva notificación";
    }
  };
  const refreshUnread = useCallback(async () => {
    try {
      const unread = await getUnreadNotificationsCount();
      setUnreadCount(unread);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al actualizar no leídas.";
      setPageError(message);
    }
  }, []);

  const applyPageData = useCallback((result: NotificationsPage) => {
    setNotifications((current) => mergeNotifications(current, result.items));
    setPage(result.page);
    setLimit(result.limit);
    setTotal(result.total);
    setTotalPages(result.totalPages);
  }, []);

  const loadPage = useCallback(
    async (nextPage = DEFAULT_PAGE, nextLimit = DEFAULT_LIMIT) => {
      setIsLoadingPage(true);
      setPageError(null);
      try {
        const result = await getNotifications(nextPage, nextLimit);
        applyPageData(result);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudo cargar la bandeja de notificaciones.";
        setPageError(message);
      } finally {
        setIsLoadingPage(false);
      }
    },
    [applyPageData]
  );

  const startPollingFallback = useCallback(() => {
    if (pollingRef.current !== null) {
      return;
    }

    setConnectionStatus("fallback_polling");
    pollingRef.current = window.setInterval(() => {
      void refreshUnread();
      void loadPage(page, limit);
    }, DEFAULT_POLLING_MS);
  }, [limit, loadPage, page, refreshUnread]);

  const stopSocket = useCallback(() => {
    const socket = socketRef.current;
    if (socket) {
      socket.off("notification:new");
      socket.off("maintenance:alert");
      socket.off("maintenance:start");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.disconnect();
    }
    socketRef.current = null;
  }, []);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      await markNotificationAsRead(notificationId);
      setNotifications((current) => updateReadStatus(current, notificationId));
      setUnreadCount((current) => Math.max(0, current - 1));
    },
    []
  );

  const startSocket = useCallback(() => {
    if (!token || socketRef.current) {
      return;
    }

    setConnectionStatus("connecting");

    const socket = io(getSocketUrl(), {
      transports: ["websocket","polling"],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socket.on("connect", () => {
      setConnectionStatus("connected");
      stopPolling();
      void refreshUnread();
      void loadPage(DEFAULT_PAGE, DEFAULT_LIMIT);
    });

    socket.on("notification:new", (payload) => {
      const next = normalizeNotificationPayload(payload);
      if (!next) {
        return;
      }

      setNotifications((current) => mergeNotifications(current, [next]));
      if (
        next.status !== NotificationStatus.CONFIRMED &&
        next.status !== NotificationStatus.READ
      ) {
        setUnreadCount((current) => current + 1);
      }
      toast.success(switch_lang_title(next.title) || switch_lang(next.type as NotificationType) || "Nueva notificación recibida");
    });

    socket.on("maintenance:alert", (payload: MaintenanceAlertPayload) => {
      setMaintenanceAlert(payload);
      toast(payload.title ?? payload.message ?? "Mantenimiento programado");
    });

    socket.on("maintenance:start", (payload: MaintenanceStartPayload) => {
      setMaintenanceStart(payload);
      toast.error(payload.title ?? payload.message ?? "Mantenimiento en curso");
    });

    socket.on("connect_error", () => {
      setConnectionStatus("error");
      startPollingFallback();
    });

    socket.on("disconnect", () => {
      setConnectionStatus("disconnected");
      startPollingFallback();
    });

    socketRef.current = socket;
  }, [loadPage, refreshUnread, startPollingFallback, stopPolling, token]);

  useEffect(() => {
    if (!token) {
      stopSocket();
      stopPolling();
      setNotifications([]);
      setUnreadCount(0);
      setConnectionStatus("idle");
      setMaintenanceAlert(null);
      setMaintenanceStart(null);
      return;
    }

    void loadPage(DEFAULT_PAGE, DEFAULT_LIMIT);
    void refreshUnread();
    startSocket();

    return () => {
      stopSocket();
      stopPolling();
    };
  }, [loadPage, refreshUnread, startSocket, stopPolling, stopSocket, token]);

  const value = useMemo<NotificationsContextType>(
    () => ({
      notifications,
      unreadCount,
      connectionStatus,
      maintenanceAlert,
      maintenanceStart,
      page,
      limit,
      total,
      totalPages,
      isLoadingPage,
      pageError,
      loadPage,
      refreshUnread,
      markAsRead,
      clearMaintenanceAlert: () => setMaintenanceAlert(null),
      clearMaintenanceStart: () => setMaintenanceStart(null),
    }),
    [
      notifications,
      unreadCount,
      connectionStatus,
      maintenanceAlert,
      maintenanceStart,
      page,
      limit,
      total,
      totalPages,
      isLoadingPage,
      pageError,
      loadPage,
      refreshUnread,
      markAsRead,
    ]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return context;
};
