import React, { useState, useMemo } from 'react'
import { GroupData } from './contribution-types';
import { 
  ArrowUpDown, 
  ChevronUp, 
  ChevronDown, 
  UserCircle2, 
  Layers, 
  Receipt, 
  Scale, 
  Users, 
  FileCheck2,
  AlertTriangle,
  History,
  Search,
  TrendingUp,
  DollarSign,
  Eye,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from '@/components/UI/badge';
import { Button } from '@/components/UI/button';
import { Card } from '@/components/UI/card';

interface ContributionsStatisticsProps {
    groupData: GroupData[],
    selectedGroup: string,
    pdfMode?: boolean
    selectedSupervisorId: string | null;
    startDate: string;
    endDate: string;
}

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
}

const KPICard = ({ title, value, subtitle, icon, color }: KPICardProps) => {
  const colorClasses = {
    indigo: "from-indigo-500/20 to-indigo-600/5 border-indigo-500/20",
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
    amber: "from-amber-500/20 to-amber-600/5 border-amber-500/20",
    rose: "from-rose-500/20 to-rose-600/5 border-rose-500/20",
    slate: "from-slate-500/20 to-slate-600/5 border-slate-500/20",
  };
  
  const iconColors = {
    indigo: "text-indigo-400 bg-indigo-500/20",
    emerald: "text-emerald-400 bg-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/20",
    rose: "text-rose-400 bg-rose-500/20",
    slate: "text-slate-400 bg-slate-500/20",
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 transition-all hover:scale-[1.02]",
      colorClasses[color]
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-xl font-black text-white">{value}</p>
          {subtitle && <p className="text-[9px] text-slate-400">{subtitle}</p>}
        </div>
        <div className={cn("p-2 rounded-xl", iconColors[color])}>
          {icon}
        </div>
      </div>
    </div>
  );
};

