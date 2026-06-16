import { Briefcase, CheckCircle2, Clock, Users, XCircle } from 'lucide-react';
import type { ExpedienteRow } from './types';

type Props = {
    rows: ExpedienteRow[];
};

/**
 * Card de totales globales del tab Expedientes.
 *
 * Se muestra al final del tab (en ambas vistas: cards y tabla). La tabla
 * ya tiene su propia fila de totales dentro del `TableBody`; este card es
 * la agregación "macro" visible siempre que haya datos.
 *
 * - **Total funcionarios** (cantidad de filas).
 * - **Total casos** (suma de `nroCasos`).
 * - **Σ culminados** (suma de `totalCulminados`, `text-emerald-700` — HIGH #7).
 * - **Σ en proceso** (suma de `totalEnProceso`, `text-amber-600`).
 * - **Σ anulados** (suma de `vdfAnulados + afAnulPuntuales + afAnulIntegrales`,
 *   `text-amber-700`).
 *
 * Todos los totales se computan client-side sobre `rows` para garantizar
 * consistencia con la vista filtrada (el `data.totals` del backend puede
 * ser parcial cuando hay cap de 500 filas).
 *
 * `data-testid="expedientes-totals"` sigue la guía §7.4.
 */
export function ExpedientesTotals({ rows }: Props) {
    if (rows.length === 0) return null;

    let casos = 0;
    let culm = 0;
    let proc = 0;
    let anul = 0;
    for (const r of rows) {
        casos += r.nroCasos;
        culm += r.totalCulminados;
        proc += r.totalEnProceso;
        anul += r.vdfAnulados + r.afAnulPuntuales + r.afAnulIntegrales;
    }
    const funcionarios = rows.length;

    return (
        <div
            data-testid="expedientes-totals"
            className="border border-border bg-muted/40 rounded-md px-4 py-3"
            aria-label="Totales de expedientes por fiscal"
        >
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <div className="flex items-center gap-1.5">
                    <Users
                        className="h-3.5 w-3.5 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                        Funcionarios
                    </span>
                    <span className="font-semibold tabular-nums text-foreground">
                        {funcionarios}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Briefcase
                        className="h-3.5 w-3.5 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                        Casos
                    </span>
                    <span className="font-semibold tabular-nums text-foreground">
                        {casos}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <CheckCircle2
                        className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400"
                        aria-hidden="true"
                    />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                        Σ Culm.
                    </span>
                    <span className="font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {culm}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock
                        className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500"
                        aria-hidden="true"
                    />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                        Σ Proc.
                    </span>
                    <span className="font-bold tabular-nums text-amber-600 dark:text-amber-500">
                        {proc}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <XCircle
                        className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400"
                        aria-hidden="true"
                    />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                        Σ Anul.
                    </span>
                    <span className="font-bold tabular-nums text-amber-700 dark:text-amber-400">
                        {anul}
                    </span>
                </div>
            </div>
        </div>
    );
}
