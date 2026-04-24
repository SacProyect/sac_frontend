import { useAuth } from '@/hooks/use-auth';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Users, 
  ChevronRight, 
  Filter, 
  UserCircle2, 
  TrendingUp, 
  CheckCircle2, 
  ShieldAlert,
  Search,
  ChevronDown,
  Building2,
  Wallet,
  Percent,
  Banknote
} from "lucide-react";
import { GroupData } from './contribution-types';
import { cn } from "@/lib/utils";
import { Badge } from '@/components/UI/badge';
import { Button } from '@/components/UI/button';
import { Card } from '@/components/UI/card';

interface ContributionsFilterProps {
    groupData: GroupData[];
    setStartDate: (startDate: string) => void;
    setEndDate: (endDate: string) => void;
    setSelectedGroup: (groupId: string) => void;
    setSelectedSupervisorId: (supervisorId: string | null) => void;
    /** Llamado tras elegir vista completa de una coordinación (p. ej. scroll a la sección de estadísticas). */
    onViewFullCoordination?: () => void;
}

function ContributionsFilter({
    groupData,
    setStartDate,
    setEndDate,
    setSelectedGroup,
    setSelectedSupervisorId,
    onViewFullCoordination,
}: ContributionsFilterProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [optionClicked, setOptionClicked] = useState("Year");
    const [selectedYear, setSelectedYear] = useState(2026);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const [selectedSupervisors, setSelectedSupervisors] = useState<Record<string, string | null>>({});
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const calendarRef = useRef<HTMLDivElement>(null);
    const startYear = new Date().getFullYear();
    const startMonth = 0;

    // ── Decimal.js converter ─────────────────────────────────────────────────
    // El backend devuelve montos en formato { s, e, d[] }. Formula:
    // value = s * d_concatenated * 10^(e - d_concatenated.length + 1)
    const decimalToNumber = (val: unknown): number => {
        if (val === null || val === undefined) return 0;
        if (typeof val === 'number') return val;
        if (typeof val === 'string') return parseFloat(val) || 0;
        if (
            typeof val === 'object' && val !== null &&
            's' in val && 'e' in val && 'd' in val
        ) {
            const d = val as { s: number; e: number; d: number[] };
            if (!Array.isArray(d.d) || d.d.length === 0) return 0;
            let str = d.d[0].toString();
            for (let i = 1; i < d.d.length; i++) {
                str += d.d[i].toString().padStart(7, '0');
            }
            const exp = d.e - str.length + 1;
            return d.s * parseFloat(str) * Math.pow(10, exp);
        }
        return 0;
    };

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        if (optionClicked === "Year" && selectedYear) {
            setStartDate(`${selectedYear}-01-01`);
            setEndDate(`${selectedYear}-12-31`);
        }

        if (optionClicked === "Month" && selectedYear && selectedMonth !== null) {
            const start = new Date(selectedYear, selectedMonth, 1);
            const end = new Date(selectedYear, selectedMonth + 1, 0);
            const formatDate = (d: Date) => d.toISOString().split("T")[0];
            setStartDate(formatDate(start));
            setEndDate(formatDate(end));
        }

        if (optionClicked === "Month" && selectedMonth === null) {
            setStartDate("");
            setEndDate("");
        }
    }, [selectedYear, selectedMonth, optionClicked, user, navigate, setStartDate, setEndDate]);

    const getAvailableYears = () => [startYear - 2, startYear - 1, startYear];
    const getAvailableMonths = (year: number) => {
        const allMonths = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const from = year === startYear ? startMonth : 0;
        return allMonths.map((name, index) => ({ name, index })).slice(from);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setCalendarOpen(false);
            }
        };
        if (calendarOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [calendarOpen]);

    const formatCurrency = (amount: unknown) => {
        const num = decimalToNumber(amount);
        return new Intl.NumberFormat('es-VE', {
            style: 'currency',
            currency: 'VES',
            maximumFractionDigits: 0
        }).format(num);
    };

    const toggleGroupExpand = (groupId: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    return (
        <section className='w-full space-y-6'>
            {/* Filter Bar - Improved */}
            <div className='flex flex-col sm:flex-row items-center justify-between gap-4 py-2'>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-indigo-400">
                      <Filter className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-[0.2em]">Período</span>
                    </div>
                    
                    <div className='relative'>
                        <Button
                            variant="outline"
                            onClick={() => setCalendarOpen(!calendarOpen)}
                            className="bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl h-10 gap-3 min-w-[180px]"
                        >
                            <CalendarIcon className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-semibold">
                                {optionClicked === "Year" ? `Año ${selectedYear}` : `Mes ${selectedMonth !== null ? getAvailableMonths(selectedYear)[selectedMonth].name : '...'} ${selectedYear}`}
                            </span>
                            <ChevronDown className={cn("w-4 h-4 opacity-50 transition-transform ml-auto", calendarOpen && "rotate-180")} />
                        </Button>

                        {calendarOpen && (
                            <div ref={calendarRef} className='absolute top-full mt-2 left-0 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 z-50 animate-in fade-in zoom-in-95 duration-200'>
                                <div className='flex bg-slate-950/50 p-1 rounded-xl mb-4'>
                                    <button 
                                        className={cn(
                                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                                            optionClicked === "Month" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-500 hover:text-slate-300"
                                        )} 
                                        onClick={() => setOptionClicked("Month")}
                                    >
                                        Por Mes
                                    </button>
                                    <button 
                                        className={cn(
                                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                                            optionClicked === "Year" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-500 hover:text-slate-300"
                                        )} 
                                        onClick={() => {
                                            setOptionClicked("Year");
                                            setSelectedMonth(null);
                                        }}
                                    >
                                        Por Año
                                    </button>
                                </div>
                                <div className='space-y-3'>
                                    {optionClicked === "Month" && (
                                        <select 
                                            className='w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none' 
                                            value={selectedMonth ?? ""} 
                                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                        >
                                            <option value="" disabled className="bg-slate-900">Selecciona un mes</option>
                                            {getAvailableMonths(selectedYear).map(({ name, index }) => (
                                                <option key={index} value={index} className="bg-slate-900">{name}</option>
                                            ))}
                                        </select>
                                    )}
                                    <select 
                                        className='w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none' 
                                        value={selectedYear} 
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    >
                                        {getAvailableYears().map(year => (
                                            <option key={year} value={year} className="bg-slate-900">{year}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Datos en tiempo real</span>
                </div>
            </div>

            {/* Coordination Grid - Improved */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4'>
                {groupData.map(group => {
                    const selectedId = selectedSupervisors[group.id] ?? null;
                    const stats = selectedId
                        ? group.supervisorsStats.find(s => s.supervisorId === selectedId)
                        : null;

                    const collected = stats?.totalCollected ?? group.collected;
                    const fines = stats?.totalFines ?? group.totalFines;
                    const iva = stats?.collectedIva ?? group.totalIva;
                    const islr = stats?.collectedISLR ?? group.totalIslr;
                    const collectedFines = stats?.collectedFines ?? group.collectedFines;

                    const selectedIndex = selectedId
                        ? group.supervisorsStats.findIndex(s => s.supervisorId === selectedId)
                        : -1;

                    const isExpanded = expandedGroups[group.id] ?? false;

                    return (
                        <Card 
                            key={group.id} 
                            className={cn(
                                "group bg-slate-900/40 border-slate-800/50 backdrop-blur-md rounded-2xl overflow-hidden transition-all duration-300 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5",
                                selectedId ? "border-indigo-500/40 shadow-lg shadow-indigo-500/10" : ""
                            )}
                        >
                            <div className='p-5 space-y-4'>
                                {/* Header */}
                                <div className='flex justify-between items-start'>
                                    <div className="space-y-1">
                                        <h4 className='text-sm font-black text-white flex items-center gap-2 uppercase tracking-tight'>
                                            <Building2 className="w-4 h-4 text-indigo-400" />
                                            {group.name.replace(/GRUPO/gi, 'COORDINACIÓN')}
                                        </h4>
                                        <Badge variant="outline" className="text-[9px] bg-slate-950/50 border-slate-800 text-slate-400 py-0.5 px-2 h-5">
                                            {selectedIndex >= 0 ? `Supervisor ${selectedIndex + 1}` : "Vista Completa"}
                                        </Badge>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-400 text-sm font-bold ring-1 ring-indigo-500/30">
                                        {group.id.split('_')[1] || 'G'}
                                    </div>
                                </div>

                                {/* Metrics Summary - Improved */}
                                <div className="grid grid-cols-2 gap-3 pb-3">
                                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 group-hover:border-indigo-500/10 transition-colors">
                                        <div className="flex items-center gap-2 mb-1">
                                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Multas</p>
                                        </div>
                                        <p className="text-lg font-black text-slate-200">{decimalToNumber(fines).toLocaleString('es-VE', { maximumFractionDigits: 0 })}</p>
                                    </div>
                                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 group-hover:border-emerald-500/10 transition-colors">
                                        <div className="flex items-center gap-2 mb-1">
                                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Recaudado</p>
                                        </div>
                                        <p className="text-lg font-black text-slate-200">{decimalToNumber(collectedFines).toLocaleString('es-VE', { maximumFractionDigits: 0 })}</p>
                                    </div>
                                </div>

                                {/* IVA/ISLR Summary - Improved */}
                                <div className="grid grid-cols-2 gap-3 pb-3">
                                    <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/10">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Percent className="w-3.5 h-3.5 text-emerald-400" />
                                            <p className="text-[9px] font-bold text-emerald-400/70 uppercase tracking-wider">IVA</p>
                                        </div>
                                        <p className="text-sm font-bold text-emerald-400">{formatCurrency(iva)}</p>
                                    </div>
                                    <div className="bg-indigo-950/20 p-3 rounded-xl border border-indigo-500/10">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Banknote className="w-3.5 h-3.5 text-indigo-400" />
                                            <p className="text-[9px] font-bold text-indigo-400/70 uppercase tracking-wider">ISLR</p>
                                        </div>
                                        <p className="text-sm font-bold text-indigo-400">{formatCurrency(islr)}</p>
                                    </div>
                                </div>

                                {/* Supervisor Selection */}
                                <div className='space-y-2'>
                                    {/* Expand/Collapse Toggle */}
                                    {group.supervisorsStats.length > 0 && (
                                        <button
                                            onClick={() => toggleGroupExpand(group.id)}
                                            className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold rounded-xl transition-all border bg-slate-950/30 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"
                                        >
                                            <span className="flex items-center gap-2">
                                                <Users className="w-3 h-3" />
                                                {group.supervisorsStats.length} Supervisor{group.supervisorsStats.length > 1 ? 'es' : ''}
                                            </span>
                                            <ChevronRight className={cn("w-3 h-3 transition-transform", isExpanded && "rotate-90")} />
                                        </button>
                                    )}
                                    
                                    {/* Supervisor List */}
                                    {(isExpanded || group.supervisorsStats.length === 0) && (
                                        <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                                            {group.supervisorsStats.map((supervisorStat, index) => {
                                                const getDisplayName = (name: string, groupName: string) => {
                                                    const normalizedGroupName = groupName.replace(/GRUPO/gi, 'COORDINACIÓN');
                                                    if (normalizedGroupName === 'COORDINACIÓN 1' && name === 'Alieska Yepez') {
                                                        return 'Estefany Rincon';
                                                    }
                                                    return name;
                                                };
                                                
                                                const isActive = selectedId === supervisorStat.supervisorId;

                                                return (
                                                    <button
                                                        key={supervisorStat.supervisorId}
                                                        onClick={() => {
                                                            setSelectedSupervisors(prev => ({ ...prev, [group.id]: supervisorStat.supervisorId }));
                                                            setSelectedGroup(group.id);
                                                            setSelectedSupervisorId(supervisorStat.supervisorId);
                                                        }}
                                                        className={cn(
                                                            'w-full flex items-center justify-between px-4 py-3 text-xs font-bold rounded-xl transition-all border supervisor-btn',
                                                            isActive 
                                                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                                                                : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                                        )}
                                                    >
                                                        <span className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                                                                isActive ? "bg-white/20" : "bg-slate-800"
                                                            )}>
                                                                {index + 1}
                                                            </div>
                                                            <UserCircle2 className={cn("w-4 h-4 transition-colors", isActive ? "text-indigo-200" : "text-slate-600 hover:text-indigo-400")} />
                                                            <span className="truncate">{getDisplayName(supervisorStat.supervisorName, group.name)}</span>
                                                        </span>
                                                        <ChevronRight className={cn("w-4 h-4 transition-all", isActive ? "opacity-100" : "opacity-0 hover:opacity-50 hover:translate-x-1")} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                    
                                    {/* View Complete Button */}
                                    <button
                                        onClick={() => {
                                            setSelectedSupervisors(prev => ({ ...prev, [group.id]: null }));
                                            setSelectedGroup(group.id);
                                            setSelectedSupervisorId(null);
                                            if (onViewFullCoordination) {
                                                requestAnimationFrame(() => {
                                                    onViewFullCoordination();
                                                });
                                            }
                                        }}
                                        className={cn(
                                            'w-full py-3 px-4 text-xs font-bold rounded-xl transition-all border flex items-center gap-3 justify-center',
                                            !selectedId 
                                                ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20' 
                                                : 'bg-slate-950/20 border-slate-800/40 text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                                        )}
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Ver Coordinación Completa
                                    </button>
                                </div>

                                {/* Expanded Stats Footer - Improved */}
                                <div className='pt-4 mt-2 border-t border-slate-800/50'>
                                    <div className="flex justify-between items-center bg-slate-950/50 -mx-2 px-3 py-2 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <Wallet className="w-4 h-4 text-emerald-400" />
                                            <p className="text-xs font-black text-emerald-400/70 uppercase tracking-wider">Cob. Total</p>
                                        </div>
                                        <p className="text-base font-mono font-black text-white">{formatCurrency(collected)}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </section>
    );
}

export default ContributionsFilter;
