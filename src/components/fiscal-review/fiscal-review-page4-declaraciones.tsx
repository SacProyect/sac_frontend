import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/UI/card';
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/badge';
import { Input } from '@/components/UI/input';
import { LoadingState, EmptyState } from '@/components/UI/v2';
import { Search, FilePlus, ChevronDown, ChevronRight } from 'lucide-react';
import { getFiscalDeclarationStatus } from '@/components/utils/api/taxpayer-functions';
import type { TaxpayerDeclarationStatus, DeclarationStatusSummary } from '@/types/declaration-status';
import { useDebounce } from '@/hooks/use-debounce';
import toast from 'react-hot-toast';

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface Props {
  fiscalId: string;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
}

function MonthGrid({ months, totalMonths, filledColor, emptyColor, onEmptyClick, taxpayerId, maxClickableMonth }: {
  months: number[];
  totalMonths: number;
  filledColor: string;
  emptyColor: string;
  onEmptyClick?: (month: number) => void;
  taxpayerId?: string;
  maxClickableMonth?: number;
}) {
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: totalMonths }, (_, i) => {
        const monthNum = i + 1;
        const isFilled = months.includes(monthNum);
        const isFuture = maxClickableMonth !== undefined && monthNum > maxClickableMonth;
        const isClickable = !isFilled && !isFuture && !!onEmptyClick && !!taxpayerId;
        return (
          <div
            key={monthNum}
            title={
              isFuture
                ? `${MONTHS_SHORT[i]} (Mes futuro)`
                : `${MONTHS_SHORT[i]} ${isFilled ? '✓' : '✗'}`
            }
            onClick={() => {
              if (isClickable) onEmptyClick(monthNum);
            }}
            className={`w-5 h-5 rounded-sm text-[8px] font-bold flex items-center justify-center cursor-default transition-all lg:w-6 lg:h-6 lg:text-[10px]
              ${isFuture ? 'bg-slate-800/50 text-slate-600' : isFilled ? filledColor : emptyColor}
              ${isClickable ? 'cursor-pointer hover:scale-110' : ''}
            `}
          >
            {monthNum}
          </div>
        );
      })}
    </div>
  );
}

