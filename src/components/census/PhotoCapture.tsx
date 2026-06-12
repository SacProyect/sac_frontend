import React, { useRef, useState, useCallback, useEffect } from "react";
import { Camera, Trash2, ImageIcon } from "lucide-react";
import { Button } from "@/components/UI/button";
import { Card, CardContent } from "@/components/UI/card";
import { Label } from "@/components/UI/label";
import { Badge } from "@/components/UI/badge";

export interface PhotoCaptureProps {
  onPhotoCaptured: (file: File) => void;
  onPhotoRemoved: () => void;
  maxSizeMB?: number;
}

export function PhotoCapture({
  onPhotoCaptured,
  onPhotoRemoved,
  maxSizeMB = 5,
}: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setError(null);

      const sizeInMB = file.size / (1024 * 1024);
      if (sizeInMB > maxSizeMB) {
        setError(`El archivo excede el límite de ${maxSizeMB} MB (${sizeInMB.toFixed(2)} MB)`);
        setPreview(null);
        setFileName(null);
        setFileSize(null);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
        return;
      }

      if (preview) {
        URL.revokeObjectURL(preview);
      }
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setFileName(file.name);
      setFileSize(file.size);
      onPhotoCaptured(file);
    },
    [maxSizeMB, onPhotoCaptured]
  );

  const handleRemove = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setFileName(null);
    setFileSize(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onPhotoRemoved();
  }, [preview, onPhotoRemoved]);

  const handleCaptureClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="photo-capture-input" className="text-base font-semibold">
            Foto de fachada
          </Label>
          {error && (
            <Badge variant="destructive" className="text-xs">
              {error}
            </Badge>
          )}
        </div>

        <input
          ref={inputRef}
          id="photo-capture-input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="sr-only"
          aria-label="Capturar foto de fachada"
        />

        {!preview ? (
          <button
            type="button"
            onClick={handleCaptureClick}
            className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-8 transition-colors hover:bg-muted hover:border-muted-foreground/40 active:bg-muted/70 min-h-[200px] w-full touch-manipulation"
            aria-label="Abrir cámara para capturar foto"
          >
            <Camera className="size-12 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">
              Toca para capturar foto
            </span>
            <span className="text-xs text-muted-foreground/70">
              Máx. {maxSizeMB} MB
            </span>
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="relative flex items-center justify-center rounded-xl border bg-muted/30 p-4">
              <img
                src={preview}
                alt={`Vista previa: ${fileName ?? "foto capturada"}`}
                className="max-h-[200px] rounded-lg object-contain"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2 size-9 rounded-full shadow-sm"
                onClick={handleRemove}
                aria-label="Eliminar foto"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="size-4" aria-hidden="true" />
              <span className="truncate">{fileName}</span>
              {fileSize !== null && (
                <span className="shrink-0 text-xs">({formatFileSize(fileSize)})</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
