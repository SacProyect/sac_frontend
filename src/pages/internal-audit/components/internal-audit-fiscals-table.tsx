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
  return (
    <Card className="bg-slate-900/80 border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white">Fiscales — actividad y cargas</h3>
        <p className="text-sm text-slate-400">
          Última acción en auditoría, último inicio de sesión, eventos en el rango elegido, e IVA/ISLR por cartera.
        </p>
      </div>
      <div className="overflow-x-auto max-h-[min(70vh,560px)] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-slate-300">Fiscal</TableHead>
              <TableHead className="text-slate-300">Cédula</TableHead>
              <TableHead className="text-slate-300">Últ. login</TableHead>
              <TableHead className="text-slate-300 text-right">Contrib.</TableHead>
              <TableHead className="text-slate-300">Últ. auditoría</TableHead>
              <TableHead className="text-slate-300">Últ. IVA</TableHead>
              <TableHead className="text-slate-300">Últ. ISLR</TableHead>
              <TableHead className="text-slate-300 text-right">Evt. rango</TableHead>
              <TableHead className="text-slate-300 w-[120px]">Estadísticas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.fiscals.map((f) => (
              <TableRow key={f.id} className="border-slate-800">
                <TableCell className="font-medium text-white">{f.name}</TableCell>
                <TableCell className="text-slate-400">{f.personId}</TableCell>
                <TableCell className="text-slate-300 whitespace-nowrap text-sm">{formatWhen(f.lastLoginAt)}</TableCell>
                <TableCell className="text-right tabular-nums">{f.taxpayerCount}</TableCell>
                <TableCell className="text-slate-300 whitespace-nowrap text-sm">{formatWhen(f.lastAuditAt)}</TableCell>
                <TableCell className="text-slate-300 whitespace-nowrap text-sm">{formatWhen(f.lastIvaLoadAt)}</TableCell>
                <TableCell className="text-slate-300 whitespace-nowrap text-sm">{formatWhen(f.lastIslrLoadAt)}</TableCell>
                <TableCell className="text-right tabular-nums">{f.auditCountInWindow}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild className="text-sky-400 hover:text-sky-300 h-8 px-2">
                    <Link to={`/stats/fiscal/${f.id}`} title="Estadísticas del fiscal">
                      <BarChart3 className="h-4 w-4 mr-1 inline" />
                      <ExternalLink className="h-3 w-3 inline opacity-70" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data.fiscals.length === 0 && (
        <EmptyState title="Sin fiscales en alcance" message="No hay fiscales activos asignados a esta vista." />
      )}
    </Card>
  );
}
