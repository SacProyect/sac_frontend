import { useState, useCallback, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Check, RotateCcw, MapPin } from "lucide-react";
import { Button } from "@/components/UI/button";
import { Card, CardContent } from "@/components/UI/card";
import { Label } from "@/components/UI/label";
import { Badge } from "@/components/UI/badge";

// Fix para el icono de marker de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const CARACAS_CENTER: [number, number] = [10.49, -66.90];
const VERIFY_ZOOM = 16;

const pinIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface LocationVerificationMapProps {
  /** Coordenadas iniciales del GPS */
  latitude: number;
  longitude: number;
  /** Callback cuando el usuario confirma la ubicación (después de "Listo") */
  onConfirm: (lat: number, lng: number) => void;
  /** Callback cuando el usuario mueve el pin (para re-detectar parroquia) */
  onPinMoved: (lat: number, lng: number) => void;
  /** Callback para descartar y volver a capturar GPS */
  onDiscard: () => void;
  /** Estado de carga de parroquia */
  isDetectingParish?: boolean;
}

/**
 * Mapa de verificación de ubicación.
 * Se muestra DESPUÉS de capturar GPS para que el usuario verifique/ajuste la posición.
 */
export function LocationVerificationMap({
  latitude,
  longitude,
  onConfirm,
  onPinMoved,
  onDiscard,
  isDetectingParish = false,
}: LocationVerificationMapProps) {
  const [position, setPosition] = useState({ lat: latitude, lng: longitude });
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  // Centrar mapa en la posición inicial cuando se monta
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([latitude, longitude], VERIFY_ZOOM, { animate: true });
    }
  }, [latitude, longitude]);

  const handlePinDrag = useCallback(
    (newLat: number, newLng: number) => {
      if (isConfirmed) return;
      setPosition({ lat: newLat, lng: newLng });
      setHasMoved(true);
      onPinMoved(newLat, newLng);
    },
    [isConfirmed, onPinMoved]
  );

  const handleConfirm = useCallback(() => {
    setIsConfirmed(true);
    onConfirm(position.lat, position.lng);
  }, [position, onConfirm]);

  const handleReset = useCallback(() => {
    // Volver a la posición GPS original
    setPosition({ lat: latitude, lng: longitude });
    setIsConfirmed(false);
    setHasMoved(false);
    onPinMoved(latitude, longitude);
  }, [latitude, longitude, onPinMoved]);

  const formatCoord = (v: number) => v.toFixed(6);

  return (
    <Card className="w-full border-blue-200 bg-blue-50/50">
      <CardContent className="flex flex-col gap-3 p-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <Label className="text-sm font-semibold text-blue-900">
              Verificar ubicación
            </Label>
          </div>
          {isConfirmed ? (
            <Badge className="bg-green-100 text-green-800 border-green-200 text-[10px]">
              ✓ Confirmada
            </Badge>
          ) : hasMoved ? (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
              Modificada
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              GPS capturado
            </Badge>
          )}
        </div>

        {/* Mapa */}
        <div
          className="relative rounded-lg overflow-hidden border border-blue-200"
          style={{ height: 250, width: "100%" }}
        >
          <MapContainer
            center={[latitude, longitude]}
            zoom={VERIFY_ZOOM}
            minZoom={11}
            maxZoom={18}
            scrollWheelZoom={!isConfirmed}
            style={{ height: "100%", width: "100%" }}
            className={isConfirmed ? "opacity-80" : ""}
            ref={mapRef}
            maxBounds={[
              [10.34, -67.18],
              [10.66, -66.74],
            ]}
            maxBoundsViscosity={0.9}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {position && (
              <Marker
                position={[position.lat, position.lng]}
                icon={pinIcon}
                draggable={!isConfirmed}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const pos = marker.getLatLng();
                    handlePinDrag(pos.lat, pos.lng);
                  },
                }}
              />
            )}
          </MapContainer>

          {/* Overlay de parroquia detectándose */}
          {isDetectingParish && (
            <div className="absolute top-2 left-2 z-[1000] bg-white/90 border border-blue-200 rounded px-2 py-1 text-xs text-blue-700 flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Detectando parroquia...
            </div>
          )}
        </div>

        {/* Coordenadas */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-0.5 rounded border bg-white/60 px-2 py-1.5">
            <span className="text-[10px] text-muted-foreground">Latitud</span>
            <span className="text-xs font-mono font-medium">{formatCoord(position.lat)}</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded border bg-white/60 px-2 py-1.5">
            <span className="text-[10px] text-muted-foreground">Longitud</span>
            <span className="text-xs font-mono font-medium">{formatCoord(position.lng)}</span>
          </div>
        </div>

        {/* Instrucciones */}
        {!isConfirmed && (
          <p className="text-[11px] text-blue-600 text-center">
            {hasMoved
              ? "Pin movido. La parroquia se está re-detectando..."
              : "Arrastra el pin si necesitas ajustar la ubicación"}
          </p>
        )}

        {/* Botones */}
        <div className="flex gap-2">
          {!isConfirmed ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-2 min-h-[40px]"
                onClick={onDiscard}
              >
                <RotateCcw className="w-4 h-4" />
                Capturar de nuevo
              </Button>
              <Button
                type="button"
                className="flex-1 gap-2 min-h-[40px] bg-green-600 hover:bg-green-700"
                onClick={handleConfirm}
              >
                <Check className="w-4 h-4" />
                Listo
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 min-h-[40px]"
              onClick={() => {
                setIsConfirmed(false);
                setHasMoved(false);
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Modificar ubicación
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
