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

function MonthGrid({ months, totalMonths, filledColor, emptyColor, onEmptyClick, taxpayerId }: {
  months: number[];
  totalMonths: number;
  filledColor: string;
  emptyColor: string;
  onEmptyClick?: (month: number) => void;
  taxpayerId?: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: totalMonths }, (_, i) => {
        const monthNum = i + 1;
        const isFilled = months.includes(monthNum);
        return (
          <div
            key={monthNum}
            title={`${MONTHS_SHORT[i]} ${isFilled ? '✓' : '✗'}`}
            onClick={() => {
              if (!isFilled && onEmptyClick && taxpayerId) {
                onEmptyClick(monthNum);
              }
            }}
            className={`w-5 h-5 rounded-sm text-[8px] font-bold flex items-center justify-center cursor-default transition-all
              ${isFilled ? filledColor : emptyColor}
              ${!isFilled && onEmptyClick && taxpayerId ? 'cursor-pointer hover:scale-110' : ''}
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

  const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <Card className="bg-slate-800 border-slate-700 p-4 transition-all duration-200 hover:shadow-md">
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
        <StatCard label="Total Contribuyentes" value={summary?.total || 0} color="text-white" />
        <StatCard label="Con IVA" value={summary?.conIVA || 0} color="text-green-400" />
        <StatCard label="Sin IVA" value={summary?.sinIVA || 0} color="text-red-400" />
        <StatCard label="Con ISLR" value={summary?.conISLR || 0} color="text-green-400" />
        <StatCard label="Sin ISLR" value={summary?.sinISLR || 0} color="text-red-400" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div />
        <StatCard label="Con Multas" value={summary?.conMultas || 0} color="text-blue-400" />
        <StatCard label="Sin Multas" value={summary?.sinMultas || 0} color="text-slate-400" />
        <div />
        <div />
      </div>

      {/* Year selector + Search */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Año:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="h-8 min-w-[90px] rounded-md border border-slate-600 bg-slate-700 px-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre o RIF..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 max-w-xs h-8"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="bg-slate-800 border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50">
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
                const ivaCount = t.ivaMonths?.length || 0;
                const fineCount = t.fineMonths?.length || 0;
                const isExpanded = expandedRowId === t.id;

                return (
                  <React.Fragment key={t.id}>
                    {/* Main row */}
                    <tr
                      className={`border-b border-slate-700/50 cursor-pointer transition-colors hover:bg-slate-700/30 ${
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
                          ivaCount === 12
                            ? 'bg-green-900/50 text-green-200 border-green-800'
                            : ivaCount > 0
                            ? 'bg-yellow-900/50 text-yellow-200 border-yellow-800'
                            : 'bg-red-900/50 text-red-200 border-red-800'
                        }`}>
                          {ivaCount}/12 meses
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
                          fineCount > 0
                            ? 'bg-blue-900/50 text-blue-200 border-blue-800'
                            : 'bg-slate-700/50 text-slate-400 border-slate-600'
                        }`}>
                          {fineCount}/12 meses
                        </Badge>
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          {ivaCount < 12 && (
                            <Button
                              size="sm"
                              onClick={() => navigate(`/iva?taxpayerId=${t.id}`)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-7 px-2.5"
                            >
                              <FilePlus className="h-3 w-3 mr-1" />
                              IVA
                            </Button>
                          )}
                          {!t.islrFiled && (
                            <Button
                              size="sm"
                              onClick={() => navigate(`/islr?taxpayerId=${t.id}`)}
                              className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-7 px-2.5"
                            >
                              <FilePlus className="h-3 w-3 mr-1" />
                              ISLR
                            </Button>
                          )}
                          {ivaCount >= 12 && t.islrFiled && (
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
                          Haz clic en un mes 🔴 para cargar IVA
                        </td>
                        <td className="p-2 align-top">
                          <MonthGrid
                            months={t.ivaMonths || []}
                            totalMonths={12}
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
                        <td className="p-2 align-top">
                          <MonthGrid
                            months={t.fineMonths || []}
                            totalMonths={12}
                            filledColor="bg-blue-600 text-blue-100"
                            emptyColor="bg-slate-700/50 text-slate-500"
                            taxpayerId={t.id}
                          />
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

      {filteredTaxpayers.length === 0 && (
        <EmptyState title="Sin resultados" message="Ningún contribuyente coincide con la búsqueda." />
      )}
    </div>
  );
}
