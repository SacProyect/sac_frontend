import { useEffect, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/UI/sheet';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/UI/select';
import {
    searchUsuariosParaActaReparo,
    type UsuarioActaReparoRow,
} from '@/components/utils/api/fiscal-operaciones-functions';
import { useDebounce } from '@/hooks/use-debounce';
import {
    defaultActasAdvancedFilters,
    type ActasAdvancedFilters,
    type ImpuestoTipo,
} from './types';
import toast from 'react-hot-toast';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: ActasAdvancedFilters;
    onApply: (f: ActasAdvancedFilters) => void;
    onClear: () => void;
};

const IMPUESTO_OPTIONS: ReadonlyArray<{ value: ImpuestoTipo; label: string }> = [
    { value: 'IVA-ISLR', label: 'IVA-ISLR' },
    { value: 'ISLR', label: 'ISLR' },
    { value: 'IVA', label: 'IVA' },
];

const ESTADO_OPTIONS: ReadonlyArray<{ value: '' | 'VINCULADO' | 'PENDIENTE'; label: string }> = [
    { value: '', label: 'Todos' },
    { value: 'VINCULADO', label: 'Vinculado' },
    { value: 'PENDIENTE', label: 'Pendiente' },
];

/* -------------------------------------------------------------------------- */
/* Sub-componente: Picker de usuario (fiscal/supervisor) — versión inline     */
/* para el drawer. Replica el patrón "card-as-picker" del legacy (líneas      */
/* 201-313 de reparos-actas-section.tsx) y el §4.1.3 de la guía.              */
/* -------------------------------------------------------------------------- */

type PickerMode = 'FISCAL' | 'SUPERVISOR';

