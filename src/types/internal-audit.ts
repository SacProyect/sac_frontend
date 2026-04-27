/**
 * Contrato API `GET /reports/internal-audit-dashboard`
 * (JSON o `?format=csv`).
 */
export interface InternalAuditWindowMeta {
  from: string;
  to: string;
  shortWindowHours: number;
  defaultWindowDays: number;
}

export interface InternalAuditDashboard {
  scope: "all" | "coordination";
  coordinationId?: string;
  coordinationName?: string | null;
  generatedAt: string;
  /** Año civil para métricas de cartera / pendientes IVA–ISLR. */
  carteraYear: number;
  window: InternalAuditWindowMeta;
  totals: {
    fiscalHeadcount: number;
    auditsShortWindow: number;
    auditsInWindow: number;
    activeFiscalsInWindow: number;
    taxpayerAssignmentsTotal: number;
    carteraCasosPendientesTotal: number;
    carteraSinIvaTotal: number;
    carteraSinIslrTotal: number;
  };
  fiscals: Array<{
    id: string;
    name: string;
    personId: number;
    lastLoginAt: string | null;
    lastAuditAt: string | null;
    auditCountInWindow: number;
    taxpayerCount: number;
    casosPendientes: number;
    sinDeclaracionIva: number;
    sinDeclaracionIslr: number;
    lastIvaLoadAt: string | null;
    lastIslrLoadAt: string | null;
  }>;
  recentAudits: Array<{
    id: string;
    fecha: string;
    usuario_id: string;
    actorName: string;
    accion: string;
    entidad: string;
    entidad_id: string;
  }>;
}

export type InternalAuditFiscalRow = InternalAuditDashboard["fiscals"][number];

/** Parámetros de consulta opcionales (ISO 8601 para fechas). */
export type InternalAuditQueryParams = {
  from?: string;
  to?: string;
  shortHours?: number;
  /** Año UTC para pendientes de cartera IVA/ISLR (opcional). */
  statsYear?: number;
};
