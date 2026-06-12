import { useState, useCallback, useRef } from "react";
import { apiConnection } from "@/components/utils/api/api-connection";
import { MapLocation, MapLocationsResponse, MapQueryParams } from "@/types/census-map";

interface UseMapLocationsReturn {
  locations: MapLocation[];
  loading: boolean;
  error: string | null;
  fetchLocations: (params: MapQueryParams) => Promise<void>;
}

export function useMapLocations(): UseMapLocationsReturn {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchLocations = useCallback(async (params: MapQueryParams) => {
    try {
      setLoading(true);
      setError(null);

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

  return { locations, loading, error, fetchLocations };
}
