import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import {
    downloadCasosPorFiscalExcel,
    getCasosPorFiscalReport,
} from '@/components/utils/api/fiscal-operaciones-functions';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';
import toast from 'react-hot-toast';
import { ExpedienteCard } from './ExpedienteCard';
import { ExpedientesSearchBar } from './ExpedientesSearchBar';
import { ExpedientesTable } from './ExpedientesTable';
import { ExpedientesTotals } from './ExpedientesTotals';
import { ExpedientesViewToggle } from './ExpedientesViewToggle';
import type { ExpedienteRow, ExpedientesViewMode } from './types';
import './ExpedientesTab.print.css';

const VIEW_STORAGE_KEY = 'gestion-actas:expedientes:view';
/**
 * Cap máximo de filas que el orquestador tolera del backend antes de
 * mostrar el banner "Mostrando hasta N" (guide §3.3.1). El endpoint no
 * expone `total`; este valor se documenta aquí para que sea trivial
 * ajustarlo si el backend cambia el límite.
 */
const PAGE_SIZE = 500;

/**
 * Tab `Control de Expedientes` de la página Centro de Mando: Actas y
 * Expedientes.
 *
 * Alcance de TASK-005a:
 *  - Filtros sticky arriba (Año + Toggle Cards/Tabla + Búsqueda +
 *    Actualizar) — guide §4.2.1.
 *  - Vista Cards (default) con mini-barra estática
 *    (HIGH #3: sin sparkline animado en v1.1) — guide §4.2.2.
 *  - Vista Tabla con 20 columnas y virtualización cuando hay >50 filas
 *    (threshold específico de esta vista, NO el de actas que es 100) —
 *    guide §4.2.3.
 *  - Persistencia de la elección Cards/Tabla en `localStorage` con la
 *    key `gestion-actas:expedientes:view`.
 *  - Skeleton states cubriendo shell + cards (no solo tabla) — guide §5.
 *  - Banner de error de carga con `role="alert"` (MEDIUM #8).
 *  - Banner "Mostrando hasta N" cuando el backend retorna >= `PAGE_SIZE`
 *    filas (HIGH #4 + guide §3.3.1).
 *
 * Alcance de TASK-005b (botón export Excel):
 *  - Botón "Excel" en la SearchBar que invoca `downloadCasosPorFiscalExcel(year)`
 *    con feedback vía toast (success/error) y deshabilita el botón
 *    durante la descarga — guide §4.2.1.
 *
 * Alcance de TASK-005c (print stylesheet):
 *  - Import del CSS `ExpedientesTab.print.css` con bloque `@media print`
 *    que oculta controles, expone solo el contenido del tab y aplica
 *    formato de auditoría (header con fecha, page-break-inside: avoid en
 *    cards/filas, A4 portrait) — guide §10.
 *  - El atributo `data-print-date` del contenedor principal provee la
 *    fecha localizada que el `::before` del CSS usa para el header de
 *    auditoría.
 *
 * Fuera de scope (reservado para tareas posteriores):
 *  - TASK-005b (parcial): sparklines SVG animados con `progresionMensual`
 *    (no implementado en v1.1) y optimizaciones de query.
 */
