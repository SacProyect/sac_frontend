import { FiscalInfo } from './reports';

/**
 * Información extendida del fiscal para componentes V2
 * Compatible con diferentes formatos de respuesta del backend
 */
export interface FiscalInfoExtended extends Partial<FiscalInfo> {
  // Campos base de FiscalInfo
  fiscalName?: string;
  fiscalId?: string;
  totalTaxpayers?: number;
  totalProcess?: number;
  totalCompleted?: number;
  totalNotified?: number;
  
  // Campos adicionales para compatibilidad
  id?: string;
  name?: string;
  nombre?: string;
  position?: number;
  posicionRanking?: number;
  totalAssigned?: number;
  totalAsignados?: number;
  completed?: number;
  completados?: number;
  pending?: number;
  pendientes?: number;
  completionRate?: number;
  complianceRate?: number;
  
  // VDF stats
  vdfInTime?: number;
  vdfEnPlazo?: number;
  vdfOutOfTimeProcess?: number;
  vdfFueraPlazoProceso?: number;
  vdfOutOfTimeLeft?: number;
  vdfFueraPlazoDejada?: number;
  
  // Recaudación y metas
  recaudacion?: number;
  meta?: number;
  target?: number;
}
