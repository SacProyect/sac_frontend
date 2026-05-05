import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  getAdvancedVisitsDashboard,
  getVisitsHistory,
  getVisitsList,
} from "@/components/utils/api/visits-functions";
import { createVisitsWsConnection } from "@/components/utils/api/visits-ws-connection";
import {
  DashboardAdvancedResponse,
  PaginatedResponse,
  VisitHistoryItem,
  VisitHistoryParams,
  VisitItem,
  VisitStatus,
  VisitWsEvent,
} from "@/types/visits";

export interface VisitsMonitorFilters {
  search: string;
  status: "todos" | VisitStatus;
}

export interface RealtimeVisitEventInfo {
  type: VisitWsEvent["type"];
  occurredAt: string;
  visitId?: string;
}

const DEFAULT_HISTORY_PARAMS: VisitHistoryParams = {
  incluir_finalizados: false,
  skip: 0,
  limit: 8,
};

const realtimeEventToastLabel: Record<VisitWsEvent["type"], string> = {
  "visit.created": "Nueva visita registrada",
  "visit.attended": "Visita atendida",
  "visit.updated": "Visita actualizada",
  "visit.exited": "Salida registrada",
  "visit.deleted": "Visita eliminada",
};

export const useVisitsMonitor = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected");

  const [dashboard, setDashboard] = useState<DashboardAdvancedResponse | null>(null);
  const [liveVisits, setLiveVisits] = useState<VisitItem[]>([]);
  const [lastRealtimeEvent, setLastRealtimeEvent] = useState<RealtimeVisitEventInfo | null>(null);
  const [history, setHistory] = useState<PaginatedResponse<VisitHistoryItem>>({
    total: 0,
    skip: 0,
    limit: 0,
    items: [],
  });
  const [filters, setFilters] = useState<VisitsMonitorFilters>({ search: "", status: "todos" });

  const refetchTimer = useRef<number | null>(null);
  const lastToastEventKeyRef = useRef<string | null>(null);

  const refreshSnapshot = useCallback(async () => {
    const [dashboardRes, liveRes, historyRes] = await Promise.all([
      getAdvancedVisitsDashboard(),
      getVisitsList({ limit: 25, skip: 0, include_images: true }),
      getVisitsHistory(DEFAULT_HISTORY_PARAMS),
    ]);

    setDashboard(dashboardRes);
    setLiveVisits(liveRes);
    setHistory(historyRes);
  }, []);

  const applyVisitEvent = useCallback((event: VisitWsEvent) => {
    const eventVisitId = "id" in event.payload ? event.payload.id : undefined;
    const eventKey = `${event.type}-${event.occurred_at}-${eventVisitId ?? "none"}`;
    if (lastToastEventKeyRef.current !== eventKey) {
      lastToastEventKeyRef.current = eventKey;
      const contributorName =
        "id" in event.payload
          ? (event.payload as VisitItem).contributor_name ??
            (event.payload as VisitItem).contribuyente ??
            "Sin contribuyente"
          : "Sin contribuyente";
      toast(`${realtimeEventToastLabel[event.type]} · ${contributorName}`, {
        icon: "🔔",
        duration: 3500,
        style: {
          background: "#0f172a",
          color: "#e2e8f0",
          border: "1px solid rgba(99,102,241,0.45)",
        },
      });
    }

    setLastRealtimeEvent({
      type: event.type,
      occurredAt: event.occurred_at,
      visitId: eventVisitId,
    });

    if (event.type === "visit.deleted" && "id" in event.payload) {
      setLiveVisits((prev) => prev.filter((visit) => visit.id !== event.payload.id));
      setHistory((prev) => ({
        ...prev,
        items: prev.items.filter((row) => row.id !== event.payload.id),
      }));
      return;
    }

    if (!("id" in event.payload)) return;
    const payload = event.payload as VisitItem;

    setLiveVisits((prev) => {
      const index = prev.findIndex((visit) => visit.id === payload.id);
      if (index === -1) return [payload, ...prev].slice(0, 25);
      const next = [...prev];
      next[index] = { ...next[index], ...payload };
      return next;
    });
  }, []);

  const scheduleConsistencyRefresh = useCallback(() => {
    if (refetchTimer.current !== null) {
      window.clearTimeout(refetchTimer.current);
    }

    refetchTimer.current = window.setTimeout(async () => {
      try {
        const [dashboardRes, liveRes] = await Promise.all([
          getAdvancedVisitsDashboard(),
          getVisitsList({ limit: 25, skip: 0, include_images: true }),
        ]);
        setDashboard(dashboardRes);
        setLiveVisits(liveRes);
      } catch (refreshError) {
        console.warn("No se pudo refrescar snapshot realtime:", refreshError);
      }
    }, 450);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        await refreshSnapshot();
      } catch (loadError) {
        console.error(loadError);
        setError("No se pudieron cargar los datos de visitas.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [refreshSnapshot]);

  useEffect(() => {
    const ws = createVisitsWsConnection({
      onEvent: (event) => {
        applyVisitEvent(event);
        scheduleConsistencyRefresh();
      },
      onStatusChange: setWsStatus,
      onError: (message) => {
        console.warn(message);
      },
    });

    ws.connect();
    return () => {
      ws.disconnect();
      if (refetchTimer.current !== null) {
        window.clearTimeout(refetchTimer.current);
      }
    };
  }, [applyVisitEvent, scheduleConsistencyRefresh]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await refreshSnapshot();
    } catch (loadError) {
      console.error(loadError);
      setError("No se pudieron refrescar los datos de visitas.");
    } finally {
      setLoading(false);
    }
  }, [refreshSnapshot]);

  const filteredLiveVisits = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return liveVisits.filter((visit) => {
      const matchesStatus = filters.status === "todos" ? true : visit.status === filters.status;
      const rawVisit = visit as VisitItem & {
        contributor?: { name?: string; rif?: string };
        contribuyente?: string;
        rif?: string;
      };
      const contributorName =
        rawVisit.contributor_name ??
        rawVisit.contributor?.name ??
        rawVisit.contribuyente ??
        "";
      const contributorRif =
        rawVisit.contributor_rif ??
        rawVisit.contributor?.rif ??
        rawVisit.rif ??
        "";
      const haystack = `${visit.id} ${contributorName} ${contributorRif} ${visit.department ?? ""}`.toLowerCase();
      const matchesSearch = term ? haystack.includes(term) : true;
      return matchesStatus && matchesSearch;
    });
  }, [liveVisits, filters]);

  const setSearchFilter = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, []);

  const setStatusFilter = useCallback((status: VisitsMonitorFilters["status"]) => {
    setFilters((prev) => ({ ...prev, status }));
  }, []);

  return {
    loading,
    error,
    wsStatus,
    lastRealtimeEvent,
    dashboard,
    liveVisits: filteredLiveVisits,
    history,
    filters,
    setSearchFilter,
    setStatusFilter,
    refetch,
  };
};
