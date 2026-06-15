import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents, GeoJSON, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import type { Feature } from "geojson";
import { MapLocation, MapQueryParams } from "@/types/census-map";
import { useMapLocations } from "@/hooks/useMapLocations";
import { useCensusSocket } from "@/hooks/useCensusSocket";
import { CensusMapLegend } from "./CensusMapLegend";
import { Button } from "@/components/UI/button";
import { Crosshair, Loader2, Radio } from "lucide-react";
import {
  PARROQUIAS_GEOJSON,
  PARROQUIA_LABELS,
  PARROQUIA_CENTROIDS,
  BASE_COLOR,
  LIBERTADOR_BOUNDS,
} from "./parroquias-data";
import type { ParroquiaCaracas } from "@/components/utils/api/divulgacion-functions";

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
            ${location.fiscal_name ? `<span class="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold border-slate-700 text-slate-300">Fiscal: ${escapeHtml(location.fiscal_name)}</span>` : ''}
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

function FitToLibertador() {
  const map = useMap();
  const fittedRef = useRef(false);

  useEffect(() => {
    if (!fittedRef.current) {
      map.fitBounds(LIBERTADOR_BOUNDS as any, { padding: [12, 12] });
      fittedRef.current = true;
    }
  }, [map]);

  return null;
}

