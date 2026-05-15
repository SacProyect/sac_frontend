import { FiscalInfoExtended } from '@/types/fiscal-stats';
import { FiscalPerformanceData } from '@/types/v2';
import { Card } from '@/components/UI/card';
import { Badge } from '@/components/UI/badge';
import { MapPin, Calendar, Calendar as CalendarIcon, Filter, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/UI/button';
import { cn } from '@/lib/utils';
import { fiscalCarteraYearOptions } from '@/utils/fiscal-cartera-year';

interface FiscalReviewPage1Props {
  fiscalInfo: FiscalInfoExtended;
  performance: FiscalPerformanceData[];
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  fiscalTaxpayers?: any[];
  fiscalMonthlyCollect?: any;
  fiscalComplianceByProcess?: any;
  /** Índice 0–3 para resaltar cada tarjeta en rotación TV (inactividad). */
  tvSpotlightIndex?: number;
}

// Interfaz para el mock de data por ahora
interface AssignedTaxpayer {
  id: string;
  name: string;
  rif: string;
  total: number;
  iva: number;
  islr: number;
  multas: number;
  fase: string;
  location: string;
  date: string;
}

export function FiscalReviewPage1Resumen({ fiscalInfo, performance, selectedYear, setSelectedYear, fiscalTaxpayers, fiscalMonthlyCollect, fiscalComplianceByProcess, tvSpotlightIndex }: FiscalReviewPage1Props) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const getAvailableYears = () => fiscalCarteraYearOptions();

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
  const taxpayersList: any[] = Array.isArray(fiscalTaxpayers) ? fiscalTaxpayers : [];
  const currentMonthName = performance.length > 0 ? performance[performance.length - 1].mes : 'N/A';
  
  // Utilizando datos reales del backend
  const monthsOrder = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  let currentMonthData = { total: 0, iva: 0, islr: 0, fines: 0 };
  let activeMonthName = 'N/A';
  if (fiscalMonthlyCollect) {
    for (let i = monthsOrder.length - 1; i >= 0; i--) {
      const mName = monthsOrder[i];
      const mData = (fiscalMonthlyCollect as any)[mName];
      if (mData && (mData.total > 0 || mData.iva > 0 || mData.islr > 0 || mData.fines > 0)) {
        currentMonthData = mData;
        activeMonthName = mName;
        break;
      }
    }
  }

  const parseNumberObj = (val: any) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val) || 0;
    if (!val || typeof val !== 'object') return 0;
    // Handle specific Decimal formats if they come as objects with 'd' or 'c' arrays
    const numArr = val.d || val.c;
    if (numArr) {
      const sign = val.s || 1;
      let numberString = numArr.join('');
      let num = parseFloat(numberString) * sign;
      // In some Decimal libraries, e is exponent base 10
      if(val.e !== undefined) {
          // If e is large, we might just be reconstructing the number wrong, 
          // usually just joining the digits is enough for display purposes unless e alters magnitude substantially.
          // Let's assume it's just the value * 10^e for decimal places? Actually, let's just use the full string if we can.
      }
      return num;
    }
    return val.total || val.totalAmount || 0;
  };

  const mapMoney = (val: any) => parseNumberObj(val);

  const cobroMensual = {
    total: (currentMonthData as any)?.total || 0,
    iva: (currentMonthData as any)?.iva || 0,
    islr: (currentMonthData as any)?.islr || 0,
    multas: (currentMonthData as any)?.fines || 0
  };

  const expectedVDF = parseNumberObj(fiscalComplianceByProcess?.expectedVDF) || 0;
  const collectedVDF = parseNumberObj(fiscalComplianceByProcess?.collectedVDF) || 0;
  const cumplimiento = expectedVDF > 0 ? (collectedVDF / expectedVDF) * 100 : 0;
  
  const metrics = {
    vdfEsperado: expectedVDF,
    vdfPagado: collectedVDF
  };

  const evolActual = performance.length > 0 ? performance[performance.length - 1].desempeño : 0;
  const evolAnterior = performance.length > 1 ? performance[performance.length - 2].desempeño : 0;
  const evolCambio = evolAnterior === 0 ? 0 : ((evolActual - evolAnterior) / evolAnterior) * 100;
  const evolCambioStr = evolCambio > 0 ? `+${evolCambio.toFixed(1)}%` : `${evolCambio.toFixed(1)}%`;
  const isPositive = evolCambio >= 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(val).replace('VES', 'Bs.S');
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className='flex flex-col sm:flex-row items-center justify-between gap-4 py-2 animate-in fade-in duration-300'>
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <Filter className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">Período</span>
              </div>
              
              <div className='relative z-50'>
                  <Button
                      variant="outline"
                      onClick={() => setCalendarOpen(!calendarOpen)}
                      className="bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl h-10 gap-3 min-w-[120px]"
                  >
                      <CalendarIcon className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-semibold">
                          Año {selectedYear}
                      </span>
                      <ChevronDown className={cn("w-4 h-4 opacity-50 transition-transform ml-auto", calendarOpen && "rotate-180")} />
                  </Button>

                  {calendarOpen && (
                      <div ref={calendarRef} className='absolute top-full mt-2 right-0 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200'>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Seleccionar Año</p>
                          <div className='space-y-2'>
                              {getAvailableYears().map(year => (
                                  <button 
                                      key={year}
                                      onClick={() => {
                                          setSelectedYear(year);
                                          setCalendarOpen(false);
                                      }}
                                      className={cn(
                                          'w-full text-left px-4 py-2 text-sm font-medium rounded-xl transition-all',
                                          selectedYear === year 
                                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                                              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                      )}
                                  >
                                      {year}
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in duration-300">
      {/* Contribuyentes Asignados */}
      <Card
        className={cn(
          'bg-slate-800 border-slate-700 overflow-hidden flex flex-col h-[400px] shadow-sm transition-all duration-700',
          tvSpotlightIndex === 0 && 'ring-2 ring-blue-400/90 shadow-xl shadow-blue-500/25 z-[1] scale-[1.01]'
        )}
      >
        <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2 bg-slate-800/80">
          <span className="text-blue-400">🏢</span>
          <h3 className="font-semibold text-white text-sm">Contribuyentes Asignados</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {taxpayersList.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm italic">
              Sin detalles de contribuyentes para este período.
            </div>
          ) : (
            taxpayersList.map((t, idx) => (
              <div key={t.id || idx} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50 flex flex-col gap-3 transition-colors hover:bg-slate-700/80">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-xs sm:text-sm">{t.name || t.nombre}</h4>
                      <p className="text-slate-400 text-[10px] mt-0.5">{t.rif}</p>
                      <Badge variant="destructive" className="bg-red-900/50 text-red-400 border-none px-1.5 py-0 text-[9px] mt-1.5">
                        {t.fase || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold text-sm tracking-tight">{formatCurrency(mapMoney(t.totalCollected ?? t.total ?? 0))}</p>
                    <p className="text-slate-500 text-[10px] text-right uppercase tracking-wider mt-0.5">Total</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 bg-slate-900/40 rounded-md p-2 border border-slate-700/50">
                  <div className="px-1">
                    <p className="text-slate-500 text-[9px] uppercase tracking-wider mb-0.5">IVA</p>
                    <p className="text-slate-200 text-xs font-medium tracking-tight">{formatCurrency(mapMoney(t.collectedIva ?? t.iva ?? 0))}</p>
                  </div>
                  <div className="px-1 border-l border-slate-700/50">
                    <p className="text-slate-500 text-[9px] uppercase tracking-wider mb-0.5">ISLR</p>
                    <p className="text-slate-200 text-xs font-medium tracking-tight">{formatCurrency(mapMoney(t.collectedIslr ?? t.islr ?? 0))}</p>
                  </div>
                  <div className="px-1 border-l border-slate-700/50">
                    <p className="text-slate-500 text-[9px] uppercase tracking-wider mb-0.5">Multas</p>
                    <p className="text-orange-400 text-xs font-medium tracking-tight">{formatCurrency(mapMoney(t.collectedFines ?? t.multas ?? 0))}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-400 text-[10px] pt-1 border-t border-slate-700/30">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-500" /> {t.address || t.location || 'N/A'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-500" /> {t.emition_date ? new Date(t.emition_date).toLocaleDateString('es-VE') : (t.date || 'N/A')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Cobro Mensual */}
      <Card
        className={cn(
          'bg-slate-800 border-slate-700 flex flex-col h-[400px] shadow-sm transition-all duration-700',
          tvSpotlightIndex === 1 && 'ring-2 ring-blue-400/90 shadow-xl shadow-blue-500/25 z-[1] scale-[1.01]'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2 bg-slate-800/80">
            <span className="text-green-400 font-bold">$</span>
            <h3 className="font-semibold text-white text-sm">Cobro Mensual</h3>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-slate-400 text-xs mb-1">Mes actual</p>
                <h2 className="text-xl text-blue-400 font-medium capitalize">{activeMonthName !== 'N/A' ? activeMonthName : currentMonthName}</h2>
              </div>
              <div className="text-right">
                <p className="text-2xl text-green-400 font-bold tracking-tight">{formatCurrency(cobroMensual.total)}</p>
                <p className="text-slate-500 text-[10px] uppercase tracking-wider mt-1">Total Pagado</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-900/10 border border-blue-800/40 rounded-lg py-3 px-2 text-center transition-colors hover:bg-blue-900/20">
                <p className="text-blue-400/80 text-[10px] uppercase tracking-wider mb-1">IVA</p>
                <p className="text-blue-200 text-sm font-medium tracking-tight">{formatCurrency(cobroMensual.iva)}</p>
              </div>
              <div className="bg-purple-900/10 border border-purple-800/40 rounded-lg py-3 px-2 text-center transition-colors hover:bg-purple-900/20">
                <p className="text-purple-400/80 text-[10px] uppercase tracking-wider mb-1">ISLR</p>
                <p className="text-purple-200 text-sm font-medium tracking-tight">{formatCurrency(cobroMensual.islr)}</p>
              </div>
              <div className="bg-orange-900/10 border border-orange-800/40 rounded-lg py-3 px-2 text-center transition-colors hover:bg-orange-900/20">
                <p className="text-orange-400/80 text-[10px] uppercase tracking-wider mb-1">Multas</p>
                <p className="text-orange-200 text-sm font-medium tracking-tight">{formatCurrency(cobroMensual.multas)}</p>
              </div>
            </div>

            <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-900 shadow-inner">
              {cobroMensual.total > 0 ? (
                <>
                  <div className="bg-blue-500/90 h-full transition-all duration-1000 ease-in-out" style={{ width: `${(cobroMensual.iva/cobroMensual.total)*100}%` }} title={`IVA: ${formatCurrency(cobroMensual.iva)}`} />
                  <div className="bg-purple-500/90 h-full transition-all duration-1000 ease-in-out" style={{ width: `${(cobroMensual.islr/cobroMensual.total)*100}%` }} title={`ISLR: ${formatCurrency(cobroMensual.islr)}`} />
                  <div className="bg-orange-500/90 h-full transition-all duration-1000 ease-in-out" style={{ width: `${(cobroMensual.multas/cobroMensual.total)*100}%` }} title={`Multas: ${formatCurrency(cobroMensual.multas)}`} />
                </>
              ) : (
                <div className="bg-slate-700 w-full h-full" title="No hay datos" />
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Evolución Mensual del Rendimiento */}
      <Card
        className={cn(
          'bg-slate-800 border-slate-700 flex flex-col h-[400px] shadow-sm transition-all duration-700',
          tvSpotlightIndex === 2 && 'ring-2 ring-blue-400/90 shadow-xl shadow-blue-500/25 z-[1] scale-[1.01]'
        )}
      >
        <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2 bg-slate-800/80">
          <span className="text-purple-400 text-sm">📄</span>
          <h3 className="font-semibold text-white text-sm">Evolución Mensual del Rendimiento</h3>
        </div>
        <div className="p-5 flex-1 flex flex-col justify-center overflow-hidden">
          <div className="bg-slate-800/50 border border-green-500/20 rounded-lg p-5 transition-colors hover:bg-slate-800/80">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-2.5">
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-sm ring-1", isPositive ? "bg-green-500/10 text-green-400 ring-green-500/30" : "bg-red-500/10 text-red-400 ring-red-500/30")}>
                  {isPositive ? '↑' : '↓'}
                </div>
                <span className="text-white font-medium capitalize">{currentMonthName}</span>
              </div>
              <div className="text-right">
                <p className={cn("font-bold tracking-tight px-2 py-0.5 rounded-md inline-block", isPositive ? "text-green-400 bg-green-900/20" : "text-red-400 bg-red-900/20")}>
                  {evolCambioStr}
                </p>
                <p className="text-slate-500 text-[9px] uppercase tracking-wider mt-1">Cambio</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="border-r border-slate-700/50 pr-4">
                <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1.5">Anterior</p>
                <p className="text-slate-300 font-medium text-sm tracking-tight">{formatCurrency(evolAnterior)}</p>
              </div>
              <div className="pl-2">
                <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1.5">Actual</p>
                <p className={cn("font-medium text-sm tracking-tight", isPositive ? "text-green-400" : "text-red-400")}>{formatCurrency(evolActual)}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* % Cumplimiento por Procedimiento */}
      <Card
        className={cn(
          'bg-slate-800 border-slate-700 flex flex-col h-[400px] shadow-sm transition-all duration-700',
          tvSpotlightIndex === 3 && 'ring-2 ring-blue-400/90 shadow-xl shadow-blue-500/25 z-[1] scale-[1.01]'
        )}
      >
        <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2 bg-slate-800/80">
          <span className="text-yellow-400 text-sm">⏱</span>
          <h3 className="font-semibold text-white text-sm">% Cumplimiento por Procedimiento</h3>
        </div>
        <div className="p-5 flex-1 flex flex-col justify-center overflow-hidden">
          <div className="bg-slate-800/50 border border-green-500/30 rounded-lg p-5 relative overflow-hidden transition-colors hover:bg-slate-800/80">
            <div className="flex justify-between items-start mb-5 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center text-xs font-bold ring-1 ring-green-500/30">
                  VDF
                </div>
                <div>
                  <h4 className="text-white font-medium text-sm">Verificación de Deberes Formales</h4>
                  <p className="text-slate-400 text-[10px] mt-0.5">Validación de información tributaria</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-green-400 font-bold text-xl tracking-tight">{cumplimiento}%</p>
                <p className="text-slate-500 text-[9px] uppercase tracking-wider mt-1">Cumplimiento</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4 relative z-10 border-t border-slate-700/50 pt-3">
              <div className="border-r border-slate-700/50 pr-4">
                <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Esperado</p>
                <p className="text-blue-400/90 font-medium text-sm tracking-tight">{formatCurrency(metrics.vdfEsperado)}</p>
              </div>
              <div className="pl-2">
                <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Pagado</p>
                <p className="text-green-400 font-medium text-sm tracking-tight">{formatCurrency(metrics.vdfPagado)}</p>
              </div>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-900 relative z-10 shadow-inner">
              <div className="bg-green-500/90 h-full rounded-full transition-all duration-1000 ease-in-out" style={{ width: `${Math.min(cumplimiento, 100)}%` }} />
            </div>
          </div>
        </div>
      </Card>
    </div>
    </div>
  );
}
