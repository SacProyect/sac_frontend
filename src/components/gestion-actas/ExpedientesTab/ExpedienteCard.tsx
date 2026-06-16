import { FileText } from 'lucide-react';
import type { ExpedienteRow } from './types';

type Props = {
    row: ExpedienteRow;
};

/**
 * Card bento del fiscal (vista Cards, guide §4.2.2).
 *
 * - Layout: `flex flex-col md:flex-row` para colapsar a una sola columna
 *   en < sm.
 * - **Mini-barra estática** (HIGH #3): la barra se calcula client-side con
 *   `totalCulminados / (totalCulminados + totalEnProceso || 1)` y se pinta
 *   con `bg-emerald-500` + `bg-amber-400`. NO incluye sparkline animado
 *   (queda reservado para v1.2 cuando el backend exponga `progresionMensual`).
 * - **Σ Culm.** usa `text-emerald-700 dark:text-emerald-400` (HIGH #7
 *   diferenciador de página, vs. `emerald-600` usado en `/gestion-personal`).
 * - **Σ Proc.** usa `text-amber-700 dark:text-amber-400` (unificado con la
 *   fila de totales; la guía §4.2.2 decía `amber-600` pero TASK-005a unifica
 *   con el totals row para coherencia).
 * - `data-testid="expedientes-card-{fiscalId}"` con fallback `{index}` en
 *   iteraciones futuras (MINOR #13 de la guía).
 */
export function ExpedienteCard({ row }: Props) {
    const culm = row.totalCulminados;
    const proc = row.totalEnProceso;
    const denom = culm + proc;
    const pctCulm = denom > 0 ? (culm / denom) * 100 : 0;
    const pctProc = denom > 0 ? (proc / denom) * 100 : 0;

    return (
        <div
            data-testid={`expedientes-card-${row.fiscalId}`}
            className="flex flex-col md:flex-row md:items-center gap-4 p-4 border border-border/60 bg-card rounded-md shadow-sm transition-colors hover:bg-muted/10"
        >
            {/* Bloque 1 — Identidad */}
            <div className="min-w-[200px] flex-shrink-0">
                <h3 className="text-sm font-bold text-foreground">{row.funcionario}</h3>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    CI {row.cedula} <span className="mx-1.5 opacity-50">•</span>{' '}
                    {row.coordinacion != null ? `Coord. ${row.coordinacion}` : 'Sin Coord.'}
                </p>
            </div>

            {/* Bloque 2 — Métricas */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-6 gap-4 md:gap-6 items-center">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                        Casos
                    </span>
                    <span
                        className="text-lg font-bold tabular-nums"
                        data-testid={`expedientes-casos-${row.fiscalId}`}
                    >
                        {row.nroCasos}
                    </span>
                </div>

                {/* Progreso global (oculto < sm, col-span-2) */}
                <div className="flex flex-col col-span-2 hidden sm:flex">
                    <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                            Progreso
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-medium">
                            {culm} CULM / {proc} PROC
                        </span>
                    </div>
                    <div
                        className="h-1.5 w-full bg-muted overflow-hidden flex rounded-full"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(pctCulm)}
                        aria-label={`Progreso de ${row.funcionario}: ${culm} culminados de ${denom}`}
                    >
                        <div
                            className="bg-emerald-500 h-full"
                            style={{ width: `${pctCulm}%` }}
                            data-testid={`expedientes-progress-culm-${row.fiscalId}`}
                        />
                        <div
                            className="bg-amber-400 h-full"
                            style={{ width: `${pctProc}%` }}
                            data-testid={`expedientes-progress-proc-${row.fiscalId}`}
                        />
                    </div>
                </div>

                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                        VDF / AF
                    </span>
                    <span className="text-base font-semibold tabular-nums text-foreground">
                        {row.vdfTotal}{' '}
                        <span className="text-muted-foreground font-normal text-sm">/</span>{' '}
                        {row.afTotal}
                    </span>
                </div>

                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                        Σ Culm.
                    </span>
                    <span className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {culm}
                    </span>
                </div>

                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                        Σ Proc.
                    </span>
                    <span className="text-lg font-bold tabular-nums text-amber-700 dark:text-amber-400">
                        {proc}
                    </span>
                </div>
            </div>

            {/* Bloque 3 — Observaciones */}
            {row.observaciones && (
                <div className="md:w-[180px] flex-shrink-0 text-xs text-muted-foreground md:border-l border-border/60 md:pl-4 pt-3 md:pt-0 border-t md:border-t-0 mt-3 md:mt-0 flex items-start gap-1.5">
                    <FileText
                        className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 mt-0.5"
                        aria-hidden="true"
                    />
                    <span className="line-clamp-2" title={row.observaciones}>
                        {row.observaciones}
                    </span>
                </div>
            )}
        </div>
    );
}