export function FiscalReviewPage4Declaraciones({ fiscalId, selectedYear, setSelectedYear }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ taxpayers: TaxpayerDeclarationStatus[]; summary: DeclarationStatusSummary } | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchValue.toLowerCase(), 300);

  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth() + 1;

  const maxEligibleMonth = useMemo(() => {
    if (selectedYear < todayYear) return 12;
    if (selectedYear === todayYear) return todayMonth;
    return 0; // Future year — no months eligible yet
  }, [selectedYear, todayYear, todayMonth]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getFiscalDeclarationStatus(fiscalId, selectedYear);
        setData(result);
      } catch (e: any) {
        toast.error(e.message || 'Error al cargar estado de declaraciones');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fiscalId, selectedYear]);

  const filteredTaxpayers = useMemo(() => {
    if (!data?.taxpayers) return [];
    const q = debouncedSearch.trim();
    if (!q) return data.taxpayers;
    return data.taxpayers.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.rif.toLowerCase().includes(q)
    );
  }, [data?.taxpayers, debouncedSearch]);

  const summary = data?.summary;

  if (loading) {
    return <LoadingState message="Cargando estado de declaraciones..." />;
  }

  if (!data || data.taxpayers.length === 0) {
    return (
      <EmptyState
        title="Sin contribuyentes asignados"
        message={`No se encontraron contribuyentes para este fiscal en el año ${selectedYear}.`}
      />
    );
  }

  const StatCard = ({ label, value, color, borderClass }: { label: string; value: number; color: string; borderClass?: string }) => (
    <Card className={`bg-slate-800 border-slate-700 p-4 transition-all duration-200 hover:shadow-md${borderClass ? ' ' + borderClass : ''}`}>
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </Card>
  );

  const handleRowClick = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  const handleIvaMonthClick = (month: number, taxpayerId: string) => {
    navigate(`/iva?taxpayerId=${taxpayerId}&month=${month}&year=${selectedYear}`);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total Contribuyentes" value={summary?.total || 0} color="text-white" borderClass="md:border-t-2 md:border-slate-500/30" />
        <StatCard label="Con IVA" value={summary?.conIVA || 0} color="text-green-400" borderClass="md:border-t-2 md:border-green-500/30" />
        <StatCard label="Sin IVA" value={summary?.sinIVA || 0} color="text-red-400" borderClass="md:border-t-2 md:border-red-500/30" />
        <StatCard label="Con ISLR" value={summary?.conISLR || 0} color="text-green-400" borderClass="md:border-t-2 md:border-green-500/30" />
        <StatCard label="Sin ISLR" value={summary?.sinISLR || 0} color="text-red-400" borderClass="md:border-t-2 md:border-red-500/30" />
        <StatCard label="Con Multas" value={summary?.conMultas || 0} color="text-blue-400" borderClass="md:border-t-2 md:border-blue-500/30" />
        <StatCard label="Sin Multas" value={summary?.sinMultas || 0} color="text-slate-400" borderClass="md:border-t-2 md:border-slate-500/30" />
      </div>

      {/* Year selector + Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Año:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="h-8 flex-1 md:flex-none min-w-[90px] rounded-md border border-slate-600 bg-slate-700 px-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <Input
            placeholder="Buscar por nombre o RIF..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 w-full md:max-w-xs h-8"
          />
        </div>
      </div>

      {/* Table — desktop only */}
      <div className="hidden md:block">
      <Card className="bg-slate-800 border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-slate-800/95 backdrop-blur-sm">
              <tr className="border-b border-slate-700">
                <th className="w-8 p-3" />
                <th className="text-left p-3 text-slate-300 font-semibold text-sm">Contribuyente</th>
                <th className="text-left p-3 text-slate-300 font-semibold text-sm">RIF</th>
                <th className="text-left p-3 text-slate-300 font-semibold text-sm">Proceso</th>
                <th className="text-center p-3 text-slate-300 font-semibold text-sm">IVA</th>
                <th className="text-center p-3 text-slate-300 font-semibold text-sm">ISLR</th>
                <th className="text-center p-3 text-slate-300 font-semibold text-sm">Multas</th>
                <th className="text-right p-3 text-slate-300 font-semibold text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTaxpayers.map((t) => {
                const effectiveMax = maxEligibleMonth || 12;
                const ivaCount = t.ivaMonths?.length || 0;
                const fineCount = t.fineMonths?.length || 0;
                const isExpanded = expandedRowId === t.id;

                return (
                  <React.Fragment key={t.id}>
                    {/* Main row */}
                    <tr
                      className={`border-b border-slate-700/50 cursor-pointer transition-all hover:bg-slate-700/30 hover:shadow-sm ${
                        !t.hasIVA && !t.hasISLR ? 'bg-red-900/10' : ''
                      }`}
                      onClick={() => handleRowClick(t.id)}
                    >
                      <td className="w-8 p-3 text-slate-500">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </td>
                      <td className="p-3 text-slate-200 font-medium text-sm">{t.name}</td>
                      <td className="p-3 text-slate-400 text-sm font-mono">{t.rif}</td>
                      <td className="p-3">
                        <Badge className="bg-blue-900/50 text-blue-200 border-blue-800 text-xs">
                          {t.process}
                        </Badge>
                      </td>
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <Badge className={`text-xs ${
                          effectiveMax === 0
                            ? 'bg-slate-700/50 text-slate-400 border-slate-600'
                            : ivaCount >= effectiveMax
                            ? 'bg-green-900/50 text-green-200 border-green-800'
                            : ivaCount > 0
                            ? 'bg-yellow-900/50 text-yellow-200 border-yellow-800'
                            : 'bg-red-900/50 text-red-200 border-red-800'
                        }`}>
                          {effectiveMax === 0 ? '—' : `${ivaCount}/${effectiveMax} meses`}
                        </Badge>
                      </td>
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {t.islrFiled ? (
                          <Badge className="bg-green-900/50 text-green-200 border-green-800 text-xs">Cargado</Badge>
                        ) : (
                          <Badge className="bg-red-900/50 text-red-200 border-red-800 text-xs">Pendiente</Badge>
                        )}
                      </td>
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <Badge className={`text-xs ${
                          effectiveMax === 0
                            ? 'bg-slate-700/50 text-slate-400 border-slate-600'
                            : fineCount > 0
                            ? 'bg-blue-900/50 text-blue-200 border-blue-800'
                            : 'bg-slate-700/50 text-slate-400 border-slate-600'
                        }`}>
                          {fineCount > 0 ? `${fineCount} multas` : 'Sin multas'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          {effectiveMax > 0 && ivaCount < effectiveMax && (
                            <Button
                              size="sm"
                              onClick={() => navigate(`/iva?taxpayerId=${t.id}`)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-7 px-2.5 transition-transform hover:scale-105"
                            >
                              <FilePlus className="h-3 w-3 mr-1" />
                              IVA
                            </Button>
                          )}
                          {!t.islrFiled && (
                            <Button
                              size="sm"
                              onClick={() => navigate(`/islr?taxpayerId=${t.id}`)}
                              className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-7 px-2.5 transition-transform hover:scale-105"
                            >
                              <FilePlus className="h-3 w-3 mr-1" />
                              ISLR
                            </Button>
                          )}
                          {(effectiveMax === 0 || (ivaCount >= effectiveMax)) && t.islrFiled && (
                            <span className="text-xs text-slate-500 italic leading-7">Completo</span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row — cells align under corresponding columns */}
                    {isExpanded && (
                      <tr className="border-b border-slate-700/50 bg-slate-900/40">
                        <td />
                        <td colSpan={3} className="p-2 text-[10px] text-slate-500 italic">
                          {maxEligibleMonth > 0 ? 'Haz clic en un mes 🔴 para cargar IVA — meses en gris son futuros' : 'Aún no hay meses disponibles para este año'}
                        </td>
                        <td className="p-2 align-top">
                          <MonthGrid
                            months={t.ivaMonths || []}
                            totalMonths={12}
                            maxClickableMonth={maxEligibleMonth}
                            filledColor="bg-green-600 text-green-100"
                            emptyColor="bg-red-900/60 text-red-300"
                            onEmptyClick={(month) => handleIvaMonthClick(month, t.id)}
                            taxpayerId={t.id}
                          />
                        </td>
                        <td className="p-2 align-top text-center">
                          <span className={`text-[10px] font-semibold ${t.islrFiled ? 'text-green-400' : 'text-red-400'}`}>
                            {t.islrFiled ? '✓ Anual cargado' : '✗ Pendiente'}
                          </span>
                        </td>
                        <td className="p-2 align-top text-center">
                          <span className="text-[10px] text-slate-500">
                            {fineCount > 0 ? `${fineCount} eventos` : '—'}
                          </span>
                        </td>
                        <td />
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      </div>

      {/* Mobile cards — replaces table on small screens */}
      <div className="block md:hidden space-y-2">
        {filteredTaxpayers.map((t) => {
          const effectiveMax = maxEligibleMonth || 12;
          const ivaCount = t.ivaMonths?.length || 0;
          const fineCount = t.fineMonths?.length || 0;
          const isExpanded = expandedRowId === t.id;

          return (
            <div key={t.id}>
              <div
                onClick={() => handleRowClick(t.id)}
                className={`bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 transition-all duration-200 hover:bg-slate-800/80 ${
                  isExpanded ? 'rounded-b-none border-b-0' : ''
                } ${!t.hasIVA && !t.hasISLR ? 'border-red-900/30' : ''}`}
              >
                {/* Top: chevron + name + RIF + process badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-slate-200 truncate">{t.name}</p>
                      <p className="text-xs font-mono text-slate-400 truncate">{t.rif}</p>
                    </div>
                  </div>
                  <Badge className="shrink-0 bg-blue-900/50 text-blue-200 border-blue-800 text-xs">
                    {t.process}
                  </Badge>
                </div>

                {/* Middle: status badges */}
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  <Badge className={`text-[10px] ${
                    effectiveMax === 0
                      ? 'bg-slate-700/50 text-slate-400 border-slate-600'
                      : ivaCount >= effectiveMax
                      ? 'bg-green-900/50 text-green-200 border-green-800'
                      : ivaCount > 0
                      ? 'bg-yellow-900/50 text-yellow-200 border-yellow-800'
                      : 'bg-red-900/50 text-red-200 border-red-800'
                  }`}>
                    IVA: {effectiveMax === 0 ? '—' : `${ivaCount}/${effectiveMax}`}
                  </Badge>
                  <Badge className={`text-[10px] ${
                    t.islrFiled
                      ? 'bg-green-900/50 text-green-200 border-green-800'
                      : 'bg-red-900/50 text-red-200 border-red-800'
                  }`}>
                    ISLR: {t.islrFiled ? 'Cargado' : 'Pendiente'}
                  </Badge>
                  <Badge className={`text-[10px] ${
                    fineCount > 0
                      ? 'bg-blue-900/50 text-blue-200 border-blue-800'
                      : 'bg-slate-700/50 text-slate-400 border-slate-600'
                  }`}>
                    {fineCount > 0 ? `${fineCount} multas` : 'Sin multas'}
                  </Badge>
                </div>

                {/* Bottom: action buttons */}
                <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                  {effectiveMax > 0 && ivaCount < effectiveMax && (
                    <Button
                      size="sm"
                      onClick={() => navigate(`/iva?taxpayerId=${t.id}`)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-7 px-2.5 flex-1 transition-transform hover:scale-[1.02]"
                    >
                      <FilePlus className="h-3 w-3 mr-1" />
                      IVA
                    </Button>
                  )}
                  {!t.islrFiled && (
                    <Button
                      size="sm"
                      onClick={() => navigate(`/islr?taxpayerId=${t.id}`)}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-7 px-2.5 flex-1 transition-transform hover:scale-[1.02]"
                    >
                      <FilePlus className="h-3 w-3 mr-1" />
                      ISLR
                    </Button>
                  )}
                  {(effectiveMax === 0 || (ivaCount >= effectiveMax)) && t.islrFiled && (
                    <span className="text-xs text-slate-500 italic leading-7">Completo</span>
                  )}
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="bg-slate-900/60 border border-slate-700/50 rounded-b-lg p-3 -mt-px space-y-2">
                  {maxEligibleMonth > 0 ? (
                    <p className="text-[10px] text-slate-500 italic">Haz clic en un mes 🔴 para cargar IVA — meses en gris son futuros</p>
                  ) : (
                    <p className="text-[10px] text-slate-500 italic">Aún no hay meses disponibles para este año</p>
                  )}
                  <MonthGrid
                    months={t.ivaMonths || []}
                    totalMonths={12}
                    maxClickableMonth={maxEligibleMonth}
                    filledColor="bg-green-600 text-green-100"
                    emptyColor="bg-red-900/60 text-red-300"
                    onEmptyClick={(month) => handleIvaMonthClick(month, t.id)}
                    taxpayerId={t.id}
                  />
                  <div className="flex gap-4 text-xs pt-1">
                    <span className={`font-semibold ${t.islrFiled ? 'text-green-400' : 'text-red-400'}`}>
                      {t.islrFiled ? '✓ Anual cargado' : '✗ Pendiente'}
                    </span>
                    <span className="text-slate-400">
                      {fineCount > 0 ? `${fineCount} eventos` : 'Sin multas'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredTaxpayers.length === 0 && (
        <EmptyState title="Sin resultados" message="Ningún contribuyente coincide con la búsqueda." />
      )}
    </div>
  );
}
