import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLoaderData, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'react-router-dom';
import { Card } from '@/components/UI/card';
import { Button } from '@/components/UI/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/UI/tabs';
import { Badge } from '@/components/UI/badge';
import { 
  Bell, 
  AlertTriangle, 
  DollarSign, 
  FileText, 
  Package,
  Receipt,
  FileSearch,
  BarChart3,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import { IndividualStats, type TaxpayerSummaryStrip } from '@/components/stats/individual-stats';
import { useMediaQuery } from '@/hooks/use-media-query';
import toast from 'react-hot-toast';
import EventTable from '@/components/Events/event-table';
import TaxSummaryTable from '@/components/iva/tax-summary-table';
import ISLRSummaryTable from '@/components/ISLR/islr-summary-table';
import { Event } from '@/types/event';
import { IVAReports } from '@/types/iva-reports';
import { ISLRReports } from '@/types/islr-reports';
import { Fines } from '@/pages/router';
import { Payment } from '@/types/payment';
import { PageHeader, EmptyState } from '@/components/UI/v2';
import { deleteTaxpayer, getTaxpayerCases } from '@/components/utils/api/taxpayer-functions';
import { TaxCase } from '@/types/tax-case';
import CaseSelector from '@/components/taxpayer/case-selector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/UI/dialog';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

/**
 * TaxpayerDetailV2 - Detalle del Contribuyente con diseño Shadcn UI v2.0
 * 
 * Muestra:
 * - Estadísticas individuales del contribuyente
 * - Botones de acción rápida (con permisos)
 * - Tabs para historial (Multas, IVA, ISLR)
 */
export default function TaxpayerDetailV2() {
  const { taxpayer } = useParams<{ taxpayer: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    events: initialEvents, 
    fines, 
    payments, 
    taxSummary: initialTaxSummary, 
    islrReports: initialIslrReports,
    taxpayerData
    , observations
  } = useLoaderData() as { 
    events: Event[]; 
    fines: Fines; 
    payments: Payment; 
    taxSummary: IVAReports[]; 
    islrReports: ISLRReports[];
    taxpayerData: any;
    observations: any[];
  };

  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [taxSummary, setTaxSummary] = useState<IVAReports[]>(initialTaxSummary);
  const [islrReports, setIslrReports] = useState<ISLRReports[]>(initialIslrReports);
  const [activeTab, setActiveTab] = useState('fine');
  const [cases, setCases] = useState<TaxCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showPerformanceChart, setShowPerformanceChart] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter events by selected case (legacy events without tax_case_id always show)
  const filteredEvents = useMemo(() => {
    if (!selectedCaseId) return events;
    return events.filter(e => e.tax_case_id === selectedCaseId || !e.tax_case_id);
  }, [events, selectedCaseId]);

  const handleDeleteTaxpayer = useCallback(async () => {
    if (!taxpayer) return;
    setIsDeleting(true);
    try {
      await deleteTaxpayer(taxpayer);
      toast.success('Contribuyente eliminado correctamente');
      navigate('/admin', { replace: true });
    } catch {
      toast.error('Error al eliminar el contribuyente');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [taxpayer, navigate]);

  // Load cases for this taxpayer
  useEffect(() => {
    if (taxpayer) {
      getTaxpayerCases(taxpayer).then((data) => {
        setCases(data);
        // Select the most recent case by default
        if (data.length > 0) {
          setSelectedCaseId(data[0].id);
        }
      });
    }
  }, [taxpayer]);

  // Compute label for selected case
  const selectedCaseLabel = useMemo(() => {
    if (!selectedCaseId) return null;
    const c = cases.find(c => c.id === selectedCaseId);
    return c ? `${c.year} — ${c.process} (${c.fase})` : null;
  }, [cases, selectedCaseId]);

  // Media query para gráficos responsivos
  const isSmUp = useMediaQuery('(min-width: 640px)');

  // Colores para gráficos de torta
  const IVA_PIE_COLORS = {
    compras: '#38bdf8',
    ventas: '#34d399',
  };

  const EVENT_PIE_COLORS: Record<string, string> = {
    'Avisos': '#60a5fa',
    'Multas': '#f87171',
    'Compromisos': '#fbbf24',
  };

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isMyTaxpayer = user?.taxpayer?.some(t => t.id === taxpayer) || taxpayerData?.user?.id === user?.id;
  const canSeeAllOptions = user.role === "ADMIN" || isMyTaxpayer;
  const isHighRole = user.role === 'ADMIN' || user.role === 'COORDINATOR' || user.role === 'SUPERVISOR';
  const isAssignedFiscal =
    user.role === 'FISCAL' &&
    (taxpayerData?.officerId === user.id || taxpayerData?.user?.id === user.id || isMyTaxpayer);
  type QuickAction = {
    name: string;
    title: string;
    icon: typeof Bell;
    color: string;
    path?: string;
    onClick?: () => void;
  };

  const quickActions: QuickAction[] = [
    {
      name: 'Aviso',
      title: 'Registrar un aviso asociado a este expediente',
      path: `/warning/${taxpayer}?case=${selectedCaseId || ''}`,
      icon: Bell,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'Multa',
      title: 'Registrar una multa o sanción',
      path: `/fine/${taxpayer}?case=${selectedCaseId || ''}`,
      icon: AlertTriangle,
      color: 'bg-red-600 hover:bg-red-700',
    },
    {
      name: 'Pago',
      title: 'Registrar un pago recibido',
      path: `/payment/${taxpayer}?case=${selectedCaseId || ''}`,
      icon: DollarSign,
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      name: 'Compromiso de pago',
      title: 'Registrar un compromiso de pago',
      path: `/payment_compromise/${taxpayer}?case=${selectedCaseId || ''}`,
      icon: FileText,
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      name: 'Gráficos',
      title: 'Ver tortas de IVA y distribución de eventos',
      icon: BarChart3,
      color: 'bg-amber-600 hover:bg-amber-700',
      onClick: () => setShowPerformanceChart(true),
    },
  ].filter((opt) => canSeeAllOptions || opt.name === 'Observaciones' || opt.name === 'Gráficos');

  /** Totales acumulados de IVA para gráfico de torta (compras vs ventas). */
  const ivaTotals = useMemo(() => {
    if (!taxSummary?.length) return { compras: 0, ventas: 0 };
    let totalCompras = 0;
    let totalVentas = 0;
    taxSummary.forEach((report) => {
      totalCompras += Number(report.purchases) || 0;
      totalVentas += Number(report.sells) || 0;
    });
    return { compras: totalCompras, ventas: totalVentas };
  }, [taxSummary]);

  const ivaPieData = useMemo(() => {
    const { compras: totalCompras, ventas: totalVentas } = ivaTotals;
    const slices: { name: string; value: number; fill: string }[] = [];
    if (totalCompras > 0) {
      slices.push({ name: 'Compras', value: totalCompras, fill: IVA_PIE_COLORS.compras });
    }
    if (totalVentas > 0) {
      slices.push({ name: 'Ventas', value: totalVentas, fill: IVA_PIE_COLORS.ventas });
    }
    return slices;
  }, [ivaTotals]);

  const eventPieData = useMemo(() => {
    if (!filteredEvents?.length) return [];

    const totalsByType: Record<string, { label: string; cantidad: number; monto: number }> = {
      WARNING: { label: 'Avisos', cantidad: 0, monto: 0 },
      FINE: { label: 'Multas', cantidad: 0, monto: 0 },
      PAYMENT_COMPROMISE: { label: 'Compromisos', cantidad: 0, monto: 0 },
    };

    filteredEvents.forEach((event) => {
      const key = String(event.type) as keyof typeof totalsByType;
      if (!totalsByType[key]) return;

      totalsByType[key].cantidad += 1;
      totalsByType[key].monto += Number(event.amount) || 0;
    });

    return Object.values(totalsByType)
      .filter((item) => item.cantidad > 0)
      .map((item) => ({
        name: item.label,
        value: item.cantidad,
        fill: EVENT_PIE_COLORS[item.label] ?? '#f59e0b',
      }));
  }, [filteredEvents]);

  const currencyFormatter = (value: number) =>
    new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <PageHeader
        title="Detalle del Contribuyente"
        description="Información completa y gestión de eventos"
        backTo="/census"
      />

      <IndividualStats
        events={filteredEvents}
        IVAReports={taxSummary}
        taxpayerData={taxpayerData}
        observations={observations}
        selectedCaseId={selectedCaseId}
        selectedCaseLabel={selectedCaseLabel}
      />

      {/* Case Detail Card — muestra info del caso seleccionado */}
      {selectedCaseId && cases.length > 0 && taxpayerData && (
        <Card className="bg-slate-800 border-slate-700 p-4 sm:p-5 transition-all duration-200 hover:border-slate-600 hover:shadow-md rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Detalle del Caso
            </span>
            {(() => {
              const selectedCase = cases.find(c => c.id === selectedCaseId);
              if (!selectedCase) return null;
              return (
                <Badge className="bg-indigo-900/30 text-indigo-300 border border-indigo-800/30 text-[11px] font-bold">
                  {selectedCase.year} — {selectedCase.process}
                </Badge>
              );
            })()}
          </div>

          {(() => {
            const selectedCase = cases.find(c => c.id === selectedCaseId);
            if (!selectedCase) return null;

            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Procedimiento</span>
                  <span className="text-sm font-medium text-slate-200">{selectedCase.process || '—'}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fase</span>
                  <span className="text-sm font-medium">
                    {selectedCase.fase ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-blue-900/20 text-blue-400">
                        {selectedCase.fase.replace('_', ' ')}
                      </span>
                    ) : '—'}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">N° Providencia</span>
                  <span className="text-sm font-medium text-slate-200">{taxpayerData.providenceNum ?? '—'}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fiscal Asignado</span>
                  <span className="text-sm font-medium text-slate-200">{taxpayerData.user?.name ?? 'No asignado'}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Supervisor</span>
                  <span className="text-sm font-medium text-slate-200">{taxpayerData.user?.supervisor?.name ?? 'No asignado'}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Grupo</span>
                  <span className="text-sm font-medium text-slate-200">{taxpayerData.user?.group?.name ?? 'No asignado'}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fecha de Emisión</span>
                  <span className="text-sm font-medium text-slate-200">
                    {selectedCase.emition_date
                      ? new Date(selectedCase.emition_date).toLocaleDateString('es-VE', { year: 'numeric', month: 'short', day: 'numeric' })
                      : '—'}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Estado</span>
                  <span className="text-sm font-medium flex items-center gap-2">
                    {selectedCase.notified ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-emerald-900/20 text-emerald-400">
                        Notificado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-red-900/20 text-red-400">
                        Pendiente
                      </span>
                    )}
                    {selectedCase.culminated && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-emerald-900/20 text-emerald-400">
                        Culminado
                      </span>
                    )}
                  </span>
                </div>
              </div>
            );
          })()}
        </Card>
      )}

      <Card className="bg-slate-800 border-slate-700 p-4 sm:p-6 transition-all duration-200 hover:border-slate-600 hover:shadow-md rounded-lg">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Acciones Rápidas</h3>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            if (action.path) {
              return (
                <Link key={action.name} to={action.path} className="w-full sm:w-auto min-w-0">
                  <Button className={`w-full sm:w-auto ${action.color} text-white font-semibold rounded-md flex items-center justify-center gap-2 transition-all duration-200 shadow-sm min-h-[44px]`}>
                    <Icon className="h-4 w-4 shrink-0" />
                    {action.name}
                  </Button>
                </Link>
              );
            }

            return (
              <Button
                key={action.name}
                type="button"
                onClick={action.onClick}
                className={`w-full sm:w-auto ${action.color} text-white font-semibold rounded-md flex items-center justify-center gap-2 transition-all duration-200 shadow-sm min-h-[44px]`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {action.name}
              </Button>
            );
          })}
        </div>

        {/* Zona de peligro — solo ADMIN */}
        {user.role === 'ADMIN' && (
          <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-rose-400">Zona de administración</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Eliminar el expediente de forma permanente. Esta acción no se puede deshacer.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="shrink-0 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 hover:border-rose-500/50 text-rose-400 hover:text-rose-300 font-semibold rounded-md flex items-center gap-2 transition-all duration-200 min-h-[40px] px-4 text-sm"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Eliminar contribuyente</span>
              <span className="sm:hidden">Eliminar</span>
            </Button>
          </div>
        )}
      </Card>

      <div className="mt-6 sm:mt-8 border-t border-slate-700/60 pt-6 sm:pt-8">
      <Card className="bg-slate-800 border-slate-700 transition-all duration-200 hover:border-slate-600 hover:shadow-md rounded-lg overflow-hidden">
        <div className="px-4 pt-4 sm:px-6 sm:pt-5 border-b border-slate-700/50 pb-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Historial del expediente
          </h2>
          <p className="text-xs text-slate-500 mt-1 hidden sm:block">
            Multas y eventos, reportes de IVA e ISLR en pestañas.
          </p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full p-4 sm:p-6 pt-4">
          <div className="mb-4">
            <CaseSelector
              cases={cases}
              selectedCaseId={selectedCaseId}
              onSelect={setSelectedCaseId}
              onCreateCase={() => navigate(`/taxpayer/${taxpayer}/cases/new`)}
            />
          </div>
          <TabsList className="bg-slate-900 border-slate-700 grid w-full grid-cols-3 h-auto flex-wrap gap-1 p-1">
            <TabsTrigger 
              value="fine" 
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300 text-xs sm:text-sm min-h-[44px] py-2 touch-manipulation"
            >
              <Package className="h-4 w-4 mr-1 sm:mr-2 shrink-0" />
              <span className="truncate">Multas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="iva" 
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300 text-xs sm:text-sm min-h-[44px] py-2 touch-manipulation"
            >
              <Receipt className="h-4 w-4 mr-1 sm:mr-2 shrink-0" />
              <span className="truncate">IVA</span>
            </TabsTrigger>
            <TabsTrigger 
              value="islr" 
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300 text-xs sm:text-sm min-h-[44px] py-2 touch-manipulation"
            >
              <FileSearch className="h-4 w-4 mr-1 sm:mr-2 shrink-0" />
              <span className="truncate">ISLR</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fine" className="mt-4">
            {filteredEvents.length > 0 ? (
              <div className="overflow-x-auto">
                <EventTable
                  rows={filteredEvents}
                  setRows={setEvents}
                  canEdit={user.role === 'ADMIN' || isAssignedFiscal}
                />
              </div>
            ) : (
              <EmptyState 
                title="No hay eventos registrados" 
                message="Agrega multas, avisos o pagos para ver el historial"
              />
            )}
          </TabsContent>

          <TabsContent value="iva" className="mt-4">
            {taxSummary.length > 0 ? (
              <div className="overflow-x-auto">
                <TaxSummaryTable
                  rows={taxSummary}
                  setRows={setTaxSummary}
                  canEdit={user.role === 'ADMIN' || isAssignedFiscal}
                />
              </div>
            ) : (
              <EmptyState 
                title="No hay reportes de IVA" 
                message="Agrega reportes de IVA para ver el historial"
              />
            )}
          </TabsContent>

          <TabsContent value="islr" className="mt-4">
            {islrReports.length > 0 ? (
              <div className="overflow-x-auto">
                <ISLRSummaryTable
                  rows={islrReports}
                  setRows={setIslrReports}
                  canEdit={user.role === 'ADMIN' || isAssignedFiscal}
                />
              </div>
            ) : (
              <EmptyState 
                title="No hay reportes de ISLR" 
                message="Agrega declaraciones de ISLR para ver el historial"
              />
            )}
          </TabsContent>
        </Tabs>
      </Card>
      </div>

      {/* Diálogo de confirmación — eliminar contribuyente */}
      <Dialog open={showDeleteConfirm} onOpenChange={(open) => !isDeleting && setShowDeleteConfirm(open)}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-left pr-8 text-rose-400">
              <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 shrink-0">
                <Trash2 className="h-4 w-4" />
              </div>
              Eliminar contribuyente
            </DialogTitle>
            <DialogDescription className="text-slate-400 mt-2">
              Esta acción es <span className="text-rose-400 font-semibold">permanente e irreversible</span>.
              Se eliminarán todos los datos del expediente, incluyendo eventos, reportes de IVA e ISLR.
            </DialogDescription>
          </DialogHeader>

          {taxpayerData && (
            <div className="rounded-xl bg-slate-800/80 border border-slate-700/60 p-4 space-y-1 my-1">
              <p className="text-sm font-semibold text-white">{taxpayerData.name}</p>
              <p className="text-xs text-slate-400 font-mono">{taxpayerData.rif}</p>
            </div>
          )}

          <p className="text-sm text-slate-300">
            ¿Estás seguro de que deseas continuar?
          </p>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl min-h-[42px] transition-colors"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDeleteTaxpayer}
              disabled={isDeleting}
              className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-600/40 text-white font-semibold rounded-xl min-h-[42px] flex items-center justify-center gap-2 transition-colors"
            >
              {isDeleting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Sí, eliminar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPerformanceChart} onOpenChange={setShowPerformanceChart}>
        <DialogContent className="max-w-4xl bg-slate-900 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-left pr-8">
              <BarChart3 className="h-5 w-5 text-amber-400 shrink-0" aria-hidden />
              <span>Gráficos del contribuyente</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Tortas de proporción IVA y de eventos del expediente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
              <h4 className="text-sm font-semibold text-slate-200 mb-1">Compras vs ventas (IVA acumulado)</h4>
              <p className="text-xs text-slate-500 mb-3">Proporción entre montos totales de compras y ventas en todos los reportes.</p>
              {ivaPieData.length > 0 ? (
                <>
                <div className="w-full h-[260px] sm:h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ivaPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={isSmUp ? 100 : 88}
                        paddingAngle={2}
                        label={
                          isSmUp
                            ? ({ name, percent }) =>
                                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                            : false
                        }
                      >
                        {ivaPieData.map((entry, index) => (
                          <Cell key={`iva-cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#e2e8f0',
                        }}
                        formatter={(value: number | string) => currencyFormatter(Number(value))}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex flex-col gap-2 border-t border-slate-700/80 pt-3 text-xs text-slate-400 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
                  <span>
                    Total compras:{' '}
                    <strong className="text-sky-300 tabular-nums">{currencyFormatter(ivaTotals.compras)}</strong>
                  </span>
                  <span>
                    Total ventas:{' '}
                    <strong className="text-emerald-300 tabular-nums">{currencyFormatter(ivaTotals.ventas)}</strong>
                  </span>
                </div>
                </>
              ) : (
                <EmptyState
                  title="Sin datos de IVA"
                  message="Agrega reportes de IVA para visualizar la proporción compras/ventas."
                />
              )}
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
              <h4 className="text-sm font-semibold text-slate-200 mb-3">Distribución de eventos tributarios</h4>
              {eventPieData.length > 0 ? (
                <div className="w-full h-[260px] sm:h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={eventPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={44}
                        outerRadius={isSmUp ? 96 : 84}
                        paddingAngle={2}
                        label={
                          isSmUp ? ({ name, value }) => `${name}: ${value}` : false
                        }
                      >
                        {eventPieData.map((entry, index) => (
                          <Cell key={`ev-cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#e2e8f0',
                        }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  title="Sin eventos registrados"
                  message="Crea avisos, multas o compromisos para ver la distribución por tipo."
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