function UsuarioFilterPicker({
    mode,
    label,
    selectedId,
    selectedName,
    onPick,
    onClear,
    testId,
}: {
    mode: PickerMode;
    label: string;
    selectedId: string;
    selectedName: string;
    onPick: (u: UsuarioActaReparoRow) => void;
    onClear: () => void;
    testId: string;
}) {
    const [q, setQ] = useState('');
    const debouncedQ = useDebounce(q.trim(), 300);
    const [results, setResults] = useState<UsuarioActaReparoRow[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        void (async () => {
            try {
                const data = await searchUsuariosParaActaReparo({
                    tipo: mode,
                    q: debouncedQ.length ? debouncedQ : undefined,
                    limit: 22,
                });
                if (!cancelled) setResults(data.items ?? []);
            } catch {
                if (!cancelled) {
                    toast.error('No se pudo buscar personal.');
                    setResults([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [debouncedQ, mode]);

    if (selectedId) {
        return (
            <div className="rounded-md border border-border/60 bg-muted/20 p-3">
                <div className="flex justify-between items-start gap-2">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            {label}
                        </p>
                        <p className="font-medium text-foreground text-sm mt-0.5">{selectedName}</p>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onClear}
                        data-testid={`${testId}-clear`}
                    >
                        Cambiar
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {label}
            </Label>
            <Input
                placeholder="Nombre o cédula…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="bg-background"
                data-testid={testId}
            />
            <div className="rounded-md border border-border max-h-40 overflow-y-auto text-sm">
                {loading ? (
                    <div className="p-2 text-muted-foreground text-xs">Buscando…</div>
                ) : results.length === 0 ? (
                    <div className="p-2 text-muted-foreground text-xs">Sin resultados.</div>
                ) : (
                    <ul className="divide-y divide-border">
                        {results.map((u) => (
                            <li key={u.id}>
                                <button
                                    type="button"
                                    className="w-full text-left px-2 py-1.5 hover:bg-muted/60 transition-colors"
                                    onClick={() => onPick(u)}
                                >
                                    <span className="font-medium text-foreground">{u.name}</span>
                                    <span className="text-xs text-muted-foreground block">
                                        CI {u.personId}
                                        {u.groupName ? ` · ${u.groupName}` : ''}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Drawer principal                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Drawer lateral derecho con los filtros estructurados del tab Actas.
 *
 * Es un componente **controlado**: mantiene un `local` que se sincroniza con
 * el prop `filters` cada vez que se abre. Al pulsar "Aplicar" se propaga al
 * padre y se cierra. "Limpiar" resetea el state local y dispara `onClear`
 * para que el padre aplique los valores por defecto.
 *
 * `data-testid` sigue §7.3 de la guía (con la salvedad documentada de que
 * el task usa `actas-filters-drawer` como contenedor; la guía §7.3 propone
 * `actas-filters-sheet`).
 */
export function ActasFiltersDrawer({ open, onOpenChange, filters, onApply, onClear }: Props) {
    const [local, setLocal] = useState<ActasAdvancedFilters>(filters);

    // Re-sincronizar el state local cada vez que el drawer se abre o el
    // padre cambia los filtros externamente (p.ej. "Limpiar" desde fuera).
    useEffect(() => {
        if (open) setLocal(filters);
    }, [open, filters]);

    function handleApply() {
        onApply(local);
        onOpenChange(false);
    }

    function handleClear() {
        setLocal(defaultActasAdvancedFilters);
        onClear();
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="sm:max-w-md overflow-y-auto"
                data-testid="actas-filters-drawer"
            >
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        Filtros
                    </SheetTitle>
                    <SheetDescription>
                        Acota la lista de actas cargadas.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-5">
                    {/* Rango de fechas */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            Fecha de entrega
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground">Desde</span>
                                <Input
                                    type="date"
                                    value={local.fechaEntregaDesde}
                                    onChange={(e) =>
                                        setLocal((s) => ({ ...s, fechaEntregaDesde: e.target.value }))
                                    }
                                    className="bg-background"
                                    data-testid="actas-filters-fecha-desde"
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground">Hasta</span>
                                <Input
                                    type="date"
                                    value={local.fechaEntregaHasta}
                                    onChange={(e) =>
                                        setLocal((s) => ({ ...s, fechaEntregaHasta: e.target.value }))
                                    }
                                    className="bg-background"
                                    data-testid="actas-filters-fecha-hasta"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Impuesto */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            Impuesto
                        </Label>
                        <Select
                            value={local.impuestoTipo || '__empty__'}
                            onValueChange={(v) =>
                                setLocal((s) => ({
                                    ...s,
                                    impuestoTipo: v === '__empty__' ? '' : (v as ImpuestoTipo),
                                }))
                            }
                        >
                            <SelectTrigger
                                className="bg-background"
                                data-testid="actas-filters-impuesto"
                            >
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__empty__">Todos</SelectItem>
                                {IMPUESTO_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Fiscal */}
                    <UsuarioFilterPicker
                        mode="FISCAL"
                        label="Fiscal"
                        selectedId={local.fiscalUserId}
                        selectedName={local.fiscalName}
                        onPick={(u) =>
                            setLocal((s) => ({ ...s, fiscalUserId: u.id, fiscalName: u.name }))
                        }
                        onClear={() =>
                            setLocal((s) => ({ ...s, fiscalUserId: '', fiscalName: '' }))
                        }
                        testId="actas-filters-fiscal-search"
                    />

                    {/* Supervisor */}
                    <UsuarioFilterPicker
                        mode="SUPERVISOR"
                        label="Supervisor"
                        selectedId={local.supervisorUserId}
                        selectedName={local.supervisorName}
                        onPick={(u) =>
                            setLocal((s) => ({ ...s, supervisorUserId: u.id, supervisorName: u.name }))
                        }
                        onClear={() =>
                            setLocal((s) => ({ ...s, supervisorUserId: '', supervisorName: '' }))
                        }
                        testId="actas-filters-supervisor-search"
                    />

                    {/* Estado */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            Estado
                        </Label>
                        <Select
                            value={local.estado || '__empty__'}
                            onValueChange={(v) =>
                                setLocal((s) => ({
                                    ...s,
                                    estado:
                                        v === '__empty__'
                                            ? ''
                                            : (v as 'VINCULADO' | 'PENDIENTE'),
                                }))
                            }
                        >
                            <SelectTrigger
                                className="bg-background"
                                data-testid="actas-filters-estado"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ESTADO_OPTIONS.map((opt) => (
                                    <SelectItem
                                        key={opt.value || 'todos'}
                                        value={opt.value || '__empty__'}
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Footer sticky-ish */}
                <div className="mt-8 sticky bottom-0 -mx-6 px-6 py-4 bg-background border-t border-border/60 flex items-center gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleClear}
                        data-testid="actas-filters-clear"
                        className="gap-1.5"
                    >
                        <X className="h-4 w-4" />
                        Limpiar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleApply}
                        data-testid="actas-filters-apply"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Aplicar filtros
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
