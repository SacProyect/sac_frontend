import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FixedSizeList, type ListChildComponentProps } from 'react-window';
import { ExternalLink, FileText } from 'lucide-react';
import { Badge } from '@/components/UI/badge';
import { Button } from '@/components/UI/button';
import { Skeleton } from '@/components/UI/skeleton';
import { ActasDeleteDialog } from './ActasDeleteDialog';
import { ActasEditDialog } from './ActasEditDialog';
import { ActasLinkDialog } from './ActasLinkDialog';
import { ActasRowMenu } from './ActasRowMenu';
import type { ActaReparo } from './types';

type Props = {
    items: ActaReparo[];
    isLoading: boolean;
    /**
     * Callback invocado por los dialogs al completar una acción
     * (save / link / delete) y por el banner de "Recargar" del
     * ActasEditDialog, para que el padre refresque la lista. El
     * retorno es ignorado (puede ser síncrono o asíncrono). Opcional:
     * si no se provee, los dialogs siguen funcionando pero el caller
     * no se entera del cambio (útil para tests / preview).
     */
    onRefresh?: () => void;
};

const COL_COUNT = 11;
const ROW_HEIGHT = 56;
// TASK-004a (issue menor #1): el umbral original de 200 filas era
// demasiado alto; para tablas fiscales típicas se prefiere virtualizar
// desde las 100 filas para mantener DOM liviano. Por debajo de 100
// se mantiene la tabla plana (mejor accesibilidad de screen readers).
const VIRT_THRESHOLD = 100;
const DEFAULT_LIST_HEIGHT = 560;
const SKELETON_ROW_COUNT = 5;

const GRID_TEMPLATE = [
    'minmax(180px,1.5fr)', // 1. Contribuyente
    'minmax(110px,1fr)', // 2. RIF
    'minmax(90px,auto)', // 3. N.º exp.
    'minmax(100px,auto)', // 4. N.º reparo
    'minmax(90px,auto)', // 5. Impuesto
    'minmax(110px,auto)', // 6. Total
    'minmax(120px,1fr)', // 7. Fiscal (acta)
    'minmax(120px,1fr)', // 8. Fiscal SAC
    'minmax(95px,auto)', // 9. Operativo
    'minmax(75px,auto)', // 10. PDF
    'minmax(220px,auto)', // 11. Acciones
].join(' ');

const ROW_CLASS =
    'grid items-center gap-2 px-3 border-b border-border/40 ' +
    'hover:bg-muted/40 transition-none';

