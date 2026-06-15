import { MapLocation } from "@/types/census-map";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export type CensusWsEvent =
  | { type: "census:new"; location: MapLocation }
  | { type: "census:update"; location: MapLocation }
  | { type: "census:delete"; locationId: string }
  | { type: "connected"; message: string };

interface CensusWsOptions {
  onEvent: (event: CensusWsEvent) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  onError?: (message: string) => void;
  reconnectDelayMs?: number;
}

const DEFAULT_RECONNECT_DELAY_MS = 3000;

const getCensusWsUrl = (): string => {
  const envBaseUrl =
    import.meta.env.VITE_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:3000";

  const normalized = envBaseUrl.endsWith("/") ? envBaseUrl.slice(0, -1) : envBaseUrl;
  const wsBase = normalized.replace(/^http/i, "ws");
  return `${wsBase}/ws/census`;
};

export const createCensusWsConnection = (options: CensusWsOptions) => {
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
      socket = new WebSocket(getCensusWsUrl());
    } catch (error) {
      setStatus("error");
      options.onError?.("No se pudo inicializar el websocket de censo.");
      scheduleReconnect();
      return;
    }

    socket.onopen = () => {
      setStatus("connected");
    };

    socket.onmessage = (message) => {
      try {
        const parsed = JSON.parse(message.data) as CensusWsEvent;
        if (!parsed?.type) return;
        options.onEvent(parsed);
      } catch (_error) {
        options.onError?.("Se recibió un evento inválido del websocket.");
      }
    };

    socket.onerror = () => {
      setStatus("error");
      options.onError?.("Error en la conexión websocket de censo.");
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
