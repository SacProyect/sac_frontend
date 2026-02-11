import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  /** Número de columnas */
  columns?: number;
  /** Número de filas */
  rows?: number;
  /** Anchos de columna (ej: ["w-16", "w-24", "flex-1", ...]). Si no se pasa, se usan anchos por defecto. */
  columnWidths?: string[];
  className?: string;
  /** Clase adicional para cada celda skeleton (ej: tema oscuro "bg-slate-700") */
  skeletonClassName?: string;
}

/**
 * Skeleton para tablas: muestra filas con celdas animadas (pulse).
 * Mejor UX que un spinner: el usuario ve la estructura de la tabla mientras carga.
 */
export function TableSkeleton({
  columns = 6,
  rows = 10,
  columnWidths,
  className,
  skeletonClassName,
}: TableSkeletonProps) {
  const widths = columnWidths ?? Array(columns).fill("flex-1");

  return (
    <div className={cn("w-full overflow-hidden rounded-lg border", className)}>
      {/* Header */}
      <div className="flex border-b bg-muted/50 px-2 py-2">
        {widths.slice(0, columns).map((w, i) => (
          <Skeleton key={i} className={cn("h-5", w, "mx-1", skeletonClassName)} />
        ))}
      </div>
      {/* Body rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex border-b border-border/50 px-2 py-3 last:border-b-0"
        >
          {widths.slice(0, columns).map((w, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn("h-4", w, "mx-1", skeletonClassName)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
