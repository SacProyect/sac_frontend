import { useState, useCallback } from "react";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/UI/button";
import { Card, CardContent } from "@/components/UI/card";
import { Label } from "@/components/UI/label";
import { Badge } from "@/components/UI/badge";
import { Skeleton } from "@/components/UI/skeleton";

export interface GpsCaptureProps {
  onLocationCaptured: (lat: number, lng: number, accuracy?: number) => void;
  onLocationError: (error: string) => void;
}

/**
 * Capturador GPS simplificado.
 * Solo obtiene las coordenadas y las reporta via callback.
 * La verificación se maneja externamente con LocationVerificationMap.
 */
export function GpsCapture({
  onLocationCaptured,
  onLocationError,
}: GpsCaptureProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Ubicación GPS</Label>
          {error && (
            <Badge variant="destructive" className="text-xs">
              {error}
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-full" />
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Navigation className="size-4 animate-spin" aria-hidden="true" />
              <span>Obteniendo ubicación...</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-6 text-sm text-muted-foreground min-h-[80px]">
              <span>Presiona para obtener tu ubicación GPS</span>
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
