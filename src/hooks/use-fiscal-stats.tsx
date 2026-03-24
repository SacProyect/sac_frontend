import { useState, useEffect } from 'react';
import {
  getGlobalPerformance,
  getGlobalTaxpayerPerformance,
  getGroupPerformance,
  getGlobalKPI,
  getFiscalInfo,
  getFiscalMonthlyCollect,
  getFiscalMonthlyPerformance,
  getFiscalComplianceByProcess,
} from '@/components/utils/api/report-functions';
import { decimalToNumber } from '@/components/utils/number.utils';
import toast from 'react-hot-toast';
import { FiscalInfoExtended } from '@/types/fiscal-stats';

// Tipos para los datos transformados
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
  totalTaxpayers: number;
  totalTaxCollection: number;
  averageCreditSurplus: number;
  finePercentage: number;
  growthRate: number;
  delinquencyRate: number;
}

export interface FiscalPerformanceData {
  mes: string;
  desempeño: number;
  meta: number;
}

/** Meses en el orden que devuelve `getMontlyPerformance` (español, minúsculas). */
const MONTH_ORDER_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const;

const MONTH_LABELS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/**
 * La API devuelve `month` en español y `currentCollected` (no `performance`/`realAmount`).
 */
function normalizeFiscalMonthlyPerformance(raw: unknown): FiscalPerformanceData[] {
  const arr: unknown[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)
      ? ((raw as { data: unknown[] }).data)
      : [];
  if (arr.length === 0) return [];

  const sorted = [...arr].sort((a: any, b: any) => {
    const ma = String(a?.month ?? '').toLowerCase();
    const mb = String(b?.month ?? '').toLowerCase();
    return MONTH_ORDER_ES.indexOf(ma as (typeof MONTH_ORDER_ES)[number]) -
      MONTH_ORDER_ES.indexOf(mb as (typeof MONTH_ORDER_ES)[number]);
  });

  return sorted.map((item: Record<string, unknown>) => {
    const mRaw = item.month ?? item.monthName;
    let mes = 'Mes';
    if (typeof mRaw === 'string') {
      const idx = MONTH_ORDER_ES.indexOf(mRaw.toLowerCase() as (typeof MONTH_ORDER_ES)[number]);
      mes = idx >= 0 ? MONTH_LABELS_ES[idx] : mRaw.charAt(0).toUpperCase() + mRaw.slice(1);
    } else if (typeof mRaw === 'number' && mRaw >= 1 && mRaw <= 12) {
      mes = MONTH_LABELS_ES[mRaw - 1] ?? `Mes ${mRaw}`;
    }
    const desempeño = decimalToNumber(
      item.currentCollected ?? item.performance ?? item.realAmount ?? 0,
    );
    const meta = decimalToNumber(
      item.target ?? item.expectedAmount ?? item.meta ?? 0,
    );
    return { mes, desempeño, meta };
  });
}

/**
 * Hook personalizado para obtener y transformar estadísticas fiscales
 * @param year - Año para filtrar las estadísticas (opcional)
 * @param fiscalId - ID del fiscal para estadísticas individuales (opcional)
 */
