import { Card } from "@/components/UI/card";
import { EmptyState } from "@/components/UI/v2";
import { Badge } from "@/components/UI/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/UI/table";
import type { UsageRankingTopBottomResponse } from "@/types/internal-audit";
import { formatWhen } from "../utils/format-when";

type Props = {
  ranking: UsageRankingTopBottomResponse | null;
};

function RankingTable({
  title,
  subtitle,
  rows,
  tone,
}: {
  title: string;
  subtitle: string;
  rows: UsageRankingTopBottomResponse["top5"];
  tone: "top" | "bottom";
}) {
  const accentClass =
    tone === "top"
      ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
      : "text-amber-200 border-amber-500/30 bg-amber-500/10";

  return (
    <Card className="bg-slate-900/80 border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
        <Badge variant="outline" className={accentClass}>
          {rows.length} fiscales
        </Badge>
      </div>
      <div className="relative [&>div]:max-h-[min(60vh,480px)] [&>div]:overflow-y-auto [&>div]:overflow-x-auto">
        <Table>
          <TableHeader className="z-30 bg-slate-900">
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-slate-300 sticky top-0 bg-slate-900 z-30">Fiscal</TableHead>
              <TableHead className="text-slate-300 sticky top-0 bg-slate-900 z-30 text-right">Score</TableHead>
              <TableHead className="text-slate-300 sticky top-0 bg-slate-900 z-30 text-right">Auditoría</TableHead>
              <TableHead className="text-slate-300 sticky top-0 bg-slate-900 z-30 text-right">Contrib.</TableHead>
              <TableHead className="text-slate-300 sticky top-0 bg-slate-900 z-30 text-right">IVA</TableHead>
              <TableHead className="text-slate-300 sticky top-0 bg-slate-900 z-30 text-right">ISLR</TableHead>
              <TableHead className="text-slate-300 sticky top-0 bg-slate-900 z-30 text-right">Cargas</TableHead>
              <TableHead className="text-slate-300 sticky top-0 bg-slate-900 z-30">Última actividad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((fiscal) => (
              <TableRow key={fiscal.userId} className="border-slate-800">
                <TableCell className="text-slate-100">
                  <div className="font-medium">{fiscal.name}</div>
                  <div className="text-[11px] text-slate-500">CI: {fiscal.personId}</div>
                </TableCell>
                <TableCell className="text-right tabular-nums font-semibold text-cyan-300">{fiscal.usageScore}</TableCell>
                <TableCell className="text-right tabular-nums text-slate-300">{fiscal.auditActions}</TableCell>
                <TableCell className="text-right tabular-nums text-slate-300">{fiscal.taxpayersTouched}</TableCell>
                <TableCell className="text-right tabular-nums text-slate-300">{fiscal.ivaLoads}</TableCell>
                <TableCell className="text-right tabular-nums text-slate-300">{fiscal.islrLoads}</TableCell>
                <TableCell className="text-right tabular-nums text-slate-300">{fiscal.taxLoads}</TableCell>
                <TableCell className="text-xs text-slate-400 whitespace-nowrap">{formatWhen(fiscal.lastActivityAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {rows.length === 0 && (
        <EmptyState
          title="Sin datos en esta ventana"
          message="Prueba ampliando el rango de fechas para calcular el ranking de uso."
        />
      )}
    </Card>
  );
}

export function InternalAuditUsageRankingPanel({ ranking }: Props) {
  if (!ranking) {
    return (
      <EmptyState
        title="No se pudo calcular el ranking de uso"
        message="Reintenta la consulta o ajusta la ventana de fechas."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span>Ventana ranking: {formatWhen(ranking.window.from)} → {formatWhen(ranking.window.to)}</span>
        <span>·</span>
        <span>Ponderación: A({ranking.weights.auditAction}) + C({ranking.weights.taxpayerTouch}) + IVA({ranking.weights.ivaLoad}) + ISLR({ranking.weights.islrLoad})</span>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <RankingTable
          title="Mayor actividad de uso (5)"
          subtitle="Fiscales con más actividad operativa en la ventana."
          rows={ranking.top5}
          tone="top"
        />
        <RankingTable
          title="Menor actividad de uso (5)"
          subtitle="Fiscales con menos actividad operativa en la ventana."
          rows={ranking.bottom5}
          tone="bottom"
        />
      </div>
    </div>
  );
}
