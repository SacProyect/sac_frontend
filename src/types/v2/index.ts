/**
 * Barrel file para tipos TypeScript de V2
 * 
 * Centraliza las definiciones de tipos para componentes V2
 */

// Re-exportar tipos existentes
export type { Taxpayer, Parish, TaxpayerCategory, FiscalTaxpayer, FiscalTaxpayerStatsResponse } from '../taxpayer';
export type { contract_type, taxpayer_process, event_type } from '../taxpayer';

// Tipos específicos para V2
export interface ContribuyenteTableData {
  id: string;
  nroProvidencia: string;
  procedimiento: string;
  razonSocial: string;
  rif: string;
  tipo: 'Ordinario' | 'Especial';
  direccion: string;
  fecha: string;
  parroquia: string;
  fiscal: string;
  originalData?: any; // Referencia al objeto Taxpayer original
}

export interface MultaFormData {
  taxpayerId: string;
  date: string;
  amount: string;
  description: string;
}

export interface AvisoFormData {
  taxpayerId: string;
  date: string;
  amount: string;
  fineEventId?: string;
}

export interface ContribuyenteFormData {
  providenceNum: string;
  process: string;
  name: string;
  rifPrefix: string;
  rif: string;
  address: string;
  parish: string;
  category: string;
  emition_date: string;
  contract_type: string;
  officerId: string;
}

// Tipos para estadísticas
export interface MonthlyRevenueData {
  mes: string;
  recaudacion: number;
}

export interface ComplianceDistributionData {
  nombre: string;
  valor: number;
  fill: string;
}

export interface FiscalLeaderboardData {
  id: string;
  nombre: string;
  recaudacion: number;
  cumplimiento: number;
  vdfEnPlazo: number;
  vdfFueraPlazoProceso: number;
  vdfFueraPlazoDejada: number;
  meta: number;
}

export interface SupervisorLeaderboardData {
  id: string;
  nombre: string;
  cumplimiento: number;
  recaudacionMensual: number;
}

export interface GlobalKPIData {
  totalContribuyentes: number;
  recaudacionTotal: number;
  promedioExcedente: number;
  morosityRate: number;
  monthlyTrend: number;
}

export interface FiscalPerformanceData {
  mes: string;
  desempeño: number;
  meta: number;
}