function fmtMoney(n: number | null | undefined): string {
    if (n == null || Number.isNaN(n)) return '—';
    return n.toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

const HEADER_CELLS: ReadonlyArray<{ label: string; align: 'left' | 'right' }> = [
    { label: 'Contribuyente', align: 'left' },
    { label: 'RIF', align: 'left' },
    { label: 'N.º exp.', align: 'left' },
    { label: 'N.º reparo', align: 'left' },
    { label: 'Impuesto', align: 'left' },
    { label: 'Total', align: 'right' },
    { label: 'Fiscal (acta)', align: 'left' },
    { label: 'Fiscal SAC', align: 'left' },
    { label: 'Operativo', align: 'left' },
    { label: 'PDF', align: 'right' },
    { label: 'Acciones', align: 'right' },
];

/* ------------------------------------------------------------------ */
/* Row (virtualized) — recibe el array vía `itemData` para memoizar   */
/* ------------------------------------------------------------------ */

type RowData = {
    items: ActaReparo[];
    onEdit: (row: ActaReparo) => void;
    onLink: (row: ActaReparo) => void;
    onDelete: (row: ActaReparo) => void;
};

const ActaRowVirtualized = memo(function ActaRowVirtualized({
    index,
    style,
    data,
}: ListChildComponentProps<RowData>) {
    const item = data.items[index];
    if (!item) return null;
    return (
        <ActaRowContent
            item={item}
            index={index}
            style={style}
            onEdit={data.onEdit}
            onLink={data.onLink}
            onDelete={data.onDelete}
        />
    );
});

/* ------------------------------------------------------------------ */
/* Row (flat) — usado cuando items.length <= VIRT_THRESHOLD           */
/* ------------------------------------------------------------------ */

function ActaRowFlat({
    item,
    index,
    onEdit,
    onLink,
    onDelete,
}: {
    item: ActaReparo;
    index: number;
    onEdit: (row: ActaReparo) => void;
    onLink: (row: ActaReparo) => void;
    onDelete: (row: ActaReparo) => void;
}) {
    return (
        <ActaRowContent
            item={item}
            index={index}
            onEdit={onEdit}
            onLink={onLink}
            onDelete={onDelete}
        />
    );
}

/* ------------------------------------------------------------------ */
/* Contenido de la fila — compartido entre virtualizado y plano       */
/* ------------------------------------------------------------------ */

/**
 * Una sola línea, con truncado por elipsis si el contenido excede el ancho.
 * `min-w-0` es obligatorio en grid items para que el truncado funcione
 * (default `min-width: auto` impide el shrink).
 */
const cellSingle = 'text-xs min-w-0 truncate';
const cellRight = 'text-xs min-w-0 truncate text-right font-mono tabular-nums';

type ActaRowContentProps = {
    item: ActaReparo;
    index: number;
    style?: React.CSSProperties;
    onEdit: (row: ActaReparo) => void;
    onLink: (row: ActaReparo) => void;
    onDelete: (row: ActaReparo) => void;
};

function ActaRowContent({
    item,
    index,
    style,
    onEdit,
    onLink,
    onDelete,
}: ActaRowContentProps) {
    // aria-rowindex es 1-based: la fila 1 es la cabecera, las de datos
    // empiezan en 2.
    const ariaRowIndex = index + 2;
    const vinculado = item.vinculadoAOperativo;

    return (
        <div
            role="row"
            aria-rowindex={ariaRowIndex}
            data-testid={`actas-row-${item.id}`}
            className={ROW_CLASS}
            style={{ gridTemplateColumns: GRID_TEMPLATE, ...(style ?? {}) }}
        >
            <div role="gridcell" className="min-w-0 text-xs">
                <div className="font-medium text-foreground line-clamp-2" title={item.contribuyente}>
                    {item.contribuyente}
                </div>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    {item.taxpayerId.slice(0, 8)}…
                </p>
            </div>
            <div
                role="gridcell"
                className={`${cellSingle} font-mono text-muted-foreground`}
                title={item.rif}
            >
                {item.rif}
            </div>
            <div role="gridcell" className={cellSingle}>
                {item.numeroExpediente ?? '—'}
            </div>
            <div role="gridcell" className={cellSingle}>
                {item.numeroReparo ?? '—'}
            </div>
            <div role="gridcell" className={cellSingle}>
                {item.impuestoTipo ?? '—'}
            </div>
            <div role="gridcell" className={cellRight}>
                {fmtMoney(item.montoTotal)}
            </div>
            <div
                role="gridcell"
                className={`${cellSingle} text-muted-foreground`}
                title={item.fiscalActuante ?? undefined}
            >
                {item.fiscalActuante ?? '—'}
            </div>
            <div
                role="gridcell"
                className={`${cellSingle} text-muted-foreground`}
                title={item.fiscalNombre ?? undefined}
            >
                {item.fiscalNombre ?? '—'}
            </div>
            <div role="gridcell" className="min-w-0 text-xs">
                {vinculado ? (
                    <Badge
                        variant="secondary"
                        className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        data-testid={`actas-row-${item.id}-status`}
                    >
                        Vinculado
                    </Badge>
                ) : (
                    <Badge
                        variant="outline"
                        className="text-amber-700 dark:text-amber-400 border-amber-600/40"
                        data-testid={`actas-row-${item.id}-status`}
                    >
                        Pendiente
                    </Badge>
                )}
            </div>
            <div role="gridcell" className="text-right">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-7 w-7"
                    asChild
                    aria-label={`Abrir PDF del acta ${item.contribuyente}`}
                >
                    <a
                        href={item.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`actas-row-${item.id}-open-pdf`}
                    >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                </Button>
            </div>
            <div role="gridcell" className="text-right">
                <div className="flex justify-end">
                    <ActasRowMenu
                        row={item}
                        onEdit={() => onEdit(item)}
                        onLink={() => onLink(item)}
                        onDelete={() => onDelete(item)}
                    />
                </div>
            </div>
        </div>
    );
}

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
                <Skeleton className="h-9 w-full" />
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
                    No hay actas en su alcance o ningún resultado coincide con la búsqueda.
                </span>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Header                                                             */
/* ------------------------------------------------------------------ */

function ActasHeader() {
    return (
        <div
            role="row"
            aria-rowindex={1}
            className="grid items-center gap-2 px-3 py-2 sticky top-0 z-10 bg-muted/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-border"
            style={{ gridTemplateColumns: GRID_TEMPLATE }}
            data-testid="actas-table-header"
        >
            {HEADER_CELLS.map((cell, i) => {
                const isLast = i === HEADER_CELLS.length - 1;
                return (
                    <div
                        key={cell.label}
                        role="columnheader"
                        aria-colindex={i + 1}
                        className={
                            'text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap ' +
                            (cell.align === 'right' ? 'text-right' : 'text-left') +
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
/* Componente público                                                 */
/* ------------------------------------------------------------------ */

/**
 * Tabla virtualizada de Actas de Reparo.
 *
 * - 11 columnas según guía §4.1.2.
 * - Virtualización con `react-window` `FixedSizeList` cuando
 *   `items.length > VIRT_THRESHOLD` (TASK-004c: ahora 100, antes 200).
 *   Por debajo del threshold, render plano (mejor accesibilidad de
 *   screen readers, sin virtualización).
 * - ARIA grid pattern (W3C) con `role="grid"`, `aria-rowcount`,
 *   `aria-colcount={11}` y `aria-rowindex` por fila.
 * - Header sticky fuera del scroll container del `FixedSizeList` (siempre
 *   visible al scrollear la lista).
 * - Loading: 5 filas skeleton (`h-9` cada una).
 * - Empty: estado central con icono + texto.
 * - Tres dialogs controlados desde aquí (Edición, Vinculación,
 *   Eliminación) y un menú de fila (ActasRowMenu) que dispara los
 *   callbacks de apertura.
 *
 * Nota sobre el header sticky: en esta implementación el header está fuera
 * del `FixedSizeList` (que crea su propio scroll container), por lo que
 * `position: sticky` opera contra el scroll del documento, no contra el
 * scroll interno. Como el header es hermano del FixedSizeList dentro del
 * grid wrapper, permanece visible mientras el cuerpo scrollea — efecto
 * visual equivalente al original sin la complejidad de un nested sticky.
 */
export function ActasTable({ items, isLoading, onRefresh }: Props) {
    const useVirt = items.length > VIRT_THRESHOLD;
    const [listHeight, setListHeight] = useState(DEFAULT_LIST_HEIGHT);

    // Estado de los 3 dialogs. Cada uno guarda la fila objetivo (o null).
    const [editingRow, setEditingRow] = useState<ActaReparo | null>(null);
    const [linkingRow, setLinkingRow] = useState<ActaReparo | null>(null);
    const [deletingRow, setDeletingRow] = useState<ActaReparo | null>(null);

    // Refresca la fila activa cuando un re-fetch del padre entrega nuevos
    // datos: si la fila en `items` cambió (mismo id, datos nuevos), el
    // dialog recibe la versión actualizada vía prop. Esto es lo que
    // dispara el banner de concurrencia del ActasEditDialog.
    useEffect(() => {
        if (editingRow) {
            const updated = items.find((i) => i.id === editingRow.id);
            if (updated && updated !== editingRow) {
                setEditingRow(updated);
            }
        }
        if (linkingRow) {
            const updated = items.find((i) => i.id === linkingRow.id);
            if (updated && updated !== linkingRow) {
                setLinkingRow(updated);
            }
        }
        if (deletingRow) {
            const updated = items.find((i) => i.id === deletingRow.id);
            if (updated && updated !== deletingRow) {
                setDeletingRow(updated);
            }
        }
    }, [items, editingRow, linkingRow, deletingRow]);

    const handleEdit = useCallback((row: ActaReparo) => setEditingRow(row), []);
    const handleLink = useCallback((row: ActaReparo) => setLinkingRow(row), []);
    const handleDelete = useCallback((row: ActaReparo) => setDeletingRow(row), []);

    const handleActionCompleted = useCallback(() => {
        if (onRefresh) void onRefresh();
    }, [onRefresh]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const update = () => {
            setListHeight(Math.min(window.innerHeight * 0.65, DEFAULT_LIST_HEIGHT));
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    const itemData = useMemo<RowData>(
        () => ({ items, onEdit: handleEdit, onLink: handleLink, onDelete: handleDelete }),
        [items, handleEdit, handleLink, handleDelete],
    );

    // aria-rowcount incluye la fila de cabecera. Cuando el total es
    // desconocido (loading inicial) se reporta `-1` según W3C ARIA grid
    // pattern, no el conteo de placeholders.
    // TASK-004a (issue menor #3): cuando no hay items, reportar 2 (1
    // cabecera + 1 fila empty state) para que los screen readers no
    // anuncien "0 filas" engañoso.
    const rowCount = isLoading
        ? -1
        : items.length === 0
            ? 2
            : items.length + 1;

    return (
        <div
            className="rounded-sm border border-border/60 overflow-hidden bg-card"
            data-testid="actas-table"
        >
            <div
                role="grid"
                aria-label="Listado de actas de reparo"
                aria-rowcount={rowCount}
                aria-colcount={COL_COUNT}
                aria-busy={isLoading}
                className="w-full"
            >
                <ActasHeader />
                {isLoading ? (
                    <SkeletonRows />
                ) : items.length === 0 ? (
                    <EmptyState />
                ) : useVirt ? (
                    <FixedSizeList<RowData>
                        height={listHeight}
                        width="100%"
                        itemCount={items.length}
                        itemSize={ROW_HEIGHT}
                        itemData={itemData}
                        overscanCount={4}
                        itemKey={(index, data) => data.items[index]?.id ?? index}
                        className="scrollbar-thin"
                    >
                        {ActaRowVirtualized}
                    </FixedSizeList>
                ) : (
                    items.map((item, i) => (
                        <ActaRowFlat
                            key={item.id}
                            item={item}
                            index={i}
                            onEdit={handleEdit}
                            onLink={handleLink}
                            onDelete={handleDelete}
                        />
                    ))
                )}
            </div>

            <ActasEditDialog
                row={editingRow}
                open={editingRow !== null}
                onOpenChange={(open) => {
                    if (!open) setEditingRow(null);
                }}
                onSaved={handleActionCompleted}
                onReload={onRefresh}
            />
            <ActasLinkDialog
                row={linkingRow}
                open={linkingRow !== null}
                onOpenChange={(open) => {
                    if (!open) setLinkingRow(null);
                }}
                onLinked={handleActionCompleted}
            />
            <ActasDeleteDialog
                row={deletingRow}
                open={deletingRow !== null}
                onOpenChange={(open) => {
                    if (!open) setDeletingRow(null);
                }}
                onDeleted={handleActionCompleted}
            />
        </div>
    );
}
