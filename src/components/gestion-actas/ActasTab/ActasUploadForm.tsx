import { useEffect, useState } from 'react';
import {
    FileUp,
    Search,
    User,
    UserSearch,
    Wallet,
    CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/UI/button';
import { Card, CardContent } from '@/components/UI/card';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/UI/select';
import { Textarea } from '@/components/UI/textarea';
import { MontoInput } from '@/components/gestion-actas/MontoInput';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

import {
    searchContribuyentesParaActaReparo,
    searchUsuariosParaActaReparo,
    type ContribuyenteReparoBusquedaItem,
    type UsuarioActaReparoRow,
} from '@/components/utils/api/fiscal-operaciones-functions';
import {
    uploadRepairReport,
    type RepairReportUploadMeta,
} from '@/components/utils/api/taxpayer-functions';
import type { ImpuestoTipo, ActaFormState } from './types';
import { IMPUESTO_OPTIONS, emptyActaForm } from './types';
import { toAmountString } from '../shared/utils';
import toast from 'react-hot-toast';

/* -------------------------------------------------------------------------- */
/* Constantes y helpers                                                      */
/* -------------------------------------------------------------------------- */

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function buildUploadMeta(
    state: ActaFormState,
    fiscal: UsuarioActaReparoRow | null,
    supervisor: UsuarioActaReparoRow | null,
): RepairReportUploadMeta {
    const m: RepairReportUploadMeta = {};
    if (state.fechaEntrega) m.fechaEntrega = state.fechaEntrega;
    if (state.impuestoTipo) m.impuestoTipo = state.impuestoTipo;
    if (state.numeroExpediente.trim()) m.numeroExpediente = state.numeroExpediente.trim();
    if (state.ejercicioFiscalPeriodo.trim())
        m.ejercicioFiscalPeriodo = state.ejercicioFiscalPeriodo.trim();
    if (state.numeroReparo.trim()) m.numeroReparo = state.numeroReparo.trim();
    if (state.fechaNotificado) m.fechaNotificado = state.fechaNotificado;
    const montoIslr = toAmountString(state.montoIslr);
    if (montoIslr !== undefined) m.montoIslr = montoIslr;
    const montoIva = toAmountString(state.montoIva);
    if (montoIva !== undefined) m.montoIva = montoIva;
    const montoTotal = toAmountString(state.montoTotal);
    if (montoTotal !== undefined) m.montoTotal = montoTotal;
    if (fiscal) m.fiscalActuanteUserId = fiscal.id;
    if (supervisor) m.supervisorUserId = supervisor.id;
    // Tipo de IVA (solo si el impuesto es IVA-ISLR o IVA)
    if (state.impuestoTipo === 'IVA' || state.impuestoTipo === 'IVA-ISLR') {
        if (state.esDebitoFiscal) m.esDebitoFiscal = true;
        if (state.esCreditoFiscal) m.esCreditoFiscal = true;
    }
    // Periodos ISLR (solo si el impuesto es IVA-ISLR o ISLR)
    if (state.impuestoTipo === 'ISLR' || state.impuestoTipo === 'IVA-ISLR') {
        if (state.periodYears.length > 0) {
            m.periods = state.periodYears.map((year) => ({
                year,
                periodo: state.periodLabel.trim() || null,
            }));
        }
    }
    return m;
}

/* -------------------------------------------------------------------------- */
/* Sub-componente: Picker de contribuyente                                    */
/* -------------------------------------------------------------------------- */

function TaxpayerPicker({
    value,
    onPick,
    onClear,
    onCreateNew,
    onAutoFillFiscal,
    onAutoFillSupervisor,
}: {
    value: ContribuyenteReparoBusquedaItem | null;
    onPick: (c: ContribuyenteReparoBusquedaItem) => void;
    onClear: () => void;
    /** Si se define, se muestra un botón «Crear nuevo contribuyente» cuando no hay resultados. */
    onCreateNew?: (currentQuery: string) => void;
    /** Auto-poblar fiscal a partir del `officerId` del contribuyente seleccionado. */
    onAutoFillFiscal: (fiscal: UsuarioActaReparoRow | null) => void;
    /** Auto-poblar supervisor a partir del `supervisorId` del fiscal del contribuyente. */
    onAutoFillSupervisor: (supervisor: UsuarioActaReparoRow | null) => void;
}) {
    const [q, setQ] = useState('');
    const debouncedQ = useDebounce(q.trim(), 350);
    const [results, setResults] = useState<ContribuyenteReparoBusquedaItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (value) return;
        if (debouncedQ.length < 2) {
            setResults([]);
            return;
        }
        let cancelled = false;
        setLoading(true);
        void (async () => {
            try {
                const data = await searchContribuyentesParaActaReparo({
                    q: debouncedQ,
                    limit: 10,
                });
                if (!cancelled) setResults(data.items ?? []);
            } catch {
                if (!cancelled) {
                    toast.error('No se pudo buscar el contribuyente.');
                    setResults([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [debouncedQ, value]);

    function pick(c: ContribuyenteReparoBusquedaItem) {
        onPick(c);
        if (c.fiscalAsignado) {
            const fiscalRow: UsuarioActaReparoRow = {
                id: c.fiscalAsignado.id,
                name: c.fiscalAsignado.name,
                personId: c.fiscalAsignado.personId ?? 0,
                role: 'FISCAL',
                groupId: c.fiscalAsignado.groupId ?? null,
                groupName: c.fiscalAsignado.groupName ?? null,
                supervisorId: c.fiscalAsignado.supervisorId ?? null,
                supervisorName: c.fiscalAsignado.supervisorName ?? null,
            };
            onAutoFillFiscal(fiscalRow);
        } else {
            onAutoFillFiscal(null);
        }
        if (c.supervisorAsignado) {
            const supervisorRow: UsuarioActaReparoRow = {
                id: c.supervisorAsignado.id,
                name: c.supervisorAsignado.name,
                personId: c.supervisorAsignado.personId ?? 0,
                role: 'SUPERVISOR',
                groupId: null,
                groupName: null,
                supervisorId: null,
                supervisorName: null,
            };
            onAutoFillSupervisor(supervisorRow);
        } else {
            onAutoFillSupervisor(null);
        }
    }

    function clear() {
        onClear();
        onAutoFillFiscal(null);
        onAutoFillSupervisor(null);
    }

    if (value) {
        return (
            <div
                className="rounded-md border border-indigo-500/40 bg-indigo-500/5 p-3"
                data-testid="actas-contribuyente-preview"
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                            Contribuyente
                        </p>
                        <p className="font-medium text-foreground text-sm">{value.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                            RIF {value.rif} · Prov. {value.providenceNum}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground break-all">
                            UUID {value.id}
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clear}
                        data-testid="actas-contribuyente-clear"
                    >
                        Cambiar
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <UserSearch className="h-3.5 w-3.5" />
                Buscar contribuyente
            </Label>
            <div className="relative">
                <Search
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                />
                <Input
                    placeholder="Nombre, RIF, providencia, parroquia o UUID… (mín. 2)"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="pl-9 bg-background"
                    data-testid="actas-contribuyente-search"
                />
            </div>
            {debouncedQ.length >= 2 && (
                <div className="rounded-md border border-border bg-muted/20 max-h-56 overflow-y-auto text-sm">
                    {loading ? (
                        <div className="p-3 text-muted-foreground text-xs">Buscando…</div>
                    ) : results.length === 0 ? (
                        <div className="p-3 space-y-2">
                            <div className="text-muted-foreground text-xs">
                                Sin coincidencias en su alcance.
                            </div>
                            {onCreateNew && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onCreateNew(q)}
                                    className="w-full gap-1.5"
                                    data-testid="actas-contribuyente-create-new"
                                >
                                    + Crear nuevo contribuyente
                                </Button>
                            )}
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {results.map((t) => (
                                <li key={t.id}>
                                    <button
                                        type="button"
                                        className="w-full text-left px-3 py-2 hover:bg-muted/60 transition-colors"
                                        onClick={() => pick(t)}
                                    >
                                        <span className="font-medium text-foreground">
                                            {t.name}
                                        </span>
                                        <span className="text-muted-foreground"> · {t.rif}</span>
                                        <span className="block text-xs text-muted-foreground">
                                            Prov. {t.providenceNum}
                                            {t.parish ? ` · ${t.parish.name}` : ''}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Sub-componente: Formulario para crear contribuyente on-the-fly             */
/* -------------------------------------------------------------------------- */

function NewTaxpayerForm({
    value,
    onChange,
    onCancel,
}: {
    value: { rif: string; name: string; providenceNum: string };
    onChange: (data: { rif: string; name: string; providenceNum: string }) => void;
    onCancel: () => void;
}) {
    return (
        <Card className="border-amber-500/40 bg-amber-500/5" data-testid="actas-new-taxpayer-form">
            <CardContent className="pt-3 pb-3 space-y-2">
                <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                            Nuevo contribuyente
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-snug">
                            Complete los datos mínimos; el acta y el contribuyente se crearán
                            en una sola acción.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        data-testid="actas-new-taxpayer-cancel"
                    >
                        Cancelar
                    </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            RIF
                        </Label>
                        <Input
                            value={value.rif}
                            onChange={(e) => onChange({ ...value, rif: e.target.value })}
                            placeholder="J123456789"
                            className="bg-background"
                            data-testid="actas-new-taxpayer-rif"
                        />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            Nombre
                        </Label>
                        <Input
                            value={value.name}
                            onChange={(e) => onChange({ ...value, name: e.target.value })}
                            placeholder="Razón social del contribuyente"
                            className="bg-background"
                            data-testid="actas-new-taxpayer-name"
                        />
                    </div>
                    <div className="space-y-1 sm:col-span-3">
                        <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            N.º Providencia
                        </Label>
                        <Input
                            inputMode="numeric"
                            value={value.providenceNum}
                            onChange={(e) =>
                                onChange({
                                    ...value,
                                    providenceNum: e.target.value.replace(/[^0-9]/g, ''),
                                })
                            }
                            placeholder="Ej. 12345"
                            className="bg-background"
                            data-testid="actas-new-taxpayer-providenceNum"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/* -------------------------------------------------------------------------- */
/* Sub-componente: Picker de fiscal / supervisor                              */
/* (replica del `UsuarioActaPicker` del legacy, líneas 201-313)              */
/* -------------------------------------------------------------------------- */

type PickerMode = 'FISCAL' | 'SUPERVISOR';

function UsuarioActaPicker({
    mode,
    label,
    value,
    onPick,
    onClear,
    description,
    testId,
}: {
    mode: PickerMode;
    label: string;
    value: UsuarioActaReparoRow | null;
    onPick: (u: UsuarioActaReparoRow) => void;
    onClear: () => void;
    description?: string;
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

    if (value) {
        return (
            <Card className="border-border bg-muted/20">
                <CardContent className="pt-3 pb-3 space-y-1 text-sm">
                    <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                {label}
                            </p>
                            <p className="font-medium text-foreground">{value.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {value.personId ? `CI ${value.personId}` : 'Usuario SAC'}
                                {value.groupName ? ` · ${value.groupName}` : ''}
                            </p>
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
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {label}
            </Label>
            {description && (
                <p className="text-[11px] text-muted-foreground leading-snug">{description}</p>
            )}
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
                    <div className="p-2 text-muted-foreground text-xs">
                        Sin resultados en su alcance.
                    </div>
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
/* Sub-componente: Campos de metadatos                                        */
/* -------------------------------------------------------------------------- */

function MetadataFields({
    form,
    setForm,
}: {
    form: ActaFormState;
    setForm: React.Dispatch<React.SetStateAction<ActaFormState>>;
}) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Fecha de entrega
                </Label>
                <Input
                    type="date"
                    value={form.fechaEntrega}
                    onChange={(e) => setForm((s) => ({ ...s, fechaEntrega: e.target.value }))}
                    className="bg-background border-border"
                    data-testid="actas-meta-fechaEntrega"
                />
            </div>

            <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Impuesto
                </Label>
                <Select
                    value={form.impuestoTipo || '__empty__'}
                    onValueChange={(v) =>
                        setForm((s) => ({
                            ...s,
                            impuestoTipo: v === '__empty__' ? '' : (v as ImpuestoTipo),
                        }))
                    }
                >
                    <SelectTrigger
                        className="bg-background border-border"
                        data-testid="actas-meta-impuesto"
                    >
                        <SelectValue placeholder="Seleccione" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__empty__">—</SelectItem>
                        {IMPUESTO_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    N.º expediente
                </Label>
                <Input
                    value={form.numeroExpediente}
                    onChange={(e) => setForm((s) => ({ ...s, numeroExpediente: e.target.value }))}
                    className="bg-background border-border"
                    placeholder="Ej. 2025-2532"
                    data-testid="actas-meta-numeroExpediente"
                />
            </div>

            <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Ejercicio fiscal / período
                </Label>
                <Textarea
                    value={form.ejercicioFiscalPeriodo}
                    onChange={(e) =>
                        setForm((s) => ({ ...s, ejercicioFiscalPeriodo: e.target.value }))
                    }
                    className="bg-background border-border min-h-[72px]"
                    placeholder="Ej. 2023(ISLR)-01/01/2023-31/12/2023(IVA) o 2023-2024"
                    data-testid="actas-meta-ejercicioFiscalPeriodo"
                />
            </div>

            <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    N.º reparo
                </Label>
                <Input
                    value={form.numeroReparo}
                    onChange={(e) => setForm((s) => ({ ...s, numeroReparo: e.target.value }))}
                    className="bg-background border-border"
                    data-testid="actas-meta-numeroReparo"
                />
            </div>

            <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Fecha notificado
                </Label>
                <Input
                    type="date"
                    value={form.fechaNotificado}
                    onChange={(e) => setForm((s) => ({ ...s, fechaNotificado: e.target.value }))}
                    className="bg-background border-border"
                    data-testid="actas-meta-fechaNotificado"
                />
            </div>

            <MontoInput
                label="Monto ISLR"
                value={form.montoIslr}
                onChange={(v) => setForm((s) => ({ ...s, montoIslr: v }))}
                labelClassName="text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                testId="actas-meta-montoIslr"
            />

            <MontoInput
                label="Monto IVA"
                value={form.montoIva}
                onChange={(v) => setForm((s) => ({ ...s, montoIva: v }))}
                labelClassName="text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                testId="actas-meta-montoIva"
            />

            <MontoInput
                label="Total"
                value={form.montoTotal}
                onChange={(v) => setForm((s) => ({ ...s, montoTotal: v }))}
                labelClassName="text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                testId="actas-meta-montoTotal"
            />

            {(form.impuestoTipo === 'IVA' || form.impuestoTipo === 'IVA-ISLR') && (
                <div className="space-y-2 sm:col-span-2 lg:col-span-3 p-3 rounded-md border border-border bg-muted/20">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                            <Wallet className="h-3.5 w-3.5" /> Tipo de IVA en el reparo
                        </p>
                        <span className="text-[10px] text-muted-foreground">Marca ambos si aplica</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label
                            className={cn(
                                "flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors",
                                form.esDebitoFiscal
                                    ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-700 dark:text-indigo-300"
                                    : "bg-background border-border text-muted-foreground hover:border-indigo-500/30"
                            )}
                        >
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-border bg-background text-indigo-600 focus:ring-indigo-500"
                                checked={form.esDebitoFiscal}
                                onChange={(e) => setForm((s) => ({ ...s, esDebitoFiscal: e.target.checked }))}
                                data-testid="actas-meta-esDebitoFiscal"
                            />
                            <div>
                                <p className="text-xs font-bold">Débito fiscal</p>
                                <p className="text-[10px] text-muted-foreground">IVA sobre ventas</p>
                            </div>
                        </label>
                        <label
                            className={cn(
                                "flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors",
                                form.esCreditoFiscal
                                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                                    : "bg-background border-border text-muted-foreground hover:border-emerald-500/30"
                            )}
                        >
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-border bg-background text-emerald-600 focus:ring-emerald-500"
                                checked={form.esCreditoFiscal}
                                onChange={(e) => setForm((s) => ({ ...s, esCreditoFiscal: e.target.checked }))}
                                data-testid="actas-meta-esCreditoFiscal"
                            />
                            <div>
                                <p className="text-xs font-bold">Crédito fiscal</p>
                                <p className="text-[10px] text-muted-foreground">IVA sobre compras</p>
                            </div>
                        </label>
                    </div>
                </div>
            )}

            {(form.impuestoTipo === 'ISLR' || form.impuestoTipo === 'IVA-ISLR') && (
                <div className="space-y-2 sm:col-span-2 lg:col-span-3 p-3 rounded-md border border-border bg-muted/20">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Periodos fiscales cubiertos (ISLR)
                        </p>
                        <span className="text-[10px] text-muted-foreground">Marca uno o varios años</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {[2024, 2025].map((y) => {
                            const active = form.periodYears.includes(y);
                            return (
                                <button
                                    key={y}
                                    type="button"
                                    onClick={() => {
                                        setForm((s) => ({
                                            ...s,
                                            periodYears: active
                                                ? s.periodYears.filter((v) => v !== y)
                                                : [...s.periodYears, y].sort((a, b) => b - a),
                                        }));
                                    }}
                                    data-testid={`actas-meta-periodYear-${y}`}
                                    className={cn(
                                        "px-2.5 py-1 rounded-md text-xs font-mono font-semibold border transition-colors",
                                        active
                                            ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-300"
                                            : "bg-background border-border text-muted-foreground hover:border-emerald-500/30"
                                    )}
                                >
                                    {y}
                                </button>
                            );
                        })}
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            Etiqueta del periodo (opcional)
                        </Label>
                        <Input
                            value={form.periodLabel}
                            onChange={(e) => setForm((s) => ({ ...s, periodLabel: e.target.value }))}
                            placeholder='Ej. "ANUAL", "1", "2"'
                            className="bg-background border-border text-sm"
                            data-testid="actas-meta-periodLabel"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Componente público: ActasUploadForm                                        */
/* -------------------------------------------------------------------------- */

type Props = {
    /**
     * Callback invocado tras un upload exitoso para que el padre refresque
     * la tabla. El formulario NO se cierra solo: el padre decide si colapsa
     * el disclosure (comportamiento esperado: sí, ver EARS).
     */
    onUploadComplete: () => void;
};

/**
 * Formulario de carga de un Acta de Reparo.
 *
 * Composición:
 *  1. `TaxpayerPicker` (búsqueda + preview).
 *  2. `UsuarioActaPicker` × 2 (fiscal / supervisor).
 *  3. `MetadataFields` (10 inputs del formulario).
 *  4. `PdfDropzone` (react-dropzone, max 25 MB).
 *  5. Submit con validación client-side (UUID, MIME, tamaño) y progreso.
 *
 * EARS:
 *  - `WHEN the user submits actas-upload-form`, THE SYSTEM SHALL validate
 *    client-side (UUID, PDF, tamaño) y mostrar progreso.
 *  - `IF the upload fails`, THEN THE SYSTEM SHALL mantener el formulario
 *    abierto y mostrar toast de error (no reset state).
 *
 * Fuera de scope:
 *  - Diálogos de edición / vinculación / eliminación (TASK-004c).
 */
export function ActasUploadForm({ onUploadComplete }: Props) {
    const [taxpayer, setTaxpayer] = useState<ContribuyenteReparoBusquedaItem | null>(null);
    const [fiscal, setFiscal] = useState<UsuarioActaReparoRow | null>(null);
    const [supervisor, setSupervisor] = useState<UsuarioActaReparoRow | null>(null);
    const [form, setForm] = useState<ActaFormState>(emptyActaForm);
    const [uploading, setUploading] = useState(false);
    const [creatingNewTaxpayer, setCreatingNewTaxpayer] = useState(false);
    const [newTaxpayerData, setNewTaxpayerData] = useState<{
        rif: string;
        name: string;
        providenceNum: string;
    }>({ rif: '', name: '', providenceNum: '' });

    function reset() {
        setTaxpayer(null);
        setFiscal(null);
        setSupervisor(null);
        setForm(emptyActaForm());
        setCreatingNewTaxpayer(false);
        setNewTaxpayerData({ rif: '', name: '', providenceNum: '' });
    }

    function handleCancelNewTaxpayer() {
        setCreatingNewTaxpayer(false);
        setNewTaxpayerData({ rif: '', name: '', providenceNum: '' });
    }

    async function handleSubmit() {
        let taxpayerId: string | null = null;
        let meta = buildUploadMeta(form, fiscal, supervisor);

        if (creatingNewTaxpayer) {
            if (!newTaxpayerData.rif || !newTaxpayerData.name || !newTaxpayerData.providenceNum) {
                toast.error('Complete todos los datos del nuevo contribuyente.');
                return;
            }
            const provNum = Number(newTaxpayerData.providenceNum);
            if (!Number.isFinite(provNum) || Number.isNaN(provNum)) {
                toast.error('El N.º Providencia del nuevo contribuyente debe ser un número válido.');
                return;
            }
            meta = {
                ...meta,
                taxpayerRif: newTaxpayerData.rif,
                taxpayerName: newTaxpayerData.name,
                taxpayerProvidenceNum: provNum,
            };
        } else {
            if (!taxpayer) {
                toast.error('Debe seleccionar un contribuyente.');
                return;
            }
            if (!UUID_RE.test(taxpayer.id)) {
                toast.error('El UUID del contribuyente no tiene un formato válido.');
                return;
            }
            taxpayerId = taxpayer.id;
        }

        setUploading(true);
        try {
            await uploadRepairReport(taxpayerId, meta);
            toast.success('Acta creada correctamente.');
            reset();
            onUploadComplete();
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'No se pudo crear el acta.';
            toast.error(msg);
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="space-y-4">
            {creatingNewTaxpayer ? (
                <NewTaxpayerForm
                    value={newTaxpayerData}
                    onChange={setNewTaxpayerData}
                    onCancel={handleCancelNewTaxpayer}
                />
            ) : (
                <TaxpayerPicker
                    value={taxpayer}
                    onPick={setTaxpayer}
                    onClear={() => {
                        setTaxpayer(null);
                        setFiscal(null);
                        setSupervisor(null);
                    }}
                    onCreateNew={(currentQuery) => {
                        setNewTaxpayerData({
                            rif: currentQuery,
                            name: '',
                            providenceNum: '',
                        });
                        setCreatingNewTaxpayer(true);
                    }}
                    onAutoFillFiscal={setFiscal}
                    onAutoFillSupervisor={setSupervisor}
                />
            )}

            <div className="grid gap-3 sm:grid-cols-2">
                <UsuarioActaPicker
                    mode="FISCAL"
                    label="Fiscal actuante"
                    value={fiscal}
                    onPick={(u) => {
                        setFiscal(u);
                        // Si cambia el fiscal, el supervisor podría no aplicar;
                        // limpiamos para forzar re-selección (alineado con el
                        // comportamiento del legacy, líneas 822-829).
                        setSupervisor(null);
                    }}
                    onClear={() => {
                        setFiscal(null);
                        setSupervisor(null);
                    }}
                    description="Seleccione el usuario fiscal del SAC. El grupo se asocia según el fiscal elegido."
                    testId="actas-fiscal-search"
                />
                <UsuarioActaPicker
                    mode="SUPERVISOR"
                    label="Supervisor"
                    value={supervisor}
                    onPick={setSupervisor}
                    onClear={() => setSupervisor(null)}
                    description="Supervisor del SAC vinculado al acta."
                    testId="actas-supervisor-search"
                />
            </div>

            <MetadataFields form={form} setForm={setForm} />

            <div className="flex flex-wrap gap-2 pt-1">
                <Button
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={uploading}
                    data-testid="actas-upload-submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
                    aria-busy={uploading}
                >
                    <FileUp
                        className={`h-4 w-4 ${uploading ? 'animate-pulse' : ''}`}
                        aria-hidden="true"
                    />
                    {uploading ? 'Subiendo…' : 'Subir acta'}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={reset}
                    disabled={uploading}
                >
                    Limpiar datos del acta
                </Button>
            </div>
        </div>
    );
}
