

export type RepairReports = {
    pdf_url: string;
    taxpayerId: string;
}

export type RepairReportStatus = 'PENDIENTE' | 'EN_PLAZO' | 'POR_VENCER' | 'VENCIDO' | 'NOTIFICADO';

export const REPAIR_STATUS_CONFIG: Record<RepairReportStatus, { label: string; color: string; bgColor: string }> = {
  PENDIENTE: { label: 'Pendiente', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  EN_PLAZO: { label: 'En plazo', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  POR_VENCER: { label: 'Por vencer', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  VENCIDO: { label: 'Vencido', color: 'text-rose-600', bgColor: 'bg-rose-50' },
  NOTIFICADO: { label: 'Notificado', color: 'text-blue-600', bgColor: 'bg-blue-50' },
};

export interface NotificationQueueStats {
  total: number;
  pending: number;
  sending: number;
  sent: number;
  failed: number;
}