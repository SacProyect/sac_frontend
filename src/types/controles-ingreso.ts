// Estados del control
export type ControlIngresoStatus = 
  | 'borrador' 
  | 'en_revision' 
  | 'emitido' 
  | 'notificado' 
  | 'cerrado' 
  | 'reemitido';

// Coordinaciones disponibles
export type Coordinacion = 
  | 'COORDINACION_1' 
  | 'COORDINACION_2' 
  | 'COORDINACION_3' 
  | 'COORDINACION_4' 
  | 'COORDINACION_5';

// Control de ingreso principal
export interface ControlIngreso {
  id: string;
  number: string;
  coordination_id: Coordinacion;
  taxpayer_id: string | null;
  template_id: string;
  subject_name: string;
  subject_rif: string;
  subject_address: string;
  subject_parish_id: string;
  issue_date: string | null;
  start_date: string;
  end_date: string | null;
  status: ControlIngresoStatus;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Plantilla por coordinación
export interface ControlIngresoTemplate {
  id: string;
  coordination_id: Coordinacion;
  name: string;
  code: string;
  version: number;
  content: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Fiscal asignado
export interface ControlIngresoAssignee {
  id: string;
  control_id: string;
  full_name: string;
  identity_document: string;
  role_name: string;
  position: string | null;
  is_manual: boolean;
  created_at: string;
}

// Documento generado
export interface ControlIngresoDocument {
  id: string;
  control_id: string;
  template_version: number;
  rendered_content: string;
  file_url: string | null;
  file_type: string | null;
  generated_at: string;
  generated_by: string;
}

// Log de auditoría
export interface ControlIngresoAuditLog {
  id: string;
  control_id: string;
  action: string;
  previous_value: string | null;
  new_value: string | null;
  created_by: string;
  created_at: string;
}

// Stats para dashboard
export interface ControlesIngresoStats {
  total: number;
  borradores: number;
  en_revision: number;
  emitidos: number;
  notificados: number;
  cerrados: number;
  reemitidos: number;
  porCoordinacion: Array<{ name: string; count: number }>;
  porEstado: Array<{ name: string; count: number; fill: string }>;
}

// Labels de estados
export const CONTROL_ESTADO_LABELS: Record<ControlIngresoStatus, string> = {
  borrador: 'Borrador',
  en_revision: 'En revisión',
  emitido: 'Emitido',
  notificado: 'Notificado',
  cerrado: 'Cerrado',
  reemitido: 'Reemitido',
};

// Labels de coordinaciones
export const COORDINACION_LABELS: Record<Coordinacion, string> = {
  COORDINACION_1: 'Coordinación 1',
  COORDINACION_2: 'Coordinación 2',
  COORDINACION_3: 'Coordinación 3',
  COORDINACION_4: 'Coordinación 4',
  COORDINACION_5: 'Coordinación 5',
};