function ContributionsStatistics({ groupData, selectedGroup, pdfMode = false, selectedSupervisorId, startDate, endDate }: ContributionsStatisticsProps) {
    const [typeClicked, setTypeClicked] = useState("FP")
    const [multiSortConfig, setMultiSortConfig] = useState<Record<string, 'asc' | 'desc' | null>>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [showLegend, setShowLegend] = useState(false);

    const selectedGroupData = useMemo(() => {
      return groupData.find((group) => group.id === selectedGroup) || null;
    }, [groupData, selectedGroup]);

    const processedData = useMemo(() => {
        if (!selectedGroupData || !selectedGroupData.members) return [];

        return selectedGroupData.members
            .filter((member) => {
                if (!selectedSupervisorId) return true;
                return member.supervisorId === selectedSupervisorId;
            }).map((member) => {
                const taxpayers = member.taxpayer || [];
                const filteredTaxpayers = taxpayers.filter(
                    (taxpayer) => !typeClicked || taxpayer.process === typeClicked
                );

                const totalWarnings = filteredTaxpayers.reduce((sum, t) => sum + (t.event?.filter(e => e.type === "WARNING").length ?? 0), 0);
                const totalFines = filteredTaxpayers.reduce((sum, t) => sum + (t.event?.filter(e => e.type === "FINE").length ?? 0), 0);
                const totalCompromises = filteredTaxpayers.reduce((sum, t) => sum + (t.event?.filter(e => e.type === "PAYMENT_COMPROMISE").length ?? 0), 0);
                const totalTaxpayers = filteredTaxpayers.length;

                const totalIVA = filteredTaxpayers.reduce((sum, t) => {
                    return sum + (t.IVAReports?.reduce((s, r) => s + Number(r.paid || 0), 0) || 0);
                }, 0);

                const totalISLR = filteredTaxpayers.reduce((sum, t) => {
                    return sum + (t.ISLRReports?.reduce((s, r) => s + Number(r.paid || 0), 0) || 0);
                }, 0);

                const totalCollectedFines = filteredTaxpayers.reduce((acc, t) => {
                    return acc + (t.event.filter(e => e.type === "FINE").reduce((s, r) => s + Number(r.amount || 0), 0) || 0);
                }, 0);

                return {
                    ...member,
                    totalWarnings,
                    totalFines,
                    totalCompromises,
                    totalTaxpayers,
                    totalCollectedFines,
                    totalISLR,
                    totalIVA: parseFloat(totalIVA.toFixed(2)),
                };
            })
            .filter((member) => member.totalTaxpayers > 0);
    }, [selectedGroupData, typeClicked, selectedSupervisorId]);

    // Filter by search query
    const filteredBySearch = useMemo(() => {
        if (!searchQuery.trim()) return processedData;
        const query = searchQuery.toLowerCase();
        return processedData.filter(member => 
            member.name.toLowerCase().includes(query)
        );
    }, [processedData, searchQuery]);

    // Calculate totals for KPI cards
    const totals = useMemo(() => {
        return filteredBySearch.reduce((acc, member) => ({
            totalTaxpayers: acc.totalTaxpayers + member.totalTaxpayers,
            totalIVA: acc.totalIVA + member.totalIVA,
            totalISLR: acc.totalISLR + member.totalISLR,
            totalFines: acc.totalFines + member.totalFines,
            totalWarnings: acc.totalWarnings + member.totalWarnings,
            totalCompromises: acc.totalCompromises + member.totalCompromises,
            totalCollected: acc.totalCollected + member.totalCollectedFines + member.totalIVA + member.totalISLR,
        }), {
            totalTaxpayers: 0,
            totalIVA: 0,
            totalISLR: 0,
            totalFines: 0,
            totalWarnings: 0,
            totalCompromises: 0,
            totalCollected: 0,
        });
    }, [filteredBySearch]);

    const handleSort = (key: string) => {
        setMultiSortConfig((prev) => {
            const current = prev[key];
            const next: 'asc' | 'desc' | null = current === 'asc' ? 'desc' : current === 'desc' ? null : 'asc';
            return { [key]: next };
        });
    };

    const sortedData = useMemo(() => {
        const sortKey = Object.keys(multiSortConfig).find(k => multiSortConfig[k]);
        if (!sortKey) return filteredBySearch;

        const direction = multiSortConfig[sortKey];
        return [...filteredBySearch].sort((a, b) => {
            const valA = a[sortKey as keyof typeof a] ?? 0;
            const valB = b[sortKey as keyof typeof b] ?? 0;
            
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredBySearch, multiSortConfig]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES', maximumFractionDigits: 0 }).format(amount);
    };

    const procedureTypes = [
        { code: 'FP', label: 'Fiscalización', description: 'Procedimiento de fiscalización' },
        { code: 'AF', label: 'Archivo', description: 'Archivo fiscal' },
        { code: 'VDF', label: 'Verificación', description: 'Verificación de datos' },
    ];

    if (!selectedGroupData) {
        return (
            <div className='flex flex-col items-center justify-center w-full py-20 animate-in fade-in zoom-in duration-500'>
                <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
                  <Layers className="w-10 h-10 text-indigo-500/50" />
                </div>
                <p className='text-base font-bold text-slate-500 uppercase tracking-widest'>Seleccione una coordinación para ver estadísticas</p>
                <p className='text-sm text-slate-600 mt-2'>Elija un grupo del menú superior para comenzar</p>
            </div>
        );
    }

    return (
        <section className='space-y-6 animate-in slide-in-from-bottom-2 duration-500'>
            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
                <div className="space-y-1">
                    <h3 className='text-2xl font-black text-white flex items-center gap-3 flex-wrap'>
                        <Badge className="bg-indigo-600 text-white border-indigo-500 text-sm">{selectedGroupData.members.length}</Badge>
                        Fiscales en {selectedGroupData.name.replace(/GRUPO/gi, 'COORDINACIÓN')}
                    </h3>
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <History className="w-3.5 h-3.5" />
                        {startDate && endDate ? (
                            <span>Desde {new Date(startDate).toLocaleDateString()} hasta {new Date(endDate).toLocaleDateString()}</span>
                        ) : (
                            "Todo el período"
                        )}
                    </div>
                </div>

                <div className='flex flex-wrap items-center gap-3'>
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar fiscal..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all w-48"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    {/* Filter Buttons */}
                    <div className='flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-sm'>
                        {procedureTypes.map((type) => (
                            <button 
                                key={type.code}
                                onClick={() => setTypeClicked(type.code)}
                                className={cn(
                                    "px-5 py-2 text-xs font-bold rounded-xl transition-all duration-300 flex items-center gap-2",
                                    typeClicked === type.code 
                                        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" 
                                        : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                                )}
                            >
                                {typeClicked === type.code && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                {type.code}
                            </button>
                        ))}
                    </div>

                    {/* Legend Toggle */}
                    <button
                        onClick={() => setShowLegend(!showLegend)}
                        className="flex items-center gap-2 px-3 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:border-slate-700 transition-all"
                    >
                        <Info className="w-4 h-4" />
                        <span>Leyenda</span>
                    </button>
                </div>
            </div>

            {/* Legend Panel */}
            {showLegend && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tipos de Procedimiento</p>
                    <div className="flex flex-wrap gap-4">
                        {procedureTypes.map((type) => (
                            <div key={type.code} className="flex items-center gap-2 bg-slate-950/50 px-3 py-2 rounded-xl border border-slate-800">
                                <Badge className={cn(
                                    "text-xs font-bold px-2",
                                    typeClicked === type.code ? "bg-indigo-600" : "bg-slate-700"
                                )}>
                                    {type.code}
                                </Badge>
                                <div>
                                    <p className="text-xs font-bold text-white">{type.label}</p>
                                    <p className="text-[10px] text-slate-500">{type.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <KPICard
                    title="Fiscales"
                    value={sortedData.length}
                    subtitle="Activos"
                    icon={<Users className="w-5 h-5" />}
                    color="indigo"
                />
                <KPICard
                    title="Contribuyentes"
                    value={totals.totalTaxpayers.toLocaleString()}
                    subtitle="Registrados"
                    icon={<UserCircle2 className="w-5 h-5" />}
                    color="slate"
                />
                <KPICard
                    title="Total IVA"
                    value={formatCurrency(totals.totalIVA)}
                    subtitle="Recaudado"
                    icon={<Receipt className="w-5 h-5" />}
                    color="emerald"
                />
                <KPICard
                    title="Total ISLR"
                    value={formatCurrency(totals.totalISLR)}
                    subtitle="Recaudado"
                    icon={<DollarSign className="w-5 h-5" />}
                    color="indigo"
                />
                <KPICard
                    title="Multas"
                    value={totals.totalFines}
                    subtitle="Impuestas"
                    icon={<Scale className="w-5 h-5" />}
                    color="amber"
                />
                <KPICard
                    title="Total Recaudado"
                    value={formatCurrency(totals.totalCollected)}
                    subtitle="General"
                    icon={<TrendingUp className="w-5 h-5" />}
                    color="emerald"
                />
            </div>

            {/* Table Container */}
            <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/20 backdrop-blur-xl">
                <div className="overflow-x-auto custom-scrollbar max-h-[500px]">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-slate-950/80 backdrop-blur-sm shadow-lg">
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 rounded-tl-2xl">
                                    <button onClick={() => handleSort("name")} className="flex items-center gap-2 hover:text-indigo-400 transition-colors">
                                        <UserCircle2 className="w-4 h-4" /> Fiscal <ArrowUpDown className="w-3 h-3 opacity-50" />
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-800">
                                    <div className="flex items-center gap-2"><Scale className="w-4 h-4 text-amber-500" /> Multas</div>
                                </th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-800">
                                    <div className="flex items-center gap-2"><Receipt className="w-4 h-4 text-emerald-500" /> Pagos</div>
                                </th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 text-center">
                                    <div className="flex items-center gap-2 justify-center"><AlertTriangle className="w-4 h-4 text-amber-500" /> Avisos</div>
                                </th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 text-center">
                                    <div className="flex items-center gap-2 justify-center"><FileCheck2 className="w-4 h-4 text-emerald-400" /> Comp.</div>
                                </th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 text-right rounded-tr-2xl">
                                    <button onClick={() => handleSort("totalTaxpayers")} className="flex items-center gap-2 hover:text-indigo-400 transition-colors ml-auto">
                                        <Users className="w-4 h-4" /> Contrib. <ArrowUpDown className="w-3 h-3 opacity-50" />
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {sortedData?.length > 0 ? (
                                sortedData.map((data) => (
                                    <tr key={data.id} className="group hover:bg-slate-800/40 transition-all duration-200 cursor-pointer">
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{data.name}</span>
                                                <span className="text-[10px] text-slate-500 font-mono uppercase italic">{typeClicked} Procedure</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-200">{data.totalFines}</span>
                                                <span className="text-[9px] text-slate-500 uppercase tracking-tighter">Multas Impuestas</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between items-center min-w-[120px]">
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">IVA:</span>
                                                    <span className="text-xs font-mono text-emerald-400 font-bold">{formatCurrency(data.totalIVA)}</span>
                                                </div>
                                                <div className="flex justify-between items-center min-w-[120px]">
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">ISLR:</span>
                                                    <span className="text-xs font-mono text-indigo-400 font-bold">{formatCurrency(data.totalISLR)}</span>
                                                </div>
                                                <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center min-w-[120px]">
                                                    <span className="text-[10px] text-slate-200 font-black">TOTAL:</span>
                                                    <span className="text-xs font-mono text-white font-black">{formatCurrency(data.totalCollectedFines + data.totalIVA + data.totalISLR)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <Badge variant="outline" className={cn(
                                                "text-xs font-bold px-3 py-1",
                                                data.totalWarnings > 0 
                                                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30" 
                                                    : "bg-slate-800/50 text-slate-500 border-slate-700"
                                            )}>
                                                {data.totalWarnings}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <Badge variant="outline" className={cn(
                                                "text-xs font-bold px-3 py-1",
                                                data.totalCompromises > 0 
                                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                                                    : "bg-slate-800/50 text-slate-500 border-slate-700"
                                            )}>
                                                {data.totalCompromises}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <span className="text-sm font-black text-white bg-slate-800 px-3 py-1.5 rounded-lg ring-1 ring-slate-700">
                                                    {data.totalTaxpayers}
                                                </span>
                                                <button className="p-1.5 rounded-lg bg-slate-800/50 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/20 transition-all opacity-0 group-hover:opacity-100">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center">
                                            <Search className="w-12 h-12 text-slate-600 mb-4" />
                                            <p className="text-sm font-bold text-slate-400">No se encontraron fiscales</p>
                                            <p className="text-xs text-slate-600 mt-1">Intenta con otro término de búsqueda</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Insight */}
                <div className="bg-slate-950/60 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-800">
                    <div className="flex items-center gap-4">
                        <p className='text-xs font-bold text-slate-500 uppercase tracking-widest'>
                            Mostrando: <span className="text-indigo-400">{sortedData?.length} fiscales</span> en procedimiento {typeClicked}
                        </p>
                        {searchQuery && (
                            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px]">
                                Filtrado: "{searchQuery}"
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                      <p className='text-[10px] font-black text-slate-600 uppercase italic'>Deslice para ver la tabla completa</p>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ContributionsStatistics
