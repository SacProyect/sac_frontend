import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/UI/card';
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/badge';
import { Input } from '@/components/UI/input';
import { LoadingState, EmptyState } from '@/components/UI/v2';
import { Search, FilePlus, CheckCircle2, XCircle } from 'lucide-react';
import { getFiscalDeclarationStatus } from '@/components/utils/api/taxpayer-functions';
import type { TaxpayerDeclarationStatus, DeclarationStatusSummary } from '@/types/declaration-status';
import { useDebounce } from '@/hooks/use-debounce';
import toast from 'react-hot-toast';

interface Props {
  fiscalId: string;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
}

export function FiscalReviewPage4Declaraciones({ fiscalId, selectedYear, setSelectedYear }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ taxpayers: TaxpayerDeclarationStatus[]; summary: DeclarationStatusSummary } | null>(null);
  const [searchValue, setSearchValue] = useState('');
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

      {/* Year selector */}
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

      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar por nombre o RIF..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 max-w-xs"
        />
      </div>

      {/* Table */}
      <Card className="bg-slate-800 border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50">
                <th className="text-left p-3 text-slate-300 font-semibold text-sm">Contribuyente</th>
                <th className="text-left p-3 text-slate-300 font-semibold text-sm">RIF</th>
                <th className="text-left p-3 text-slate-300 font-semibold text-sm">Proceso</th>
                <th className="text-left p-3 text-slate-300 font-semibold text-sm">Fase</th>
                <th className="text-center p-3 text-slate-300 font-semibold text-sm">IVA</th>
                <th className="text-center p-3 text-slate-300 font-semibold text-sm">ISLR</th>
                <th className="text-right p-3 text-slate-300 font-semibold text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTaxpayers.map((t, idx) => (
                <tr
                  key={t.id}
                  className={`border-b border-slate-700/50 hover:bg-slate-700/50 transition-all duration-200 ${
                    !t.hasIVA ? 'bg-red-900/10' : ''
                  }`}
                >
                  <td className="p-3 text-slate-200 font-medium text-sm">{t.name}</td>
                  <td className="p-3 text-slate-400 text-sm font-mono">{t.rif}</td>
                  <td className="p-3">
                    <Badge className="bg-blue-900/50 text-blue-200 border-blue-800 text-xs">
                      {t.process}
                    </Badge>
                  </td>
                  <td className="p-3 text-slate-400 text-sm">{t.fase?.replace('_', ' ')}</td>
                  <td className="p-3 text-center">
                    {t.hasIVA ? (
                      <span className="inline-flex items-center gap-1 text-green-400 text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4" /> Cargado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-400 text-sm font-medium">
                        <XCircle className="h-4 w-4" /> Pendiente
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {t.hasISLR ? (
                      <span className="inline-flex items-center gap-1 text-green-400 text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4" /> Cargado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-400 text-sm font-medium">
                        <XCircle className="h-4 w-4" /> Pendiente
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {!t.hasIVA && (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/iva?taxpayerId=${t.id}`)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-3"
                        >
                          <FilePlus className="h-3 w-3 mr-1" />
                          IVA
                        </Button>
                      )}
                      {!t.hasISLR && (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/islr?taxpayerId=${t.id}`)}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 px-3"
                        >
                          <FilePlus className="h-3 w-3 mr-1" />
                          ISLR
                        </Button>
                      )}
                      {t.hasIVA && t.hasISLR && (
                        <span className="text-xs text-slate-500 italic">Completo</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