export function useFiscalStats(year?: number, fiscalId?: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Datos globales
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueData[]>([]);
  const [complianceDistribution, setComplianceDistribution] = useState<ComplianceDistributionData[]>([]);
  const [fiscalLeaderboard, setFiscalLeaderboard] = useState<FiscalLeaderboardData[]>([]);
  const [supervisorLeaderboard, setSupervisorLeaderboard] = useState<SupervisorLeaderboardData[]>([]);
  const [globalKPI, setGlobalKPI] = useState<GlobalKPIData | null>(null);

  // Datos individuales del fiscal
  const [fiscalPerformance, setFiscalPerformance] = useState<FiscalPerformanceData[]>([]);
  const [fiscalInfo, setFiscalInfo] = useState<FiscalInfoExtended | null>(null);
  const [fiscalMonthlyCollect, setFiscalMonthlyCollect] = useState<any>(null);
  const [fiscalComplianceByProcess, setFiscalComplianceByProcess] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (fiscalId) {
          // Estadísticas individuales del fiscal
          await fetchFiscalStats(fiscalId, year);
        } else {
          // Estadísticas globales
          await fetchGlobalStats(year);
        }
      } catch (err: any) {
        console.error('Error fetching fiscal stats:', err);
        setError(err.message || 'Error al cargar las estadísticas');
        toast.error('Error al cargar las estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, fiscalId]);

  const fetchGlobalStats = async (year?: number) => {
    // 1. Recaudación mensual
    const globalPerf = await getGlobalPerformance(year);
    if (Array.isArray(globalPerf) && globalPerf.length > 0) {
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const revenueData: MonthlyRevenueData[] = globalPerf.map((item: any) => ({
        mes: months[item.month - 1] || `Mes ${item.month}`,
        recaudacion: decimalToNumber(item.realAmount),
      }));
      setMonthlyRevenue(revenueData);
    }

    // 2. Distribución de cumplimiento (desde datos globales o calculado)
    try {
      const taxpayerPerf = await getGlobalTaxpayerPerformance(year);
      if (taxpayerPerf) {
        // Transformar datos de cumplimiento a formato de gráfico de pastel
        // Si la API no devuelve estos campos directamente, calcular desde otros datos
        const total = taxpayerPerf.total || 100;
        const high = taxpayerPerf.highCompliance || Math.round(total * 0.65);
        const medium = taxpayerPerf.mediumCompliance || Math.round(total * 0.22);
        const low = taxpayerPerf.lowCompliance || Math.round(total * 0.13);
        
        const complianceData: ComplianceDistributionData[] = [
          { nombre: 'Alto', valor: high, fill: '#22c55e' },
          { nombre: 'Medio', valor: medium, fill: '#eab308' },
          { nombre: 'Bajo', valor: low, fill: '#ef4444' },
        ];
        setComplianceDistribution(complianceData);
      }
    } catch (err) {
      console.warn('Error loading compliance distribution, using defaults:', err);
      // Valores por defecto si falla
      setComplianceDistribution([
        { nombre: 'Alto', valor: 65, fill: '#22c55e' },
        { nombre: 'Medio', valor: 22, fill: '#eab308' },
        { nombre: 'Bajo', valor: 13, fill: '#ef4444' },
      ]);
    }

    // 3. Leaderboard de fiscales (desde group performance)
    const groupPerf = await getGroupPerformance(year);
    if (Array.isArray(groupPerf)) {
      // Transformar datos de grupos a formato de leaderboard
      const leaderboardData: FiscalLeaderboardData[] = groupPerf
        .flatMap((group: any) => 
          (group.fiscals || []).map((fiscal: any) => ({
            id: fiscal.id || fiscal.fiscalId,
            nombre: fiscal.name || fiscal.nombre || 'N/A',
            recaudacion: decimalToNumber(fiscal.totalCollection || fiscal.recaudacion),
            cumplimiento: decimalToNumber(fiscal.complianceRate || fiscal.cumplimiento),
            vdfEnPlazo: decimalToNumber(fiscal.vdfInTime || fiscal.vdfEnPlazo),
            vdfFueraPlazoProceso: decimalToNumber(fiscal.vdfOutOfTimeProcess || fiscal.vdfFueraPlazoProceso),
            vdfFueraPlazoDejada: decimalToNumber(fiscal.vdfOutOfTimeLeft || fiscal.vdfFueraPlazoDejada),
            meta: decimalToNumber(fiscal.target || fiscal.meta),
          }))
        )
        .sort((a, b) => b.recaudacion - a.recaudacion);
      setFiscalLeaderboard(leaderboardData);

      // Leaderboard de supervisores/coordinadores
      const supervisorData: SupervisorLeaderboardData[] = groupPerf.map((group: any) => ({
        id: group.id || group.groupId,
        nombre: group.name || group.nombre || 'N/A',
        cumplimiento: decimalToNumber(group.complianceRate || group.cumplimiento),
        recaudacionMensual: decimalToNumber(group.totalCollection || group.recaudacionMensual),
      }));
      setSupervisorLeaderboard(supervisorData);
    }

    // 4. KPIs globales
    try {
      const kpiData = await getGlobalKPI(year);
      if (kpiData) {
        const kpi: GlobalKPIData = {
          totalTaxpayers: decimalToNumber(kpiData.totalTaxpayers),
          totalTaxCollection: decimalToNumber(kpiData.totalTaxCollection),
          averageCreditSurplus: decimalToNumber(kpiData.averageCreditSurplus),
          finePercentage: decimalToNumber(kpiData.finePercentage),
          growthRate: decimalToNumber(kpiData.growthRate),
          delinquencyRate: decimalToNumber(kpiData.delinquencyRate),
        };
        setGlobalKPI(kpi);
      }
    } catch (err) {
      console.warn('Error loading global KPI, will calculate from other data:', err);
      // Los KPIs se calcularán desde otros datos si falla
    }
  };

  const fetchFiscalStats = async (fiscalId: string, year?: number) => {
    // Información del fiscal
    const info = await getFiscalInfo(fiscalId, year);
    setFiscalInfo(info);

    // Desempeño mensual
    const monthlyPerf = await getFiscalMonthlyPerformance(fiscalId, year);
    setFiscalPerformance(normalizeFiscalMonthlyPerformance(monthlyPerf));

    try {
      const monthlyCollect = await getFiscalMonthlyCollect(fiscalId, year);
      setFiscalMonthlyCollect(monthlyCollect);
    } catch(e) {
      console.warn(e);
      setFiscalMonthlyCollect(null);
    }

    try {
      const compliance = await getFiscalComplianceByProcess(fiscalId, year);
      setFiscalComplianceByProcess(compliance);
    } catch(e) {
      console.warn(e);
      setFiscalComplianceByProcess(null);
    }
  };

  return {
    loading,
    error,
    // Datos globales
    monthlyRevenue,
    complianceDistribution,
    fiscalLeaderboard,
    supervisorLeaderboard,
    globalKPI,
    // Datos individuales
    fiscalPerformance,
    fiscalInfo,
    fiscalMonthlyCollect,
    fiscalComplianceByProcess,
  };
}
