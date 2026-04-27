import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useTvIdleRotation } from "@/hooks/use-tv-idle-rotation";
import { useAuth } from "@/hooks/use-auth";
import {
  getInternalAuditDashboard,
  downloadInternalAuditCsv,
} from "@/components/utils/api/report-functions";
import type { InternalAuditDashboard, InternalAuditQueryParams } from "@/types/internal-audit";
import { Button } from "@/components/UI/button";
import { Badge } from "@/components/UI/badge";
import { PageHeader, LoadingState } from "@/components/UI/v2";
import { Radio } from "lucide-react";
import toast from "react-hot-toast";

import { InternalAuditKpiPanel } from "./components/internal-audit-kpi-panel";
import { InternalAuditFiscalsTable } from "./components/internal-audit-fiscals-table";
import { InternalAuditTimelineTable } from "./components/internal-audit-timeline-table";
import { InternalAuditAlertsTable } from "./components/internal-audit-alerts-table";
import { InternalAuditPaginationBar } from "./components/internal-audit-pagination-bar";
import {
  InternalAuditToolbar,
  draftFromQuery,
  queryFromDraft,
  type InternalAuditDraft,
} from "./components/internal-audit-toolbar";
import { InternalAuditRoadmapCard } from "./components/internal-audit-roadmap-card";
import { defaultAuditWindow, isoToDatetimeLocalValue } from "./utils/datetime-local";
import { formatWhen } from "./utils/format-when";

const TOTAL_PAGES = 4;

function initialQuery(): InternalAuditQueryParams {
  const { fromIso, toIso } = defaultAuditWindow();
  return { from: fromIso, to: toIso, shortHours: 24 };
}

export default function InternalAuditPageV2() {
  const { user } = useAuth();
  const allowed = user?.role === "ADMIN" || user?.role === "COORDINATOR";

  const [appliedQuery, setAppliedQuery] = useState<InternalAuditQueryParams>(initialQuery);
  const [draft, setDraft] = useState<InternalAuditDraft>(() => draftFromQuery(initialQuery()));

  const [data, setData] = useState<InternalAuditDashboard | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const { tvMode, tvSpotlightIndex } = useTvIdleRotation({
    page,
    setPage,
    totalPages: TOTAL_PAGES,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await getInternalAuditDashboard(appliedQuery);
      setData(res);
    } catch {
      toast.error("No se pudo cargar el panel de auditoría interna.");
      setData(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [appliedQuery]);

  useEffect(() => {
    if (!allowed) return;
    void load();
  }, [allowed, load]);

  const inactiveFiscals = useMemo(() => {
    if (!data?.fiscals.length) return [];
    return data.fiscals.filter((f) => f.auditCountInWindow === 0);
  }, [data]);

  const handleApply = () => {
    setAppliedQuery(queryFromDraft(draft));
    setPage(1);
  };

  const handlePresetDays = (days: number) => {
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    setDraft({
      fromLocal: isoToDatetimeLocalValue(from.toISOString()),
      toLocal: isoToDatetimeLocalValue(to.toISOString()),
      shortHours: draft.shortHours,
    });
  };

  const handleExportCsv = async () => {
    try {
      await downloadInternalAuditCsv(appliedQuery);
      toast.success("Descarga iniciada.");
    } catch {
      toast.error("No se pudo exportar el CSV.");
    }
  };

  if (!user) return <LoadingState message="Cargando sesión..." />;
  if (!allowed) {
    return <Navigate to="/admin" replace />;
  }

  if (loading && !data) {
    return <LoadingState message="Construyendo panel de vigilancia..." />;
  }

  if (loadError || !data) {
    return (
      <div className="space-y-4 max-w-lg">
        <PageHeader
          title="Auditoría interna"
          description="No se pudo obtener el panel. Comprueba permisos o reintenta."
        />
        <Button onClick={() => void load()}>Reintentar</Button>
      </div>
    );
  }

  const scopeLabel =
    data.scope === "coordination"
      ? data.coordinationName
        ? `Coordinación: ${data.coordinationName}`
        : "Tu coordinación"
      : "Alcance nacional (todos los fiscales)";

  const windowHint = `${formatWhen(data.window.from)} → ${formatWhen(data.window.to)}`;

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <PageHeader
          title="Auditoría interna"
          description="Vigilancia operativa con ventana de fechas configurable, exportación CSV y enlaces a estadísticas por fiscal."
        />
        <div className="flex flex-wrap items-center gap-2">
          {tvMode && (
            <Badge variant="outline" className="border-amber-500/60 text-amber-300 gap-1">
              <Radio className="h-3 w-3 animate-pulse" />
              Modo pantalla
            </Badge>
          )}
        </div>
      </div>

      <InternalAuditToolbar
        draft={draft}
        onDraftChange={setDraft}
        onApply={handleApply}
        onExportCsv={handleExportCsv}
        onRefresh={() => void load()}
        busy={loading}
        onPresetDays={handlePresetDays}
      />

      <p className="text-sm text-slate-400">{scopeLabel}</p>
      <p className="text-xs text-slate-500">
        Generado: {formatWhen(data.generatedAt)} · Ventana aplicada: {windowHint} · Fiscales:{" "}
        {data.totals.fiscalHeadcount}
      </p>

      <div className={`min-h-[420px] transition-opacity ${loading ? "opacity-[0.65]" : ""}`}>
        {page === 1 && <InternalAuditKpiPanel data={data} tvSpotlightIndex={tvSpotlightIndex} />}
        {page === 2 && <InternalAuditFiscalsTable data={data} />}
        {page === 3 && <InternalAuditTimelineTable data={data} />}
        {page === 4 && (
          <InternalAuditAlertsTable inactiveFiscals={inactiveFiscals} windowLabel={windowHint} />
        )}
      </div>

      <InternalAuditPaginationBar page={page} totalPages={TOTAL_PAGES} setPage={setPage} />

      <InternalAuditRoadmapCard />
    </div>
  );
}
