export enum NotificationType {
  ESCALATION_NEW_CONTRIBUTOR = "ESCALATION_NEW_CONTRIBUTOR",
  ESCALATION_NEW_FINE = "ESCALATION_NEW_FINE",
  MAINTENANCE_ALERT = "MAINTENANCE_ALERT",
  MAINTENANCE_START = "MAINTENANCE_START",
}

export enum NotificationChannel {
  IN_APP = "IN_APP",
  EMAIL = "EMAIL",
  SMS = "SMS",
}

export enum NotificationStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  CONFIRMED = "CONFIRMED",
  READ = "READ",
}

export enum ProcedureType {
  FP = "FP",
  AF = "AF",
  VDF = "VDF",
  NA = "NA",
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType | string;
  channel: NotificationChannel | string;
  status: NotificationStatus | string;
  createdAt: string;
  readAt?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface NotificationsPage {
  items: NotificationItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationThreshold {
  procedureType: ProcedureType;
  daysBeforeDue: number;
}

export interface DefaultThreshold {
  daysBeforeDue: number;
}

export interface EscalationConfig {
  procedureType: ProcedureType;
  escalationDays: number;
  notifyRole: string;
}

export interface EscalationConfigInput {
  escalationDays: number;
  notifyRole: string;
}

export interface MaintenanceAlertPayload {
  title?: string;
  message?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  startsAt?: string;
  expectedDurationMinutes?: number;
}

export interface MaintenanceStartPayload {
  title?: string;
  message?: string;
  durationMinutes?: number;
  startedAt?: string;
}

export type SocketConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "fallback_polling"
  | "disconnected"
  | "error";
