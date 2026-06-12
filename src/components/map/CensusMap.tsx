import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { MapLocation, MapQueryParams } from "@/types/census-map";
import { useMapLocations } from "@/hooks/useMapLocations";
import { CensusMapLegend } from "./CensusMapLegend";
import { Button } from "@/components/UI/button";
import { Crosshair, Loader2 } from "lucide-react";

interface CensusMapProps {
  height?: string;
  showFilters?: boolean;
  showLegend?: boolean;
  showMyLocation?: boolean;
  initialCenter?: [number, number];
  initialZoom?: number;
}

const MARKER_COLORS: Record<MapLocation["data_integrity_status"], string> = {
  COMPLETE: "#22c55e",
  PENDING_DATA: "#eab308",
  NOT_VERIFIED: "#ef4444",
};

const CENSUS_STATUS_OPTIONS: { value: MapLocation["census_status"]; label: string }[] = [
  { value: "DRAFT", label: "Borrador" },
  { value: "COMPLETED", label: "Completado" },
  { value: "VERIFIED", label: "Verificado" },
  { value: "IMPORTED", label: "Importado" },
];

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function buildPopupHtml(location: MapLocation): string {
  const color = MARKER_COLORS[location.data_integrity_status];
  const statusLabel =
    location.data_integrity_status === "COMPLETE"
      ? "Datos completos"
      : location.data_integrity_status === "PENDING_DATA"
        ? "Pendiente de datos"
        : "No verificado";

  const photoHtml = location.photo_url
    ? `<img src="${escapeHtml(location.photo_url)}" alt="Fachada" class="w-full h-[120px] object-cover" onerror="this.style.display='none'" />`
    : `<div class="h-[120px] w-full bg-slate-800 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500"><line x1="2" y1="2" x2="22" y2="22"/><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"/><line x1="13.5" y1="6.5" x2="17.5" y2="10.5"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1"/><path d="M3 3l18 18"/></svg></div>`;

  return `
    <div class="min-w-[240px] max-w-[280px]">
      <div class="rounded-lg overflow-hidden border border-slate-700/50 bg-slate-900 shadow-lg">
        ${photoHtml}
        <div class="p-3 space-y-2">
          <h3 class="font-semibold text-sm text-slate-100 truncate" title="${escapeHtml(location.commercial_name)}">${escapeHtml(location.commercial_name)}</h3>
          ${location.address ? `<p class="text-xs text-slate-400 truncate" title="${escapeHtml(location.address)}">${escapeHtml(location.address)}</p>` : ""}
          <div class="flex flex-wrap items-center gap-1.5 pt-1">
            <span class="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold border-slate-700 text-slate-300">Censo: ${escapeHtml(location.taxpayer_id)}</span>
            <span class="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold" style="background-color:${color}20;color:${color};border-color:${color}40">${statusLabel}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function createMarkerIcon(status: MapLocation["data_integrity_status"]) {
  const color = MARKER_COLORS[status];
  return L.divIcon({
    className: "custom-census-marker",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7],
  });
}

function CensusMarkers({
  locations,
}: {
  locations: MapLocation[];
}) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    const cluster = L.markerClusterGroup({
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 60,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size = count < 10 ? 24 : count < 100 ? 32 : 40;
        return L.divIcon({
          html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:rgba(56,189,248,0.9);color:#0f172a;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);">${count}</div>`,
          className: "census-cluster-marker",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      },
    });

    clusterRef.current = cluster;
    map.addLayer(cluster);

    return () => {
      map.removeLayer(cluster);
      clusterRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;

    cluster.clearLayers();

    const markers: L.Marker[] = [];
    for (const loc of locations) {
      if (typeof loc.latitude !== "number" || typeof loc.longitude !== "number") continue;
      const marker = L.marker([loc.latitude, loc.longitude], {
        icon: createMarkerIcon(loc.data_integrity_status),
      });
      marker.bindPopup(buildPopupHtml(loc), {
        maxWidth: 300,
        className: "census-popup-custom",
      });
      markers.push(marker);
    }

    if (markers.length > 0) {
      cluster.addLayers(markers);
    }
  }, [locations]);

  return null;
}

