import { useState, useCallback, useRef, useEffect } from "react";
import { createCensusWsConnection, CensusWsEvent } from "@/components/utils/api/census-ws-connection";
import { MapLocation } from "@/types/census-map";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface UseCensusSocketReturn {
  /** Estado de la conexión */
  connectionStatus: ConnectionStatus;
  /** Último evento recibido */
  lastEvent: CensusWsEvent | null;
  /** Conectar al WebSocket */
  connect: () => void;
  /** Desconectar del WebSocket */
  disconnect: () => void;
  /** Está conectado */
  isConnected: boolean;
}

export function useCensusSocket(
  /** Callback cuando se recibe un nuevo punto de censo */
  onNewLocation?: (location: MapLocation) => void,
  /** Callback cuando se actualiza un punto */
  onUpdateLocation?: (location: MapLocation) => void,
  /** Callback cuando se elimina un punto */
  onDeleteLocation?: (locationId: string) => void,
): UseCensusSocketReturn {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [lastEvent, setLastEvent] = useState<CensusWsEvent | null>(null);

  const connectionRef = useRef<ReturnType<typeof createCensusWsConnection> | null>(null);

  // Refs para callbacks (evitar stale closures)
  const onNewLocationRef = useRef(onNewLocation);
  const onUpdateLocationRef = useRef(onUpdateLocation);
  const onDeleteLocationRef = useRef(onDeleteLocation);

  useEffect(() => {
    onNewLocationRef.current = onNewLocation;
    onUpdateLocationRef.current = onUpdateLocation;
    onDeleteLocationRef.current = onDeleteLocation;
  }, [onNewLocation, onUpdateLocation, onDeleteLocation]);

  const handleEvent = useCallback((event: CensusWsEvent) => {
    setLastEvent(event);

    switch (event.type) {
      case "census:new":
        onNewLocationRef.current?.(event.location);
        break;
      case "census:update":
        onUpdateLocationRef.current?.(event.location);
        break;
      case "census:delete":
        onDeleteLocationRef.current?.(event.locationId);
        break;
    }
  }, []);

  const connect = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.disconnect();
    }

    connectionRef.current = createCensusWsConnection({
      onEvent: handleEvent,
      onStatusChange: setConnectionStatus,
      onError: (msg) => console.warn("[CensusWS]", msg),
    });

    connectionRef.current.connect();
  }, [handleEvent]);

  const disconnect = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.disconnect();
      connectionRef.current = null;
    }
    setConnectionStatus("disconnected");
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionStatus,
    lastEvent,
    connect,
    disconnect,
    isConnected: connectionStatus === "connected",
  };
}
