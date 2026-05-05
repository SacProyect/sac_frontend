export type VisitStatus = "espera" | "atendido" | "finalizado" | "rechazado" | "reprogramado";

export interface VisitPhoto {
  id: number;
  visit_id: string;
  photo_url: string;
  created_at: string;
}

export interface VisitItem {
  id: string;
  contributor_id?: number;
  contributor_name?: string;
  contributor_rif?: string;
  contribuyente?: string;
  rif?: string;
  contributor?: {
    id?: number;
    name?: string;
    rif?: string;
  };
  fiscal_id?: number;
  fiscal_name?: string | null;
  reason?: string;
  observations?: string | null;
  received_by?: string;
  department?: string | null;
  file_number?: string | null;
  entry_date: string;
  entry_time: string;
  exit_date?: string | null;
  exit_time?: string | null;
  status: VisitStatus;
  signature_image_url?: string | null;
  created_at?: string;
  deleted_at?: string | null;
  photos?: VisitPhoto[];
}

export interface VisitsListParams {
  status?: VisitStatus;
  fiscal_id?: string | number;
  rif?: string;
  entry_date?: string;
  include_images?: boolean;
  skip?: number;
  limit?: number;
}

export interface DashboardAdvancedResponse {
  date: string;
  totals: {
    entries: number;
    in_waiting: number;
    finished: number;
  };
  comparison: {
    vs_previous_day_pct: number;
  };
  latest_visits: Array<{
    id: string;
    contributor_name: string;
    fiscal_id: number;
    status: VisitStatus;
    entry_time: string;
  }>;
}

export interface VisitHistoryItem {
  id: string;
  rif: string;
  contribuyente: string;
  registro: string;
  depto: string;
  motivo: string;
  estado: VisitStatus;
  fiscal?: string;
}

export interface VisitHistoryParams {
  rif?: string;
  contribuyente?: string;
  registro?: string;
  departamento?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  incluir_finalizados?: boolean;
  skip?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  total: number;
  skip: number;
  limit: number;
  items: T[];
}

export interface VisitWsEvent {
  type: "visit.created" | "visit.attended" | "visit.updated" | "visit.exited" | "visit.deleted";
  occurred_at: string;
  payload: VisitItem | { id: string };
}
