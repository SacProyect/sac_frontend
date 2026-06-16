import { Button } from '@/components/UI/button';

type Props = {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
};

const PAGE_SIZE_OPTIONS = [50, 100, 250] as const;

/**
 * Paginación client-side del tab Actas.
 *
 * El backend actual no expone `total`; `total` representa el largo del array
 * recibido. Cuando el backend publique el conteo real, este componente
 * funciona sin cambios (sólo cambia el `total` que recibe).
 *
 * - `aria-live="polite"` anuncia el cambio de página a screen readers (EARS).
 * - `data-testid="actas-pagination"` sigue la guía §7.3.
 */
export function ActasPagination({
    page,
    pageSize,
    total,
    onPageChange,
    onPageSizeChange,
}: Props) {
    const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
    const canPrev = page > 1;
    const canNext = page < totalPages;

    return (
        <div
            className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground px-2 py-2"
            data-testid="actas-pagination"
            aria-live="polite"
        >
            <span>
                Página {page} de {totalPages} · {total} actas
            </span>
            <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="hidden sm:inline">Tamaño:</span>
                    <select
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        value={pageSize}
                        onChange={(e) => {
                            const next = Number(e.target.value);
                            if (!Number.isNaN(next) && next > 0) onPageSizeChange(next);
                        }}
                        aria-label="Tamaño de página"
                    >
                        {PAGE_SIZE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="flex gap-1">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={!canPrev}
                        onClick={() => canPrev && onPageChange(page - 1)}
                        data-testid="actas-pagination-prev"
                    >
                        Anterior
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={!canNext}
                        onClick={() => canNext && onPageChange(page + 1)}
                        data-testid="actas-pagination-next"
                    >
                        Siguiente
                    </Button>
                </div>
            </div>
        </div>
    );
}
