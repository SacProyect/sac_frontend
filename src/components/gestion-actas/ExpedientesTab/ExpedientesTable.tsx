import { memo, useEffect, useMemo, useState } from 'react';
import { FixedSizeList, type ListChildComponentProps } from 'react-window';
import { FileText } from 'lucide-react';
import { Skeleton } from '@/components/UI/skeleton';
import type { ExpedienteRow } from './types';

type Props = {
    rows: ExpedienteRow[];
    /**
     * Cuando `true`, oculta el contenido y muestra filas skeleton.
     * Usado por el orquestador durante la carga inicial.
     */
    isLoading?: boolean;
};

const COL_COUNT = 20;
const ROW_HEIGHT = 40;
const VIRT_THRESHOLD = 50;
const DEFAULT_LIST_HEIGHT = 560;
const SKELETON_ROW_COUNT = 8;

/**
 * Grid template de 20 columnas (guide §4.2.3).
 * Mismas 20 columnas que `casos-por-fiscal-section.tsx:295-317` (alineado al
 * export Excel). No se cambia el orden ni la cantidad.
 */
const GRID_TEMPLATE = [
    'minmax(160px, 1.5fr)', // 1.  Funcionario
    'minmax(100px, auto)', // 2.  Cédula
    'minmax(70px, auto)', //  3.  N° casos
    'minmax(60px, auto)', //  4.  VDF
    'minmax(75px, auto)', //  5.  VDF culm.
    'minmax(75px, auto)', //  6.  VDF proc.
    'minmax(75px, auto)', //  7.  VDF anul.
    'minmax(75px, auto)', //  8.  AF total
    'minmax(60px, auto)', //  9.  Punt.
    'minmax(60px, auto)', //  10. Integ.
    'minmax(80px, auto)', //  11. AF culm. P
    'minmax(80px, auto)', //  12. AF culm. I
    'minmax(80px, auto)', //  13. AF proc. P
    'minmax(80px, auto)', //  14. AF proc. I
    'minmax(80px, auto)', //  15. AF anul. P
    'minmax(80px, auto)', //  16. AF anul. I
    'minmax(75px, auto)', //  17. Σ culm.
    'minmax(75px, auto)', //  18. Σ proc.
    'minmax(70px, auto)', //  19. Coord.
    'minmax(200px, 1fr)', //  20. Observaciones
].join(' ');

const HEADER_CELLS: ReadonlyArray<{ label: string; align: 'left' | 'right' | 'center' }> = [
    { label: 'Funcionario', align: 'left' },
    { label: 'Cédula', align: 'left' },
    { label: 'N° casos', align: 'right' },
    { label: 'VDF', align: 'right' },
    { label: 'VDF culm.', align: 'right' },
    { label: 'VDF proc.', align: 'right' },
    { label: 'VDF anul.', align: 'right' },
    { label: 'AF total', align: 'right' },
    { label: 'Punt.', align: 'right' },
    { label: 'Integ.', align: 'right' },
    { label: 'AF culm. P', align: 'right' },
    { label: 'AF culm. I', align: 'right' },
    { label: 'AF proc. P', align: 'right' },
    { label: 'AF proc. I', align: 'right' },
    { label: 'AF anul. P', align: 'right' },
    { label: 'AF anul. I', align: 'right' },
    { label: 'Σ culm.', align: 'right' },
    { label: 'Σ proc.', align: 'right' },
    { label: 'Coord.', align: 'center' },
    { label: 'Observaciones', align: 'left' },
];

const ROW_CLASS =
    'grid items-center gap-2 px-3 border-b border-border/40 ' +
    'hover:bg-muted/40 transition-none';

const cellText = 'text-xs min-w-0 truncate';
const cellRight = 'text-xs min-w-0 truncate text-right tabular-nums';

/* ------------------------------------------------------------------ */
/* Totals (computados client-side sobre `rows`)                       */
/* ------------------------------------------------------------------ */

type Totals = {
    funcionarios: number;
    casos: number;
    culm: number;
    proc: number;
    anulados: number;
};

function computeTotals(rows: ExpedienteRow[]): Totals {
    let casos = 0;
    let culm = 0;
    let proc = 0;
    let anul = 0;
    for (const r of rows) {
        casos += r.nroCasos;
        culm += r.totalCulminados;
        proc += r.totalEnProceso;
        anul +=
            r.vdfAnulados + r.afAnulPuntuales + r.afAnulIntegrales;
    }
    return {
        funcionarios: rows.length,
        casos,
        culm,
        proc,
        anulados: anul,
    };
}

/* ------------------------------------------------------------------ */
/* Row content (compartido virtualizado y plano)                      */
/* ------------------------------------------------------------------ */

type RowContentProps = {
    row: ExpedienteRow;
    index: number;
    style?: React.CSSProperties;
};

