import { Link } from "react-router-dom";
import { Card } from "@/components/UI/card";
import { Button } from "@/components/UI/button";
import { EmptyState } from "@/components/UI/v2";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/UI/table";
import { BarChart3, ExternalLink } from "lucide-react";
import type { InternalAuditDashboard } from "@/types/internal-audit";
import { formatWhen } from "../utils/format-when";

type Props = { data: InternalAuditDashboard };

export function InternalAuditFiscalsTable({ data }: Props) {
  const y = data.carteraYear;
  return (
    <Card className="bg-slate-900/80 border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800">
        <h3 className="text-lg font-semibold text-white">Fiscales — cartera {y} y actividad</h3>
        <p className="text-sm text-slate-400">
          Columnas de casos / pendientes / IVA·ISLR usan el año <strong className="text-slate-300">{y}</strong>. Las fechas de
          última auditoría y eventos del rango son independientes de ese año.
        </p>
      </div>
      <div className="relative [&>div]:max-h-[min(70vh,560px)] [&>div]:overflow-y-auto [&>div]:overflow-x-auto">
        <Table>
          <TableHeader className="z-30 bg-slate-900">
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-slate-300 sticky top-0 left-0 bg-slate-900 z-40">Fiscal</TableHead>
              <TableHead className="text-slate-300 sticky top-0 bg-slate-900 z-30">Cédula</TableHead>
              <TableHead className="text-slate-300 text-right sticky top-0 bg-slate-900 z-30" title={`Casos en cartera ${y}`}>
                Casos {y}
              </TableHead>
              <TableHead className="text-slate-300 text-right sticky top-0 bg-slate-900 z-30" title="Sin culminar">
                Pend.
              </TableHead>
              <TableHead className="text-slate-300 text-right sticky top-0 bg-slate-900 z-30" title={`Sin declaración IVA en ${y}`}>
                ∅ IVA
              </TableHead>
              <TableHead className="text-slate-300 text-right sticky top-0 bg-slate-900 z-30" title={`Sin declaración ISLR en ${y}`}>
                ∅ ISLR
              </TableHead>
              <TableHead className="text-slate-300 sticky top-0 bg-slate-900 z-30">Últ. login</TableHead>
              <TableHead className="text-slate-300 sticky top-0 bg-slate-900 z-30">Últ. aud.</TableHead>
              <TableHead className="text-slate-300 sticky top-0 bg-slate-900 z-30">Últ. IVA*</TableHead>
              <TableHead className="text-slate-300 sticky top-0 bg-slate-900 z-30">Últ. ISLR*</TableHead>
              <TableHead className="text-slate-300 text-right sticky top-0 bg-slate-900 z-30">Evt. fecha</TableHead>
              <TableHead className="text-slate-300 w-[120px] text-center sticky top-0 bg-slate-900 z-30">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.fiscals.map((f) => (
              <TableRow key={f.id} className="border-slate-800">
                <TableCell className="font-medium text-white sticky left-0 bg-slate-900/95 z-[1]">{f.name}</TableCell>
                <TableCell className="text-slate-400">{f.personId}</TableCell>
                <TableCell className="text-right tabular-nums text-slate-200">{f.taxpayerCount}</TableCell>
                <TableCell className="text-right tabular-nums text-orange-300/90">{f.casosPendientes}</TableCell>
                <TableCell className="text-right tabular-nums text-rose-300/90">{f.sinDeclaracionIva}</TableCell>
                <TableCell className="text-right tabular-nums text-violet-300/90">{f.sinDeclaracionIslr}</TableCell>
                <TableCell className="text-slate-300 whitespace-nowrap text-xs">{formatWhen(f.lastLoginAt)}</TableCell>
                <TableCell className="text-slate-300 whitespace-nowrap text-xs">{formatWhen(f.lastAuditAt)}</TableCell>
                <TableCell className="text-slate-300 whitespace-nowrap text-xs">{formatWhen(f.lastIvaLoadAt)}</TableCell>
                <TableCell className="text-slate-300 whitespace-nowrap text-xs">{formatWhen(f.lastIslrLoadAt)}</TableCell>
                <TableCell className="text-right tabular-nums text-slate-400">{f.auditCountInWindow}</TableCell>
                <TableCell className="text-center">
                  <Button variant="outline" size="sm" asChild className="h-8 px-3 border-slate-700 text-cyan-300 hover:text-cyan-200 hover:bg-slate-800/70">
                    <Link to={`/stats/fiscal/${f.id}`} title="Abrir estadísticas del fiscal" className="inline-flex items-center gap-1">
                      <BarChart3 className="h-4 w-4 mr-1 inline" />
                      Ver
                      <ExternalLink className="h-3 w-3 inline opacity-70" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="px-4 py-2 text-[10px] text-slate-500 border-t border-slate-800">
        * Últ. IVA/ISLR: última actualización de declaraciones en cartera (cualquier año). Para obligaciones del año {y} usar
        columnas ∅ IVA / ∅ ISLR.
      </p>
      {data.fiscals.length === 0 && (
        <EmptyState title="Sin fiscales en alcance" message="No hay fiscales activos asignados a esta vista." />
      )}
    </Card>
  );
}