function MapBoundsFetcher({
  onBoundsChange,
  debounceMs,
}: {
  onBoundsChange: (params: MapQueryParams) => void;
  debounceMs: number;
}) {
  const map = useMap();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerFetch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      const bounds = map.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      onBoundsChange({
        minLat: sw.lat,
        maxLat: ne.lat,
        minLng: sw.lng,
        maxLng: ne.lng,
      });
    }, debounceMs);
  }, [map, onBoundsChange, debounceMs]);

  useMapEvents({
    moveend: triggerFetch,
    zoomend: triggerFetch,
  });

  useEffect(() => {
    // Initial fetch after a short delay to ensure map is ready
    const timer = setTimeout(triggerFetch, 100);
    return () => {
      clearTimeout(timer);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [triggerFetch]);

  return null;
}

function MapFlyToHandler() {
  const map = useMap();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ lat: number; lng: number; zoom?: number }>).detail;
      if (detail) {
        map.flyTo([detail.lat, detail.lng], detail.zoom ?? 16);
      }
    };
    window.addEventListener("census-map-flyto", handler);
    return () => window.removeEventListener("census-map-flyto", handler);
  }, [map]);

  return null;
}

export function CensusMap({
  height = "600px",
  showFilters = true,
  showLegend = true,
  showMyLocation = true,
  initialCenter = [10.4806, -66.9036],
  initialZoom = 13,
}: CensusMapProps) {
  const { locations, loading, error, fetchLocations } = useMapLocations();
  const [selectedStatuses, setSelectedStatuses] = useState<Set<MapLocation["census_status"]>>(new Set());

  const handleBoundsChange = useCallback(
    (bounds: Omit<MapQueryParams, "status" | "limit">) => {
      const statusFilter = selectedStatuses.size > 0 ? Array.from(selectedStatuses).join(",") : undefined;
      fetchLocations({
        ...bounds,
        status: statusFilter,
        limit: 500,
      });
    },
    [fetchLocations, selectedStatuses]
  );

  const toggleStatus = (status: MapLocation["census_status"]) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const goToMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.dispatchEvent(
          new CustomEvent("census-map-flyto", {
            detail: { lat: pos.coords.latitude, lng: pos.coords.longitude, zoom: 16 },
          })
        );
      },
      () => {
        // Silently ignore geolocation errors
      }
    );
  };

  const filteredLocations = useMemo(() => {
    if (selectedStatuses.size === 0) return locations;
    return locations.filter((loc) => selectedStatuses.has(loc.census_status));
  }, [locations, selectedStatuses]);

  return (
    <div className="relative w-full" style={{ height }}>
      {showFilters && (
        <div className="absolute top-3 left-3 z-[1000] bg-slate-900/95 border border-slate-700/50 rounded-lg p-3 shadow-lg max-w-[16rem]">
          <h4 className="text-xs font-semibold text-slate-200 mb-2">Filtros de censo</h4>
          <div className="space-y-1.5">
            {CENSUS_STATUS_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500/40"
                  checked={selectedStatuses.has(opt.value)}
                  onChange={() => toggleStatus(opt.value)}
                />
                <span className="text-xs text-slate-300">{opt.label}</span>
              </label>
            ))}
          </div>
          {showMyLocation && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full text-xs border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent"
              onClick={goToMyLocation}
            >
              <Crosshair className="w-3 h-3 mr-1" />
              Mi ubicación
            </Button>
          )}
        </div>
      )}

      {loading && (
        <div className="absolute top-3 right-3 z-[1000] bg-slate-900/90 border border-slate-700/50 rounded-lg px-3 py-2 shadow-lg flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
          <span className="text-xs text-slate-300">Cargando ubicaciones...</span>
        </div>
      )}

      {error && (
        <div className="absolute top-3 right-3 z-[1000] bg-rose-900/90 border border-rose-700/50 rounded-lg px-3 py-2 shadow-lg">
          <span className="text-xs text-rose-300">{error}</span>
        </div>
      )}

      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        style={{ width: "100%", height: "100%" }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBoundsFetcher onBoundsChange={handleBoundsChange} debounceMs={300} />
        <MapFlyToHandler />
        <CensusMarkers locations={filteredLocations} />
      </MapContainer>

      {showLegend && <CensusMapLegend />}
    </div>
  );
}
