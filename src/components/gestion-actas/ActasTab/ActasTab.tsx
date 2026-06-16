import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';
import { AlertCircle, ChevronDown, FileUp, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/UI/button';
import { useDebounce } from '@/hooks/use-debounce';
import { fetchActasReparo } from './api';
import { ActasFiltersDrawer } from './ActasFiltersDrawer';
import { ActasPagination } from './ActasPagination';
import { ActasSearchBar } from './ActasSearchBar';
import { ActasTable } from './ActasTable';
import { ActasUploadForm } from './ActasUploadForm';
import {
    defaultActasAdvancedFilters,
    type ActaReparo,
    type ActasAdvancedFilters,
} from './types';

const PAGE_SIZE = 250;

/**
 * Tab `Actas` de la página Centro de Mando: Actas y Expedientes.
 *
 * Alcance de TASK-004a (búsqueda + tabla):
 *  - Búsqueda debounced (250 ms) sobre la lista de actas.
 *  - Tabla con 11 columnas + virtualización cuando hay >100 filas
 *    (TASK-004c: umbral bajado de 200 a 100).
 *  - Paginación client-side (el backend aún no expone `total`).
 *  - Banner de error de carga (TASK-004c: añadido a partir de issue
 *    menor de TASK-004a).
 *
 * Alcance de TASK-004b:
 *  - Disclosure/colapsable arriba con el formulario de upload (dropzone +
 *    pickers + metadatos).
 *  - Botón "Filtros" junto a la barra de búsqueda.
 *  - Drawer lateral derecho (`Sheet`) con los filtros estructurados
 *    (fechas, impuesto, fiscal, supervisor, estado).
 *  - Filtros aplicados client-side sobre el array recibido del backend.
 *
 * Alcance de TASK-004c (este commit):
 *  - Dialogs de edición, vinculación y eliminación, cableados al menú
 *    "..." de cada fila.
 *  - Warning de concurrencia del dialog de edición, basado en
 *    `fechaNotificado` (campo degradado del shape `RepairReportResumenItem`).
 *  - Absorción de los 5 issues menores de TASK-004a (umbrales, testids,
 *    banner de error, etc.).
 *
 * Fuera de scope:
 *  - TASK-005*: tab de Control de Expedientes.
 *  - Picker de fiscal/supervisor en el dialog de edición (issue MEDIUM
 *    de TASK-004b, queda como follow-up).
 */
export function ActasTab() {
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZE);
    const [items, setItems] = useState<ActaReparo[]>([]);
    const [loading, setLoading] = useState(false);
    // TASK-004a (issue menor #4): estado de error de carga para mostrar
    // un banner discreto. Anteriormente el `catch` de `load()` era
    // silencioso y el empty state cubría el caso de error, lo cual
    // confundía al usuario (no sabía si la lista estaba vacía o si
    // había fallado la carga).
    const [error, setError] = useState<string | null>(null);
    const debouncedQ = useDebounce(q, 250);

    // TASK-004b: estado del disclosure del formulario de upload.
    // Default: colapsado si ya hay actas cargadas, expandido si la lista
    // está vacía (per guía §4.1.1).
    const [uploadOpen, setUploadOpen] = useState(false);

    // TASK-004b: drawer de filtros.
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState<ActasAdvancedFilters>(
        defaultActasAdvancedFilters,
    );

    const reducedMotion = usePrefersReducedMotion();

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchActasReparo({
                q: debouncedQ,
                page,
                pageSize,
            });
            setItems(data.items);
        } catch (e) {
            // TASK-004a (issue menor #4): persistir el error para que el
            // banner pueda anunciarlo. El `finally` apaga el loading.
            const msg =
                e instanceof Error
                    ? e.message
                    : 'No se pudieron cargar las actas. Intente de nuevo.';
            setError(msg);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [debouncedQ, page, pageSize]);

    useEffect(() => {
        void load();
    }, [load]);

    // Reset a página 1 cuando cambia la búsqueda (no resetear al cambiar
    // `pageSize` para no perder la posición del usuario).
    useEffect(() => {
        setPage(1);
    }, [debouncedQ]);

    // Auto-expandir el formulario de upload si la lista está vacía y todavía
    // no se interactuó con el disclosure (cumplimiento de §4.1.1).
    const [autoExpanded, setAutoExpanded] = useState(true);
    useEffect(() => {
        if (autoExpanded && items.length === 0 && !loading) {
            setUploadOpen(true);
        }
    }, [autoExpanded, items.length, loading]);

    /* ---------------------- filtros client-side ---------------------- */
    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            if (advancedFilters.fechaEntregaDesde) {
                if (!item.fechaEntrega) return false;
                if (item.fechaEntrega.slice(0, 10) < advancedFilters.fechaEntregaDesde)
                    return false;
            }
            if (advancedFilters.fechaEntregaHasta) {
                if (!item.fechaEntrega) return false;
                if (item.fechaEntrega.slice(0, 10) > advancedFilters.fechaEntregaHasta)
                    return false;
            }
            if (
                advancedFilters.impuestoTipo &&
                item.impuestoTipo !== advancedFilters.impuestoTipo
            ) {
                return false;
            }
            if (
                advancedFilters.fiscalUserId &&
                item.fiscalActuanteUserId !== advancedFilters.fiscalUserId
            ) {
                return false;
            }
            if (
                advancedFilters.supervisorUserId &&
                item.supervisorUserId !== advancedFilters.supervisorUserId
            ) {
                return false;
            }
            if (advancedFilters.estado) {
                const isVinculado = item.vinculadoAOperativo;
                if (advancedFilters.estado === 'VINCULADO' && !isVinculado) return false;
                if (advancedFilters.estado === 'PENDIENTE' && isVinculado) return false;
            }
            return true;
        });
    }, [items, advancedFilters]);

    // Contador de filtros activos (para badge del botón "Filtros").
    const activeFilterCount = useMemo(() => {
        let n = 0;
        if (advancedFilters.fechaEntregaDesde) n++;
        if (advancedFilters.fechaEntregaHasta) n++;
        if (advancedFilters.impuestoTipo) n++;
        if (advancedFilters.fiscalUserId) n++;
        if (advancedFilters.supervisorUserId) n++;
        if (advancedFilters.estado) n++;
        return n;
    }, [advancedFilters]);

    return (
        <div
            className="space-y-3"
            data-testid="gestion-actas-panel-actas"
        >
            {/* Disclosure: formulario de upload */}
            <div className="rounded-md border border-border/60 bg-card overflow-hidden">
                <button
                    type="button"
                    onClick={() => {
                        setAutoExpanded(false);
                        setUploadOpen((s) => !s);
                    }}
                    data-testid="actas-upload-toggle"
                    aria-expanded={uploadOpen}
                    aria-controls="actas-upload-panel"
                    className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                >
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <FileUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        Cargar Acta de Reparo
                    </span>
                    <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform ${
                            uploadOpen ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                    />
                </button>
                <AnimatePresence initial={false}>
                    {uploadOpen && (
                        <motion.div
                            id="actas-upload-panel"
                            key="actas-upload-panel"
                            initial={
                                reducedMotion
                                    ? { opacity: 0 }
                                    : { height: 0, opacity: 0 }
                            }
                            animate={
                                reducedMotion
                                    ? { opacity: 1 }
                                    : { height: 'auto', opacity: 1 }
                            }
                            exit={
                                reducedMotion
                                    ? { opacity: 0 }
                                    : { height: 0, opacity: 0 }
                            }
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="overflow-hidden border-t border-border/60"
                        >
                            <div className="p-4">
                                <ActasUploadForm
                                    onUploadComplete={() => {
                                        void load();
                                        // Tras carga exitosa, colapsar el
                                        // disclosure para que la tabla quede
                                        // visible.
                                        setUploadOpen(false);
                                        setAutoExpanded(false);
                                    }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Barra de búsqueda + botón Filtros */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <ActasSearchBar
                    value={q}
                    onChange={setQ}
                    onRefresh={() => void load()}
                    isLoading={loading}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFiltersOpen(true)}
                    data-testid="actas-filters-toggle"
                    aria-label="Abrir filtros"
                    className="gap-1.5"
                >
                    <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                    Filtros
                    {activeFilterCount > 0 && (
                        <span
                            data-testid="actas-filters-count"
                            className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold tabular-nums"
                        >
                            {activeFilterCount}
                        </span>
                    )}
                </Button>
            </div>

            {/* Drawer de filtros */}
            <ActasFiltersDrawer
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                filters={advancedFilters}
                onApply={(f) => {
                    setAdvancedFilters(f);
                    setPage(1);
                }}
                onClear={() => {
                    setAdvancedFilters(defaultActasAdvancedFilters);
                    setPage(1);
                }}
            />

            {/* TASK-004a (issue menor #4): banner de error de carga con
                botón de reintento. `role="alert"` para que screen readers
                lo anuncien apenas aparece. Se muestra solo cuando `error`
                no es null; el botón "Reintentar" dispara el mismo
                `load()` que la carga inicial. */}
            {error && (
                <div
                    data-testid="actas-error-banner"
                    role="alert"
                    className="border border-rose-500/60 bg-rose-500/10 rounded-md px-3 py-2 flex items-start gap-2"
                >
                    <AlertCircle
                        className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5"
                        aria-hidden="true"
                    />
                    <div className="flex-1 text-sm text-rose-700 dark:text-rose-300">
                        <p>{error}</p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void load()}
                        disabled={loading}
                        className="gap-1.5 shrink-0"
                        data-testid="actas-error-retry"
                    >
                        <RefreshCw
                            className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
                            aria-hidden="true"
                        />
                        Reintentar
                    </Button>
                </div>
            )}

            <ActasTable
                items={filteredItems}
                isLoading={loading}
                onRefresh={() => load()}
            />
            <ActasPagination
                page={page}
                pageSize={pageSize}
                total={filteredItems.length}
                onPageChange={setPage}
                onPageSizeChange={(s) => {
                    setPageSize(s);
                    setPage(1);
                }}
            />
        </div>
    );
}