function RowContent({ row, index, style }: RowContentProps) {
    // aria-rowindex es 1-based: la fila 1 es la cabecera, las de datos
    // empiezan en 2.
    const ariaRowIndex = index + 2;
    return (
        <div
            role="row"
            aria-rowindex={ariaRowIndex}
            data-testid={`expedientes-row-${row.fiscalId}`}
            className={ROW_CLASS}
            style={{ gridTemplateColumns: GRID_TEMPLATE, ...(style ?? {}) }}
        >
            <div role="gridcell" className={`${cellText} font-medium text-foreground`}>
                {row.funcionario}
            </div>
            <div
                role="gridcell"
                className={`${cellText} font-mono text-muted-foreground`}
                title={row.cedula}
            >
                {row.cedula}
            </div>
            <div role="gridcell" className={cellRight}>
                {row.nroCasos}
            </div>
            <div role="gridcell" className={cellRight}>
                {row.vdfTotal}
            </div>
            <div role="gridcell" className={cellRight}>
                {row.vdfCulminados}
            </div>
            <div role="gridcell" className={cellRight}>
                {row.vdfEnProceso}
            </div>
            <div
                role="gridcell"
                className={`${cellRight} text-amber-700 dark:text-amber-400`}
            >
                {row.vdfAnulados}
            </div>
            <div role="gridcell" className={cellRight}>
                {row.afTotal}
            </div>
            <div role="gridcell" className={cellRight}>
                {row.afPuntuales}
            </div>
            <div role="gridcell" className={cellRight}>
                {row.afIntegrales}
            </div>
            <div role="gridcell" className={cellRight}>
                {row.afCulmPuntuales}
            </div>
            <div role="gridcell" className={cellRight}>
                {row.afCulmIntegrales}
            </div>
            <div role="gridcell" className={cellRight}>
                {row.afProcPuntuales}
            </div>
            <div role="gridcell" className={cellRight}>
                {row.afProcIntegrales}
            </div>
            <div role="gridcell" className={cellRight}>
                {row.afAnulPuntuales}
            </div>
            <div role="gridcell" className={cellRight}>
                {row.afAnulIntegrales}
            </div>
            <div role="gridcell" className={`${cellRight} font-semibold`}>
                {row.totalCulminados}
            </div>
            <div role="gridcell" className={`${cellRight} font-semibold`}>
                {row.totalEnProceso}
            </div>
            <div role="gridcell" className={`${cellText} text-center tabular-nums`}>
                {row.coordinacion != null ? row.coordinacion : '—'}
            </div>
            <div
                role="gridcell"
                className={`${cellText} text-muted-foreground`}
                title={row.observaciones || undefined}
            >
                {row.observaciones || '—'}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Row virtualizada                                                   */
/* ------------------------------------------------------------------ */

type RowData = { items: ExpedienteRow[] };

const RowVirtualized = memo(function RowVirtualized({
    index,
    style,
    data,
}: ListChildComponentProps<RowData>) {
    const item = data.items[index];
    if (!item) return null;
    return <RowContent row={item} index={index} style={style} />;
});

/* ------------------------------------------------------------------ */
/* Skeleton row                                                       */
/* ------------------------------------------------------------------ */

function SkeletonRow({ index }: { index: number }) {
    return (
        <div
            role="row"
            aria-rowindex={index + 2}
            className={ROW_CLASS}
            style={{ gridTemplateColumns: GRID_TEMPLATE }}
        >
            <div role="gridcell" className="col-span-full">
                <Skeleton className="h-6 w-full" />
            </div>
        </div>
    );
}

function SkeletonRows() {
    return (
        <>
            {Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
                <SkeletonRow key={i} index={i} />
            ))}
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyState() {
    return (
        <div
            role="row"
            aria-rowindex={2}
            className="border-b border-border/40"
            style={{ gridTemplateColumns: GRID_TEMPLATE }}
        >
            <div
                role="gridcell"
                className="col-span-full flex flex-col items-center justify-center gap-2 py-10 text-sm text-muted-foreground"
            >
                <FileText className="h-6 w-6 text-muted-foreground/60" aria-hidden="true" />
                <span>
                    Ningún funcionario coincide con la búsqueda. Ajuste el filtro o cambie de año.
                </span>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Header                                                             */
/* ------------------------------------------------------------------ */

function TableHeader() {
    return (
        <div
            role="row"
            aria-rowindex={1}
            className="grid items-center gap-2 px-3 py-2 sticky top-0 z-10 bg-muted/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-border"
            style={{ gridTemplateColumns: GRID_TEMPLATE }}
            data-testid="expedientes-table-header"
        >
            {HEADER_CELLS.map((cell, i) => {
                const isLast = i === HEADER_CELLS.length - 1;
                const alignClass =
                    cell.align === 'right'
                        ? 'text-right'
                        : cell.align === 'center'
                            ? 'text-center'
                            : 'text-left';
                return (
                    <div
                        key={cell.label}
                        role="columnheader"
                        aria-colindex={i + 1}
                        className={
                            'text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap ' +
                            alignClass +
                            (isLast ? ' min-w-[200px]' : '')
                        }
                    >
                        {cell.label}
                    </div>
                );
            })}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Totals row (al final del TableBody)                                */
/* ------------------------------------------------------------------ */

function TotalsRow({ totals }: { totals: Totals }) {
    return (
        <div
            role="row"
            className="grid items-center gap-2 px-3 py-2 bg-muted/60 dark:bg-slate-800/80 border-t-2 border-border font-semibold"
            style={{ gridTemplateColumns: GRID_TEMPLATE }}
            data-testid="expedientes-row-totals"
        >
            <div role="gridcell" className={`${cellText} text-foreground`}>
                TOTAL
                <span className="ml-1 text-muted-foreground font-normal text-[10px]">
                    ({totals.funcionarios} func.)
                </span>
            </div>
            <div role="gridcell" className={cellText} />
            <div role="gridcell" className={cellRight}>
                {totals.casos}
            </div>
            <div role="gridcell" className={cellText} />
            <div role="gridcell" className={cellText} />
            <div role="gridcell" className={cellText} />
            <div role="gridcell" className={cellText} />
            <div role="gridcell" className={cellText} />
            <div role="gridcell" className={cellText} />
            <div role="gridcell" className={cellText} />
            <div role="gridcell" className={cellText} />
            <div role="gridcell" className={cellText} />
            <div role="gridcell" className={cellText} />
            <div role="gridcell" className={cellText} />
            <div role="gridcell" className={cellText} />
            <div role="gridcell" className={cellText} />
            <div
                role="gridcell"
                className={`${cellRight} text-emerald-700 dark:text-emerald-400`}
            >
                {totals.culm}
            </div>
            <div
                role="gridcell"
                className={`${cellRight} text-amber-700 dark:text-amber-400`}
            >
                {totals.proc}
            </div>
            <div role="gridcell" className={cellText} />
            <div
                role="gridcell"
                className={`${cellText} text-amber-700 dark:text-amber-400`}
            >
                {totals.anulados > 0 ? `${totals.anulados} anul.` : '—'}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Componente público                                                 */
/* ------------------------------------------------------------------ */

/**
 * Tabla de Control de Expedientes (guide §4.2.3).
 *
 * - 20 columnas alineadas al Excel export.
 * - Virtualización con `react-window` `FixedSizeList` cuando
 *   `items.length > VIRT_THRESHOLD` (= 50). Por debajo del threshold,
 *   render plano (mejor accesibilidad de screen readers).
 * - ARIA grid pattern (W3C) con `role="grid"`, `aria-rowcount`,
 *   `aria-colcount={20}` y `aria-rowindex` por fila.
 * - Header sticky fuera del scroll container del `FixedSizeList` (siempre
 *   visible al scrollear la lista).
 * - Fila de totales al final del cuerpo con `bg-muted/60` y bordes
 *   `border-t-2 border-border font-semibold` (idéntica al ref legacy).
 * - Loading: 8 filas skeleton (`h-6` cada una).
 * - Empty: estado central con icono + texto.
 */
export function ExpedientesTable({ rows, isLoading = false }: Props) {
    const useVirt = rows.length > VIRT_THRESHOLD;
    const [listHeight, setListHeight] = useState(DEFAULT_LIST_HEIGHT);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const update = () => {
            setListHeight(Math.min(window.innerHeight * 0.65, DEFAULT_LIST_HEIGHT));
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    const itemData = useMemo<RowData>(() => ({ items: rows }), [rows]);
    const totals = useMemo(() => computeTotals(rows), [rows]);

    // aria-rowcount incluye la fila de cabecera + fila de totales.
    // Cuando el total es desconocido (loading inicial) se reporta `-1`
    // según W3C ARIA grid pattern. Cuando no hay items, reportar 2
    // (1 cabecera + 1 fila empty state).
    const rowCount = isLoading
        ? -1
        : rows.length === 0
            ? 2
            : rows.length + 1; // +1 cabecera. La fila de totales NO suma
            //   al `rowCount` (no es una fila de datos, es metadato).

    return (
        <div
            className="rounded-sm border border-border/60 overflow-hidden bg-card"
            data-testid="expedientes-table"
        >
            <div
                role="grid"
                aria-label="Listado de expedientes por fiscal"
                aria-rowcount={rowCount}
                aria-colcount={COL_COUNT}
                aria-busy={isLoading}
                className="w-full overflow-x-auto scrollbar-thin"
            >
                <div className="min-w-[1800px]">
                <TableHeader />
                {isLoading ? (
                    <SkeletonRows />
                ) : rows.length === 0 ? (
                    <EmptyState />
                ) : useVirt ? (
                    <>
                        <FixedSizeList<RowData>
                            height={listHeight}
                            width="100%"
                            itemCount={rows.length}
                            itemSize={ROW_HEIGHT}
                            itemData={itemData}
                            overscanCount={4}
                            itemKey={(index, data) => data.items[index]?.fiscalId ?? index}
                            className="scrollbar-thin"
                        >
                            {RowVirtualized}
                        </FixedSizeList>
                        {/* Fila de totales fuera de la virtualización para
                            garantizar visibilidad permanente. */}
                        <TotalsRow totals={totals} />
                    </>
                ) : (
                    <>
                        {rows.map((row, i) => (
                            <RowContent key={row.fiscalId} row={row} index={i} />
                        ))}
                        <TotalsRow totals={totals} />
                    </>
                )}
                </div>
            </div>
        </div>
    );
}
