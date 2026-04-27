import { Link } from "react-router-dom";
import { Card } from "@/components/UI/card";
import { EmptyState } from "@/components/UI/v2";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/UI/table";
import type { InternalAuditDashboard } from "@/types/internal-audit";
import { formatWhen } from "../utils/format-when";

type Props = { data: InternalAuditDashboard };

export function InternalAuditTimelineTable({ data }: Props) {
  return (
    <Card className="bg-slate-900/80 border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white">Línea de tiempo — auditoría en el rango</h3>
        <p className="text-sm text-slate-400">
          Eventos sensibles ejecutados por fiscales en alcance (máx. 120 en esta respuesta).
        </p>
      </div>
      <div className="overflow-x-auto max-h-[min(70vh,560px)] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-slate-300">Fecha</TableHead>
              <TableHead className="text-slate-300">Fiscal</TableHead>
              <TableHead className="text-slate-300">Acción</TableHead>
              <TableHead className="text-slate-300">Entidad</TableHead>
              <TableHead className="text-slate-300">Referencia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.recentAudits.map((row) => (
              <TableRow key={row.id} className="border-slate-800">
                <TableCell className="text-slate-300 whitespace-nowrap text-sm">{formatWhen(row.fecha)}</TableCell>
                <TableCell className="text-white">{row.actorName}</TableCell>
                <TableCell className="text-slate-300 max-w-[200px] truncate" title={row.accion}>
                  {row.accion}
                </TableCell>
                <TableCell className="text-slate-400">{row.entidad}</TableCell>
                <TableCell className="text-sky-300/90">
                  {row.entidad === "Contribuyente" ? (
                    <Link className="underline hover:text-sky-200" to={`/taxpayer/${row.entidad_id}`}>
                      Abrir contribuyente
                    </Link>
                  ) : (
                    <span className="font-mono text-xs">{row.entidad_id.slice(0, 14)}…</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data.recentAudits.length === 0 && (
        <EmptyState title="Sin eventos en el rango" message="Prueba ampliando fechas o revisa otro periodo." />
      )}
    </Card>
  );
}
