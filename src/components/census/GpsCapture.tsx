import React, { useState, useCallback } from "react";
import { MapPin, RefreshCw, Navigation } from "lucide-react";
import { Button } from "@/components/UI/button";
import { Card, CardContent } from "@/components/UI/card";
import { Label } from "@/components/UI/label";
import { Badge } from "@/components/UI/badge";
import { Skeleton } from "@/components/UI/skeleton";

export interface GpsCaptureProps {
  latitude: number | null;
  longitude: number | null;
  onLocationCaptured: (lat: number, lng: number, accuracy?: number) => void;
  onLocationError: (error: string) => void;
}

export function GpsCapture({
  latitude,
  longitude,
  onLocationCaptured,
  onLocationError,
}: GpsCaptureProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const hasLocation = latitude !== null && longitude !== null;

  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      const msg = "Geolocalización no soportada en este navegador";
      setError(msg);
      onLocationError(msg);
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = position.coords.accuracy;

        setAccuracy(acc);
        setIsLoading(false);
        onLocationCaptured(lat, lng, acc);
      },
      (err) => {
        let msg = "Error al obtener ubicación";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg = "Permiso de ubicación denegado";
            break;
          case err.POSITION_UNAVAILABLE:
            msg = "Ubicación no disponible (GPS desactivado)";
            break;
          case err.TIMEOUT:
            msg = "Tiempo de espera agotado al obtener ubicación";
            break;
        }
        setError(msg);
        setIsLoading(false);
        onLocationError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, [onLocationCaptured, onLocationError]);

  const formatCoordinate = (value: number): string => {
    return value.toFixed(6);
  };

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Ubicación GPS</Label>
          {error && (
            <Badge variant="destructive" className="text-xs">
              {error}
            </Badge>
          )}
          {accuracy !== null && accuracy > 50 && !error && (
            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
              Precisión baja
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Navigation className="size-4 animate-spin" aria-hidden="true" />
              <span>Obteniendo ubicación...</span>
            </div>
          </div>
        ) : hasLocation ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-3">
                <span className="text-xs text-muted-foreground">Latitud</span>
                <span className="text-sm font-mono font-medium">{formatCoordinate(latitude)}</span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-3">
                <span className="text-xs text-muted-foreground">Longitud</span>
                <span className="text-sm font-mono font-medium">{formatCoordinate(longitude)}</span>
              </div>
            </div>

            {accuracy !== null && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="size-3.5" aria-hidden="true" />
                <span>Precisión: ~{Math.round(accuracy)} metros</span>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 min-h-[44px]"
              onClick={handleGetLocation}
              aria-label="Actualizar ubicación GPS"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Actualizar ubicación
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-6 text-sm text-muted-foreground min-h-[100px]">
              <span>Sin ubicación capturada</span>
            </div>

            <Button
              type="button"
              className="w-full gap-2 min-h-[44px]"
              onClick={handleGetLocation}
              aria-label="Obtener ubicación actual"
            >
              <MapPin className="size-4" aria-hidden="true" />
              Obtener ubicación
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
