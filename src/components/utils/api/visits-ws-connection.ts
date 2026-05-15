import { VisitWsEvent } from "@/types/visits";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface VisitsWsOptions {
  onEvent: (event: VisitWsEvent) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  onError?: (message: string) => void;
  reconnectDelayMs?: number;
}

const DEFAULT_RECONNECT_DELAY_MS = 3000;

const getVisitsWsUrl = (): string => {
  const envBaseUrl =
    import.meta.env.VITE_BASE_URL_VISITS ||
    import.meta.env.VITE_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000";

  const normalized = envBaseUrl.endsWith("/") ? envBaseUrl.slice(0, -1) : envBaseUrl;
  const wsBase = normalized.replace(/^http/i, "ws");
  return `${wsBase}/api/v1/ws/visits`;
};

export const createVisitsWsConnection = (options: VisitsWsOptions) => {
  let socket: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let isManuallyClosed = false;

  const setStatus = (status: ConnectionStatus) => {
    options.onStatusChange?.(status);
  };

  const clearReconnect = () => {
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const scheduleReconnect = () => {
    if (isManuallyClosed) return;
    clearReconnect();
    reconnectTimer = window.setTimeout(() => {
      connect();
    }, options.reconnectDelayMs ?? DEFAULT_RECONNECT_DELAY_MS);
  };

  const connect = () => {
    clearReconnect();
    setStatus("connecting");

    try {
      socket = new WebSocket(getVisitsWsUrl());
    } catch (error) {
      setStatus("error");
      options.onError?.("No se pudo inicializar el websocket de visitas.");
      scheduleReconnect();
      return;
    }

    socket.onopen = () => {
      setStatus("connected");
    };

    socket.onmessage = (message) => {
      try {
        const parsed = JSON.parse(message.data) as VisitWsEvent;
        if (!parsed?.type) return;
        options.onEvent(parsed);
      } catch (_error) {
        options.onError?.("Se recibió un evento inválido del websocket.");
      }
    };

    socket.onerror = () => {
      setStatus("error");
      options.onError?.("Error en la conexión websocket de visitas.");
    };

    socket.onclose = () => {
      setStatus("disconnected");
      scheduleReconnect();
    };
  };

  const disconnect = () => {
    isManuallyClosed = true;
    clearReconnect();
    if (socket) {
      socket.close();
      socket = null;
    }
    setStatus("disconnected");
  };

  return { connect, disconnect };
};
