import { useState, useCallback, useRef, useEffect } from "react";
import { apiConnection } from "@/components/utils/api/api-connection";
import { MapLocation, MapLocationsResponse, MapQueryParams } from "@/types/census-map";

interface UseMapLocationsReturn {
  locations: MapLocation[];
  loading: boolean;
  error: string | null;
  fetchLocations: (params: MapQueryParams) => Promise<void>;
  /** Activar/desactivar actualización automática */
  setAutoRefresh: (enabled: boolean) => void;
  /** Estado del auto-refresh */
  isAutoRefreshing: boolean;
  /** Última vez que se actualizaron los datos */
  lastRefresh: Date | null;
  /** Agregar una ubicación nueva (desde WebSocket) */
  addLocation: (location: MapLocation) => void;
  /** Actualizar una ubicación (desde WebSocket) */
  updateLocation: (location: MapLocation) => void;
  /** Eliminar una ubicación (desde WebSocket) */
  removeLocation: (locationId: string) => void;
}

/** Intervalo de polling en ms (15 segundos) */
const POLL_INTERVAL_MS = 15_000;

export function useMapLocations(): UseMapLocationsReturn {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastParamsRef = useRef<MapQueryParams | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLocations = useCallback(async (params: MapQueryParams) => {
    try {
      setLoading(true);
      setError(null);
      lastParamsRef.current = params;

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const queryParams = new URLSearchParams();
      queryParams.append("minLat", String(params.minLat));
      queryParams.append("maxLat", String(params.maxLat));
      queryParams.append("minLng", String(params.minLng));
      queryParams.append("maxLng", String(params.maxLng));
      if (params.status) {
        queryParams.append("status", params.status);
      }
      queryParams.append("limit", String(Math.min(params.limit ?? 500, 1000)));

      const response = await apiConnection.get<MapLocationsResponse>(`/map/locations?${queryParams.toString()}`, {
        signal: abortController.signal,
      });

      const features = response.data?.features ?? [];
      const mapped = features.map((f) => f.properties);
      setLocations(mapped);
      setLastRefresh(new Date());
    } catch (err: any) {
      if (err.name === "AbortError" || err.code === "ERR_CANCELED") {
        return;
      }
      setError(err?.message ?? "Error al cargar ubicaciones");
      console.error("[useMapLocations] Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para refetch silencioso (sin loading spinner)
  const silentRefresh = useCallback(async () => {
    if (!lastParamsRef.current) return;
    
    try {
      const params = lastParamsRef.current;
      const queryParams = new URLSearchParams();
      queryParams.append("minLat", String(params.minLat));
      queryParams.append("maxLat", String(params.maxLat));
      queryParams.append("minLng", String(params.minLng));
      queryParams.append("maxLng", String(params.maxLng));
      if (params.status) {
        queryParams.append("status", params.status);
      }
      queryParams.append("limit", String(Math.min(params.limit ?? 500, 1000)));

      const response = await apiConnection.get<MapLocationsResponse>(`/map/locations?${queryParams.toString()}`);

      const features = response.data?.features ?? [];
      const mapped = features.map((f) => f.properties);
      setLocations(mapped);
      setLastRefresh(new Date());
    } catch (err: any) {
      // Silenciar errores en refresh automático
      console.warn("[useMapLocations] Silent refresh failed:", err?.message);
    }
  }, []);

  // Activar/desactivar auto-refresh
  const setAutoRefresh = useCallback((enabled: boolean) => {
    setIsAutoRefreshing(enabled);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (enabled) {
      // Primer refresh inmediato
      silentRefresh();
      // Luego cada 15 segundos
      intervalRef.current = setInterval(silentRefresh, POLL_INTERVAL_MS);
    }
  }, [silentRefresh]);

  // Limpiar interval al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Agregar ubicación nueva (desde WebSocket)
  const addLocation = useCallback((location: MapLocation) => {
    setLocations((prev) => {
      // Evitar duplicados
      if (prev.some((l) => l.id === location.id)) return prev;
      return [...prev, location];
    });
  }, []);

  // Actualizar ubicación (desde WebSocket)
  const updateLocation = useCallback((location: MapLocation) => {
    setLocations((prev) =>
      prev.map((l) => (l.id === location.id ? location : l))
    );
  }, []);

  // Eliminar ubicación (desde WebSocket)
  const removeLocation = useCallback((locationId: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== locationId));
  }, []);

  return { 
    locations, 
    loading, 
    error, 
    fetchLocations,
    setAutoRefresh,
    isAutoRefreshing,
    lastRefresh,
    addLocation,
    updateLocation,
    removeLocation,
  };
}
