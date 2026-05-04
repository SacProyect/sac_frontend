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
import type { InternalAuditFiscalRow } from "@/types/internal-audit";
import { formatWhen } from "../utils/format-when";

type Props = {
  inactiveFiscals: InternalAuditFiscalRow[];
  windowLabel: string;
  carteraYear: number;
};

export function InternalAuditAlertsTable({ inactiveFiscals, windowLabel, carteraYear }: Props) {
  return (
    <Card className="bg-slate-900/80 border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800">
        <h3 className="text-lg font-semibold text-white">Alertas — sin actividad en auditoría</h3>
        <p className="text-sm text-slate-400">
          Fiscales sin ningún evento en la tabla de auditoría en el periodo: {windowLabel}. Las columnas de cartera son del
          año <strong className="text-slate-300">{carteraYear}</strong>.
        </p>
      </div>
      <div className="relative [&>div]:max-h-[min(70vh,560px)] [&>div]:overflow-y-auto [&>div]:overflow-x-auto">
        <Table>
          <TableHeader className="z-30 bg-slate-900">
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-slate-300 sticky top-0 bg-slate-900 z-30">Fiscal</TableHead>
              <TableHead className="text-slate-300 sticky top-0 bg-slate-900 z-30">Cédula</TableHead>
              <TableHead className="text-slate-300 text-right sticky top-0 bg-slate-900 z-30">Casos {carteraYear}</TableHead>
              <TableHead className="text-slate-300 text-right sticky top-0 bg-slate-900 z-30">Pend.</TableHead>
              <TableHead className="text-slate-300 text-right sticky top-0 bg-slate-900 z-30">∅ IVA</TableHead>
              <TableHead className="text-slate-300 text-right sticky top-0 bg-slate-900 z-30">∅ ISLR</TableHead>
              <TableHead className="text-slate-300 sticky top-0 bg-slate-900 z-30">Últ. aud.</TableHead>
              <TableHead className="text-slate-300 sticky top-0 bg-slate-900 z-30">Últ. login</TableHead>
              <TableHead className="text-slate-300 w-[120px] text-center sticky top-0 bg-slate-900 z-30">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inactiveFiscals.map((f) => (
              <TableRow key={f.id} className="border-slate-800">
                <TableCell className="font-medium text-amber-200">{f.name}</TableCell>
                <TableCell className="text-slate-400">{f.personId}</TableCell>
                <TableCell className="text-right tabular-nums">{f.taxpayerCount}</TableCell>
                <TableCell className="text-right tabular-nums text-orange-300/90">{f.casosPendientes}</TableCell>
                <TableCell className="text-right tabular-nums text-rose-300/90">{f.sinDeclaracionIva}</TableCell>
                <TableCell className="text-right tabular-nums text-violet-300/90">{f.sinDeclaracionIslr}</TableCell>
                <TableCell className="text-slate-400 text-xs">{formatWhen(f.lastAuditAt)}</TableCell>
                <TableCell className="text-slate-400 text-xs">{formatWhen(f.lastLoginAt)}</TableCell>
                <TableCell className="text-center">
                  <Button variant="outline" size="sm" asChild className="h-8 px-3 border-slate-700 text-cyan-300 hover:text-cyan-200 hover:bg-slate-800/70">
                    <Link to={`/stats/fiscal/${f.id}`} className="inline-flex items-center gap-1">
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
      {inactiveFiscals.length === 0 && (
        <EmptyState
          title="Sin alertas para este periodo"
          message="Todos los fiscales registraron al menos un evento de auditoría en la ventana seleccionada."
        />
      )}
    </Card>
  );
}
