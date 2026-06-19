import { Wallet, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { MontoInput } from '@/components/gestion-actas/MontoInput';
import { cn } from '@/lib/utils';
import { type ActaFormState } from './types';
import type { Dispatch, SetStateAction } from 'react';

type Props = {
    form: ActaFormState;
    setForm: Dispatch<SetStateAction<ActaFormState>>;
    disabled?: boolean;
    testIdPrefix?: string;
};

/**
 * Secciones compartidas de IVA (débito / crédito fiscal) y ISLR (años,
 * etiqueta de período, montos individuales) usadas tanto en el formulario
 * de upload como en el dialog de edición.
 */
export default function ActaTaxSections({
    form,
    setForm,
    disabled = false,
    testIdPrefix = 'actas-meta',
}: Props) {
    return (
        <>
            {/* ── IVA: débito / crédito fiscal ─────────────────────────── */}
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
                                disabled={disabled}
                                data-testid={`${testIdPrefix}-esDebitoFiscal`}
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
                                disabled={disabled}
                                data-testid={`${testIdPrefix}-esCreditoFiscal`}
                            />
                            <div>
                                <p className="text-xs font-bold">Crédito fiscal</p>
                                <p className="text-[10px] text-muted-foreground">IVA sobre compras</p>
                            </div>
                        </label>
                    </div>
                </div>
            )}

            {/* ── ISLR: periodos fiscales ─────────────────────────────── */}
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
                                        setForm((s) => {
                                            const { [y]: _removed, ...restMontos } = s.periodMontos;
                                            return {
                                                ...s,
                                                periodYears: active
                                                    ? s.periodYears.filter((v) => v !== y)
                                                    : [...s.periodYears, y].sort((a, b) => b - a),
                                                periodMontos: active ? restMontos : s.periodMontos,
                                            };
                                        });
                                    }}
                                    data-testid={`${testIdPrefix}-periodYear-${y}`}
                                    disabled={disabled}
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
                    {form.periodYears.length > 0 && (
                        <div className="space-y-2 mt-2 pt-2 border-t border-border/50">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                Monto por período
                            </p>
                            {form.periodYears.map((y) => (
                                <div key={y} className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-semibold text-muted-foreground w-12">{y}</span>
                                    <MontoInput
                                        label=""
                                        value={form.periodMontos[y] ?? ''}
                                        onChange={(v) => setForm((s) => ({
                                            ...s,
                                            periodMontos: { ...s.periodMontos, [y]: v },
                                        }))}
                                        placeholder="Monto del período"
                                        className="bg-background border-border text-sm h-8 flex-1"
                                        labelClassName="sr-only"
                                        testId={`${testIdPrefix}-periodMonto-${y}`}
                                        disabled={disabled}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            Etiqueta del periodo (opcional)
                        </Label>
                        <Input
                            value={form.periodLabel}
                            onChange={(e) => setForm((s) => ({ ...s, periodLabel: e.target.value }))}
                            placeholder='Ej. "ANUAL", "1", "2"'
                            className="bg-background border-border text-sm"
                            data-testid={`${testIdPrefix}-periodLabel`}
                            disabled={disabled}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