function ParroquiaPolygons() {
  const map = useMap();

  const styleFn = useCallback((feature?: Feature) => {
    const key = (feature as any)?._parroquia_key as ParroquiaCaracas;
    return {
      color: "#0b1220",
      weight: 1.2,
      fillColor: BASE_COLOR[key] ?? "#94a3b8",
      fillOpacity: 0.35,
      opacity: 1,
      dashArray: "",
    };
  }, []);

  const onEachFeature = useCallback((feature: Feature, layer: L.Layer) => {
    const key = (feature as any)._parroquia_key as ParroquiaCaracas;
    const path = layer as L.Path;
    const tooltipHtml = `<div style="font-family:inherit;font-size:11px;font-weight:600;color:#0f172a">${PARROQUIA_LABELS[key]}</div>`;
    path.bindTooltip(tooltipHtml, { sticky: true, direction: "top" });

    path.on({
      mouseover: (e: L.LeafletEvent) => {
        const l = e.target as L.Path;
        l.setStyle({ weight: 2.5, color: "#fde047" });
        if ((l as any).bringToFront) (l as any).bringToFront();
      },
      mouseout: (e: L.LeafletEvent) => {
        const l = e.target as L.Path;
        l.setStyle({ weight: 1.2, color: "#0b1220" });
      },
    });
  }, []);

  return (
    <>
      <GeoJSON
        data={PARROQUIAS_GEOJSON as any}
        style={styleFn as any}
        onEachFeature={onEachFeature}
      />
      {(Object.keys(PARROQUIA_CENTROIDS) as ParroquiaCaracas[]).map((p) => {
        const c = PARROQUIA_CENTROIDS[p];
        if (!c) return null;
        const labelHtml = `<div class="census-parroquia-label">${PARROQUIA_LABELS[p]}</div>`;
        const icon = L.divIcon({
          className: "census-parroquia-label-wrapper",
          html: labelHtml,
          iconSize: [1, 1],
          iconAnchor: [0, 0],
        });
        return <Marker key={p} position={c} icon={icon} interactive={false} />;
      })}
    </>
  );
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
  showFilters = true,
  showLegend = true,
  showMyLocation = true,
  initialCenter = [10.4806, -66.9036],
  initialZoom = 13,
}: CensusMapProps) {
  const { 
    locations, 
    loading, 
    error, 
    fetchLocations,
    addLocation,
    updateLocation,
    removeLocation,
  } = useMapLocations();
  const [selectedStatuses, setSelectedStatuses] = useState<Set<MapLocation["census_status"]>>(new Set());
  const [selectedParroquia, setSelectedParroquia] = useState<ParroquiaCaracas | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connecting" | "connected">("idle");

  // WebSocket para tiempo real
  const { connectionStatus, isConnected, connect, disconnect } = useCensusSocket(
    addLocation,
    updateLocation,
    removeLocation,
  );

  // Conectar WebSocket al montar
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

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

  // ── Live mode (UI state machine; WebSocket integration is a follow-up) ──
  const connect = useCallback(() => {
    setConnectionStatus("connecting");
    // Simulated handshake — replace with real WebSocket connection.
    setTimeout(() => {
      setIsConnected(true);
      setConnectionStatus("connected");
    }, 600);
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setConnectionStatus("idle");
  }, []);

  const filteredLocations = useMemo(() => {
    if (selectedStatuses.size === 0) return locations;
    return locations.filter((loc) => selectedStatuses.has(loc.census_status));
  }, [locations, selectedStatuses]);

  const parroquiaFilteredLocations = useMemo(() => {
    if (!selectedParroquia) return filteredLocations;
    return filteredLocations.filter((loc) => {
      return detectParroquiaFromPoint(loc.latitude, loc.longitude) === selectedParroquia;
    });
  }, [filteredLocations, selectedParroquia]);

  // Shared options for the parroquia <select> used in both desktop panel and mobile sheet.
  const parroquiaOptions = useMemo(
    () =>
      (Object.keys(PARROQUIA_CENTROIDS) as ParroquiaCaracas[]).map((p) => (
        <option key={p} value={p}>
          {PARROQUIA_LABELS[p]}
        </option>
      )),
    []
  );

  return (
    <div className="relative w-full h-full">
      {/* ── Desktop filter panel (≥ lg) ──────────────────────────────── */}
      {showFilters && (
        <div className="hidden lg:flex absolute top-3 left-3 z-[1000] bg-slate-900/95 border border-slate-700/50 rounded-lg p-3 shadow-lg w-64 flex-col gap-2">
          <h4 className="text-xs font-semibold text-slate-200">Filtros de censo</h4>
          <select
            className="bg-slate-800 text-slate-200 text-xs rounded border border-slate-600 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500/40"
            value={selectedParroquia || ""}
            onChange={(e) =>
              handleParroquiaChange(e.target.value ? (e.target.value as ParroquiaCaracas) : null)
            }
            aria-label="Filtrar por parroquia"
          >
            <option value="">Todas las parroquias</option>
            {parroquiaOptions}
          </select>
          <div className="space-y-1.5">
            {CENSUS_STATUS_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 cursor-pointer min-h-[32px]"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500/40"
                  checked={selectedStatuses.has(opt.value)}
                  onChange={() => toggleStatus(opt.value)}
                />
                <span className="text-xs text-slate-300">{opt.label}</span>
              </label>
            ))}
          </div>
          {showMyLocation && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent min-h-[44px]"
                onClick={goToMyLocation}
              >
                <Crosshair className="size-3 mr-1" />
                Mi ubicación
              </Button>
              <Button
                variant={isConnected ? "default" : "outline"}
                size="sm"
                className={`w-full text-xs min-h-[44px] ${
                  isConnected
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent"
                }`}
                onClick={() => (isConnected ? disconnect() : connect())}
                disabled={connectionStatus === "connecting"}
              >
                {isConnected ? (
                  <>
                    <span className="size-2 rounded-full bg-emerald-300 mr-2 animate-pulse" />
                className="mt-3 w-full text-xs border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent"
                onClick={goToMyLocation}
              >
                <Crosshair className="w-3 h-3 mr-1" />
                Mi ubicación
              </Button>
              
              {/* Botón Tiempo Real */}
              <Button
                variant={isConnected ? "default" : "outline"}
                size="sm"
                className={`mt-2 w-full text-xs ${
                  isConnected 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                    : "border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent"
                }`}
                onClick={() => isConnected ? disconnect() : connect()}
              >
                {isConnected ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" />
                    En vivo
                  </>
                ) : (
                  <>
                    <Radio className="size-3 mr-1" />
                    {connectionStatus === "connecting" ? "Conectando…" : "Conectar"}
                    <Radio className="w-3 h-3 mr-1" />
                    Tiempo real
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      )}

      {/* ── Mobile FAB filter button (< lg) ─────────────────────────── */}
      {showFilters && (
        <Button
          onClick={() => setMobileFiltersOpen(true)}
          className="lg:hidden fixed bottom-4 right-4 z-[1100] size-14 rounded-full shadow-xl bg-sky-600 hover:bg-sky-700 text-white p-0"
          aria-label="Abrir filtros"
        >
          <Filter className="size-5" />
          {selectedStatuses.size > 0 && (
            <span className="absolute -top-1 -right-1 size-6 rounded-full bg-emerald-500 text-[11px] font-bold flex items-center justify-center text-slate-950 border-2 border-slate-950">
              {selectedStatuses.size}
            </span>
          )}
        </Button>
      )}

      {/* ── Mobile bottom sheet (< lg) ──────────────────────────────── */}
      {mobileFiltersOpen && (
        <div className="lg:hidden fixed inset-0 z-[1200] flex flex-col">
          <div
            className="flex-1 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />
          <div className="bg-slate-900 border-t border-slate-700 rounded-t-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-slate-100">Filtros de censo</h4>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileFiltersOpen(false)}
                className="text-slate-400 hover:text-slate-100 min-h-[44px] min-w-[44px]"
                aria-label="Cerrar filtros"
              >
                <X className="size-5" />
              </Button>
            </div>
            <div className="mb-3 bg-slate-800 rounded-md border border-slate-700 px-3 py-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1">
                Parroquia
              </span>
              <select
                className="w-full bg-transparent text-slate-200 text-sm focus:outline-none"
                value={selectedParroquia || ""}
                onChange={(e) =>
                  handleParroquiaChange(e.target.value ? (e.target.value as ParroquiaCaracas) : null)
                }
                aria-label="Filtrar por parroquia"
              >
                <option value="">Todas las parroquias</option>
                {parroquiaOptions}
              </select>
            </div>
            <div className="space-y-1">
              {CENSUS_STATUS_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 cursor-pointer min-h-[48px] p-2 rounded hover:bg-slate-800/50"
                >
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500/40"
                    checked={selectedStatuses.has(opt.value)}
                    onChange={() => toggleStatus(opt.value)}
                  />
                  <span className="text-sm text-slate-200">{opt.label}</span>
                </label>
              ))}
            </div>
            {showMyLocation && (
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-700">
                <Button
                  variant="outline"
                  className="w-full min-h-[48px] border-slate-600 text-slate-200 hover:bg-slate-800 bg-transparent"
                  onClick={goToMyLocation}
                >
                  <Crosshair className="size-4 mr-2" />
                  Mi ubicación
                </Button>
                <Button
                  variant={isConnected ? "default" : "outline"}
                  className={`w-full min-h-[48px] ${
                    isConnected
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "border-slate-600 text-slate-200 hover:bg-slate-800 bg-transparent"
                  }`}
                  onClick={() => (isConnected ? disconnect() : connect())}
                  disabled={connectionStatus === "connecting"}
                >
                  {isConnected ? (
                    <>
                      <span className="size-2 rounded-full bg-emerald-300 mr-2 animate-pulse" />
                      Desconectar
                    </>
                  ) : (
                    <>
                      <Radio className="size-4 mr-2" />
                      {connectionStatus === "connecting" ? "Conectando…" : "Conectar en vivo"}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Loading / connecting / error — top center, stacked ──────── */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-2 pointer-events-none">
        {loading && (
          <div className="bg-slate-900/95 border border-slate-700/50 rounded-lg px-3 py-2 shadow-lg flex items-center gap-2 pointer-events-auto">
            <Loader2 className="size-3.5 animate-spin text-sky-400" />
            <span className="text-xs text-slate-300">Cargando ubicaciones…</span>
          </div>
        )}
        {connectionStatus === "connecting" && !loading && (
          <div className="bg-yellow-900/90 border border-yellow-700/50 rounded-lg px-3 py-2 shadow-lg flex items-center gap-2 pointer-events-auto">
            <Loader2 className="size-3 animate-spin text-yellow-400" />
            <span className="text-xs text-yellow-300">Conectando…</span>
          </div>
        )}
        {error && (
          <div className="bg-rose-900/90 border border-rose-700/50 rounded-lg px-3 py-2 shadow-lg pointer-events-auto max-w-[90vw]">
            <span className="text-xs text-rose-300">{error}</span>
          </div>
        )}
      </div>

      {/* ── "En vivo" indicator — desktop top-right ─────────────────── */}
      {isConnected && !loading && (
        <div className="hidden lg:flex absolute top-3 right-3 z-[1000] bg-emerald-900/90 border border-emerald-700/50 rounded-lg px-3 py-2 shadow-lg items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-300">En vivo · {locations.length}</span>
      {loading && (
        <div className="absolute top-3 right-3 z-[1000] bg-slate-900/90 border border-slate-700/50 rounded-lg px-3 py-2 shadow-lg flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
          <span className="text-xs text-slate-300">Cargando ubicaciones...</span>
        </div>
      )}

      {/* Indicador de tiempo real activo */}
      {isConnected && !loading && (
        <div className="absolute top-3 right-3 z-[1000] bg-emerald-900/90 border border-emerald-700/50 rounded-lg px-3 py-2 shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-emerald-300">
            En vivo
          </span>
        </div>
      )}

      {connectionStatus === "connecting" && (
        <div className="absolute top-3 right-3 z-[1000] bg-yellow-900/90 border border-yellow-700/50 rounded-lg px-3 py-2 shadow-lg flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin text-yellow-400" />
          <span className="text-xs text-yellow-300">Conectando...</span>
        </div>
      )}

      {error && (
        <div className="absolute top-3 right-3 z-[1000] bg-rose-900/90 border border-rose-700/50 rounded-lg px-3 py-2 shadow-lg">
          <span className="text-xs text-rose-300">{error}</span>
        </div>
      )}

      {/* ── "En vivo" indicator — mobile bottom-left ────────────────── */}
      {isConnected && !loading && (
        <div className="lg:hidden fixed bottom-4 left-4 z-[1100] bg-emerald-900/90 border border-emerald-700/50 rounded-lg px-3 py-2 shadow-lg flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-300">{locations.length} en vivo</span>
        </div>
      )}

      {/* ── Map ─────────────────────────────────────────────────────── */}
      <MapContainer
        center={[10.49, -66.96]}
        zoom={12}
        minZoom={11}
        maxZoom={17}
        scrollWheelZoom
        style={{ width: "100%", height: "100%", background: "#0f172a" }}
        className="rounded-none lg:rounded-lg"
        maxBounds={[
          [10.34, -67.18],
          [10.66, -66.74],
        ]}
        maxBoundsViscosity={0.9}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToLibertador />
        <MapBoundsFetcher onBoundsChange={handleBoundsChange} debounceMs={300} />
        <MapFlyToHandler />
        <ParroquiaPolygons />
        <CensusMarkers locations={filteredLocations} />
      </MapContainer>

      {/* ── Empty state ─────────────────────────────────────────────── */}
      {!loading && parroquiaFilteredLocations.length === 0 && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center bg-slate-900/80 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-sm w-full text-center shadow-xl">
            <MapPin className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-200 mb-2">
              No hay ubicaciones censadas
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {selectedParroquia
                ? `No se encontraron contribuyentes censados en ${PARROQUIA_LABELS[selectedParroquia]}.`
                : "No se encontraron contribuyentes censados en esta área."}
            </p>
            <p className="text-xs text-slate-500">
              Use el selector de parroquia para explorar otras zonas, o capture nuevas ubicaciones desde el tab "Captura".
            </p>
          </div>
        </div>
      )}

      {showLegend && <CensusMapLegend />}

      <style>{`
        .census-parroquia-label-wrapper {
          background: transparent !important;
          border: none !important;
          pointer-events: none;
        }
        .census-parroquia-label {
          display: inline-block;
          transform: translate(-50%, -50%);
          background: rgba(15,23,42,0.82);
          border: 1px solid rgba(148,163,184,0.4);
          color: #f1f5f9;
          padding: 1px 5px;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
          font-family: inherit;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.01em;
          white-space: nowrap;
        }
        .leaflet-interactive { cursor: pointer; transition: filter 0.15s ease; }
        .leaflet-interactive:hover { filter: brightness(1.1) saturate(1.15); }
      `}</style>
    </div>
  );
}
