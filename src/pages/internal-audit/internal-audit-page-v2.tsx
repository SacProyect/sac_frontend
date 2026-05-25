import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import {
  getInternalAuditDashboard,
  downloadInternalAuditCsv,
  getUsageRankingTopBottom,
} from "@/components/utils/api/report-functions";
import type {
  InternalAuditDashboard,
  InternalAuditQueryParams,
  UsageRankingTopBottomResponse,
} from "@/types/internal-audit";
import { Button } from "@/components/UI/button";
import { Badge } from "@/components/UI/badge";
import { PageHeader, LoadingState } from "@/components/UI/v2";
import toast from "react-hot-toast";

import { InternalAuditKpiPanel } from "./components/internal-audit-kpi-panel";
import { InternalAuditFiscalsTable } from "./components/internal-audit-fiscals-table";
import { InternalAuditUsageRankingPanel } from "./components/internal-audit-usage-ranking-panel";
import { InternalAuditAlertsTable } from "./components/internal-audit-alerts-table";
import {
  InternalAuditToolbar,
  draftFromQuery,
  queryFromDraft,
  type InternalAuditDraft,
} from "./components/internal-audit-toolbar";
import { InternalAuditRoadmapCard } from "./components/internal-audit-roadmap-card";
import { defaultAuditWindow, isoToDatetimeLocalValue } from "./utils/datetime-local";
import { formatWhen } from "./utils/format-when";

const AUDIT_TABS = ["kpis", "fiscales", "actividad", "alertas"] as const;
type AuditTab = (typeof AUDIT_TABS)[number];

function normalizeTab(value: string | null): AuditTab {
  if (!value) return "kpis";
  return (AUDIT_TABS as readonly string[]).includes(value) ? (value as AuditTab) : "kpis";
}

function initialQuery(): InternalAuditQueryParams {
  const { fromIso, toIso } = defaultAuditWindow();
  return {
    from: fromIso,
    to: toIso,
    shortHours: 24,
    statsYear: new Date().getUTCFullYear(),
  };
}

export default function InternalAuditPageV2() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const allowed = user?.role === "ADMIN" || user?.role === "COORDINATOR";

  const [appliedQuery, setAppliedQuery] = useState<InternalAuditQueryParams>(initialQuery);
  const [draft, setDraft] = useState<InternalAuditDraft>(() => draftFromQuery(initialQuery()));

  const [data, setData] = useState<InternalAuditDashboard | null>(null);
  const [usageRanking, setUsageRanking] = useState<UsageRankingTopBottomResponse | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentTab = normalizeTab(searchParams.get("tab"));

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [dashboardRes, usageRankingRes] = await Promise.all([
        getInternalAuditDashboard(appliedQuery),
        getUsageRankingTopBottom({
          from: appliedQuery.from,
          to: appliedQuery.to,
        }),
      ]);
      setData(dashboardRes);
      setUsageRanking(usageRankingRes);
    } catch {
      toast.error("No se pudo cargar el panel de auditoría interna.");
      setData(null);
      setUsageRanking(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [appliedQuery]);

  useEffect(() => {
    if (!allowed) return;
    void load();
  }, [allowed, load]);

  useEffect(() => {
    const raw = searchParams.get("tab");
    const normalized = normalizeTab(raw);
    if (raw !== normalized) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("tab", normalized);
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const inactiveFiscals = useMemo(() => {
    if (!data?.fiscals.length) return [];
    return data.fiscals.filter((f) => f.auditCountInWindow === 0);
  }, [data]);

  const handleApply = useCallback((next: InternalAuditDraft) => {
    setDraft(next);
    setAppliedQuery(queryFromDraft(next));
  }, []);

  const handlePresetDays = (days: number) => {
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    setDraft({
      fromLocal: isoToDatetimeLocalValue(from.toISOString()),
      toLocal: isoToDatetimeLocalValue(to.toISOString()),
      shortHours: draft.shortHours,
      statsYear: draft.statsYear,
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
          backTo="/admin"
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
  const inactiveCount = inactiveFiscals.length;
  const activeRate = data.totals.fiscalHeadcount
    ? Math.round((data.totals.activeFiscalsInWindow / data.totals.fiscalHeadcount) * 100)
    : 0;
  const monitorTone =
    inactiveCount === 0 ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10" : "text-amber-200 border-amber-500/30 bg-amber-500/10";

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-8 animate-in fade-in duration-300">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <PageHeader
            title="Auditoría interna"
            description="Centro de monitoreo para medir adopción operativa, inactividad y riesgo tributario por fiscal. Filtros de ventana y año de cartera trabajan en conjunto para seguimiento y decisiones."
            backTo="/admin"
          />
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Adopción de actividad</p>
            <p className="mt-1 text-2xl font-semibold text-cyan-300 tabular-nums">{activeRate}%</p>
            <p className="text-xs text-slate-400">Fiscales con eventos en la ventana seleccionada</p>
          </div>
          <div className={`rounded-lg border px-4 py-3 ${monitorTone}`}>
            <p className="text-xs uppercase tracking-wide opacity-80">Sin actividad</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{inactiveCount}</p>
            <p className="text-xs opacity-80">Fiscales sin trazas en auditoría durante el periodo</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Cobertura actual</p>
            <p className="mt-1 text-lg font-medium text-slate-200">{scopeLabel}</p>
            <p className="text-xs text-slate-400">Contexto de vista para interpretación del panel</p>
          </div>
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

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
          {user.role === "ADMIN" ? "Administrador" : "Coordinador"}
        </Badge>
      </div>
      <p className="text-xs text-slate-500">
        Generado: {formatWhen(data.generatedAt)} · Ventana auditoría: {windowHint} · Año cartera KPI:{" "}
        <strong className="text-slate-400">{data.carteraYear}</strong> · Fiscales: {data.totals.fiscalHeadcount}
      </p>

      <div className={`min-h-[420px] transition-opacity ${loading ? "opacity-[0.65]" : ""}`}>
        {currentTab === "kpis" && <InternalAuditKpiPanel data={data} />}
        {currentTab === "fiscales" && <InternalAuditFiscalsTable data={data} />}
        {currentTab === "actividad" && <InternalAuditUsageRankingPanel ranking={usageRanking} />}
        {currentTab === "alertas" && (
          <InternalAuditAlertsTable
            inactiveFiscals={inactiveFiscals}
            windowLabel={windowHint}
            carteraYear={data.carteraYear}
          />
        )}
      </div>

      <InternalAuditRoadmapCard />
    </div>
  );
}
