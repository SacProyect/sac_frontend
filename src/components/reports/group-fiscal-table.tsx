import { GroupRecordProcess, GroupRecordsApiResponse } from '@/types/group-records';
import { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/UI/input';

interface GroupFiscalTableProps {
  data: GroupRecordsApiResponse | null;
}

type ProcessTab = GroupRecordProcess | 'ALL';

const PROCESS_TABS: { key: ProcessTab; label: string }[] = [
  { key: 'ALL', label: 'Todos' },
  { key: 'FP', label: 'FP' },
  { key: 'AF', label: 'AF' },
  { key: 'VDF', label: 'VDF' },
  { key: 'NA', label: 'N/A' },
];

type SortDir = 'asc' | 'desc' | null;

interface TableRow {
  fiscal: string;
  process: string;
  multas: number;
  iva: number;
  islr: number;
  total: number;
}

const fmtCurrency = (n: number) =>
  n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function GroupFiscalTable({ data }: GroupFiscalTableProps) {
  const [activeTab, setActiveTab] = useState<ProcessTab>('ALL');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const rows: TableRow[] = useMemo(() => {
    if (!data) return [];
    let filtered = data.records;
    if (activeTab !== 'ALL') {
      filtered = filtered.filter((r) => r.process === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((r) => r.fiscal.name.toLowerCase().includes(q));
    }
    return filtered.map((r) => ({
      fiscal: r.fiscal.name,
      process: r.process,
      multas: Number(r.collectedFines ?? 0),
      iva: Number(r.collectedIVA ?? 0),
      islr: Number(r.collectedISLR ?? 0),
      total: Number(r.collectedFines ?? 0) + Number(r.collectedIVA ?? 0) + Number(r.collectedISLR ?? 0),
    }));
  }, [data, activeTab, search]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return rows;
    return [...rows].sort((a, b) => {
      const aVal = a[sortKey as keyof TableRow];
      const bVal = b[sortKey as keyof TableRow];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
    });
  }, [rows, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortKey(null); setSortDir(null); }
      else { setSortDir('asc'); }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortKey !== column) return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-600" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1 text-indigo-400" />
      : <ArrowDown className="w-3 h-3 ml-1 text-indigo-400" />;
  };

  const ThButton = ({ column, label }: { column: string; label: string }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors"
    >
      {label}
      <SortIcon column={column} />
    </button>
  );

  if (!data) {
    return (
      <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-8 text-center">
        <p className="text-slate-500">Seleccione un grupo para ver sus estadísticas</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 overflow-hidden">
      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-slate-700/60">
        <div className="flex items-center gap-1 bg-slate-900/60 rounded-lg p-1 border border-slate-700/40">
          {PROCESS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Buscar fiscal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-slate-900/60 border-slate-700/60 text-slate-200 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-700/60">
              <th className="p-3 text-left"><ThButton column="fiscal" label="Fiscal" /></th>
              <th className="p-3 text-left"><ThButton column="process" label="Proceso" /></th>
              <th className="p-3 text-right"><ThButton column="multas" label="Multas $" /></th>
              <th className="p-3 text-right"><ThButton column="iva" label="IVA $" /></th>
              <th className="p-3 text-right"><ThButton column="islr" label="ISLR $" /></th>
              <th className="p-3 text-right"><ThButton column="total" label="Total $" /></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                  No se encontraron registros
                </td>
              </tr>
            ) : (
              sorted.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-slate-700/30 hover:bg-slate-700/30 transition-colors"
                >
                  <td className="p-3 text-sm font-medium text-white">{row.fiscal}</td>
                  <td className="p-3">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      row.process === 'FP' ? 'bg-blue-500/15 text-blue-400' :
                      row.process === 'AF' ? 'bg-amber-500/15 text-amber-400' :
                      row.process === 'VDF' ? 'bg-red-500/15 text-red-400' :
                      'bg-slate-500/15 text-slate-400'
                    }`}>{row.process}</span>
                  </td>
                  <td className="p-3 text-right text-sm text-slate-300 tabular-nums">{fmtCurrency(row.multas)}</td>
                  <td className="p-3 text-right text-sm text-slate-300 tabular-nums">{fmtCurrency(row.iva)}</td>
                  <td className="p-3 text-right text-sm text-slate-300 tabular-nums">{fmtCurrency(row.islr)}</td>
                  <td className="p-3 text-right text-sm font-bold text-emerald-400 tabular-nums">{fmtCurrency(row.total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/60 bg-slate-900/40">
        <p className="text-xs text-slate-500">
          {sorted.length} {sorted.length === 1 ? 'fiscal' : 'fiscales'} muestreados
          {activeTab !== 'ALL' ? ` en proceso ${activeTab}` : ''}
        </p>
        <p className="text-[10px] text-slate-600">Click en encabezados para ordenar</p>
      </div>
    </div>
  );
}