export function ExpedientesTab() {
    const [year, setYear] = useState(() => new Date().getFullYear());
    const [q, setQ] = useState('');
    const [view, setView] = useState<ExpedientesViewMode>(() => {
        // SSR-safe: leer de localStorage solo si estamos en el browser.
        if (typeof window === 'undefined') return 'cards';
        const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
        return stored === 'table' || stored === 'cards' ? stored : 'cards';
    });
    const [rows, setRows] = useState<ExpedienteRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debouncedQ = useDebounce(q, 250);

    // Persistir la elección de vista en localStorage.
    useEffect(() => {
        try {
            window.localStorage.setItem(VIEW_STORAGE_KEY, view);
        } catch {
            /* localStorage puede estar deshabilitado (modo privado, quota).
               No bloqueamos la app por esto. */
        }
    }, [view]);

    /* ---------------------------- Fetch ---------------------------- */
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getCasosPorFiscalReport(year);
            setRows(res.rows ?? []);
        } catch (e) {
            const msg =
                e instanceof Error ? e.message : 'No se pudo cargar el reporte.';
            setError(msg);
            toast.error(msg);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [year]);

    useEffect(() => {
        void load();
    }, [load]);

    /* ----------------------- Export Excel (TASK-005b) ----------------------- */
    const handleExport = useCallback(async () => {
        setExporting(true);
        try {
            await downloadCasosPorFiscalExcel(year);
            toast.success('Excel descargado.');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error al exportar.');
        } finally {
            setExporting(false);
        }
    }, [year]);

    /* ------------------------ Filtros client-side ------------------------ */
    const filteredRows = useMemo(() => {
        const term = debouncedQ.trim().toLowerCase();
        if (!term) return rows;
        return rows.filter(
            (r) =>
                r.funcionario.toLowerCase().includes(term) ||
                r.cedula.toLowerCase().includes(term) ||
                String(r.coordinacion ?? '').toLowerCase().includes(term) ||
                (r.observaciones?.toLowerCase().includes(term) ?? false),
        );
    }, [rows, debouncedQ]);

    /* ----------------------- Skeleton (loading) ----------------------- */
    if (loading && rows.length === 0) {
        return (
            <div
                className="space-y-3"
                data-testid="gestion-actas-panel-expedientes-loading"
                aria-busy="true"
            >
                {/* Skeleton de shell: filtros */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="h-9 w-[100px] bg-muted/30 rounded-md animate-pulse" />
                    <div className="h-8 w-[180px] bg-muted/30 rounded-md animate-pulse" />
                    <div className="h-9 flex-1 bg-muted/30 rounded-md animate-pulse" />
                </div>
                {/* Skeleton de cards (6) replicando `h-48` con mini-barra */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="border border-border/60 bg-card rounded-md p-4 space-y-3"
                        >
                            <div className="h-4 w-2/3 bg-muted/30 rounded animate-pulse" />
                            <div className="h-3 w-1/2 bg-muted/30 rounded animate-pulse" />
                            <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden flex animate-pulse">
                                <div className="h-full w-2/3 bg-muted/60" />
                                <div className="h-full w-1/3 bg-muted/60" />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="h-8 bg-muted/30 rounded animate-pulse" />
                                <div className="h-8 bg-muted/30 rounded animate-pulse" />
                                <div className="h-8 bg-muted/30 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div
            className="space-y-3"
            data-testid="gestion-actas-panel-expedientes-content"
            data-print-date={new Date().toLocaleDateString('es-VE', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            })}
        >
            {/* Fila de filtros (Año + Toggle + Búsqueda + Actualizar + Excel) */}
            <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs text-muted-foreground flex items-center gap-2">
                    Año:
                    <Input
                        type="number"
                        min={2000}
                        max={2100}
                        value={year}
                        onChange={(e) => {
                            const n = parseInt(e.target.value, 10);
                            if (!Number.isNaN(n)) setYear(n);
                            // Si el input queda vacío, dejamos el valor anterior
                            // para no forzar al usuario a re-tipearlo.
                        }}
                        className="w-[100px] h-9"
                        data-testid="expedientes-year-input"
                        aria-label="Año del reporte de expedientes"
                    />
                </label>
                <ExpedientesViewToggle value={view} onChange={setView} />
                <ExpedientesSearchBar
                    value={q}
                    onChange={setQ}
                    onRefresh={() => void load()}
                    onExport={handleExport}
                    isLoading={loading || exporting}
                />
            </div>

            {/* Banner de error de carga */}
            {error && (
                <div
                    data-testid="expedientes-error-banner"
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
                        data-testid="expedientes-error-retry"
                    >
                        <RefreshCw
                            className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
                            aria-hidden="true"
                        />
                        Reintentar
                    </Button>
                </div>
            )}

            {/* Banner de cap de 500 filas */}
            {rows.length >= PAGE_SIZE && !error && (
                <div
                    data-testid="expedientes-cap-banner"
                    className="border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-2 rounded-md text-xs"
                    role="status"
                >
                    Mostrando los primeros {PAGE_SIZE} resultados. Aplica
                    filtros para acotar la búsqueda.
                </div>
            )}

            {/* Contenido principal: cards o tabla */}
            {filteredRows.length === 0 ? (
                <p className="text-sm text-muted-foreground border border-dashed border-border rounded-lg px-4 py-8 text-center">
                    No hay funcionarios que coincidan con la búsqueda o aún
                    no hay datos para el año.
                </p>
            ) : view === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredRows.map((r, idx) => (
                        // Fallback de `data-testid` documentado (MINOR #13):
                        // si en una iteración futura `fiscalId` viene null,
                        // el testid pasa a `expedientes-card-{idx}` para no
                        // romper la convención.
                        <ExpedienteCard
                            key={r.fiscalId || `idx-${idx}`}
                            row={r}
                        />
                    ))}
                </div>
            ) : (
                <ExpedientesTable rows={filteredRows} />
            )}

            {/* Totales globales (cards o tabla) */}
            <ExpedientesTotals rows={filteredRows} />
        </div>
    );
}
