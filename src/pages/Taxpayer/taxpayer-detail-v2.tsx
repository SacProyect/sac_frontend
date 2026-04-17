import { useMemo, useState } from 'react';
import { useParams, useNavigate, useLoaderData, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  AlertTriangle, 
  DollarSign, 
  FileText, 
  Package,
  Receipt,
  FileSearch,
  BarChart3
} from 'lucide-react';
import { IndividualStats } from '@/components/stats/individual-stats';
import EventTable from '@/components/Events/event-table';
import TaxSummaryTable from '@/components/iva/tax-summary-table';
import ISLRSummaryTable from '@/components/ISLR/islr-summary-table';
import { Event } from '@/types/event';
import { IVAReports } from '@/types/iva-reports';
import { ISLRReports } from '@/types/islr-reports';
import { Fines } from '@/pages/router';
import { Payment } from '@/types/payment';
import { PageHeader, EmptyState } from '@/components/UI/v2';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/UI/dialog';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import toast from 'react-hot-toast';
import { deleteTaxpayer } from '@/components/utils/api/taxpayer-functions';
import { Button } from '@/components/UI/button';
import { Card } from '@/components/UI/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/UI/tabs';

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
  } = useLoaderData() as { 
    events: Event[]; 
    fines: Fines; 
    payments: Payment; 
    taxSummary: IVAReports[]; 
    islrReports: ISLRReports[];
    taxpayerData: any;
  };

  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [taxSummary, setTaxSummary] = useState<IVAReports[]>(initialTaxSummary);
  const [islrReports, setIslrReports] = useState<ISLRReports[]>(initialIslrReports);
  const [activeTab, setActiveTab] = useState('fine');
  const [showPerformanceChart, setShowPerformanceChart] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isMyTaxpayer = user?.taxpayer?.some(t => t.id === taxpayer) || taxpayerData?.user?.id === user?.id;
  const canSeeAllOptions = user.role === "ADMIN" || isMyTaxpayer;
  const isHighRole = user.role === 'ADMIN' || user.role === 'COORDINATOR' || user.role === 'SUPERVISOR';
  const isAssignedFiscal =
    user.role === 'FISCAL' &&
    (taxpayerData?.officerId === user.id || taxpayerData?.user?.id === user.id || isMyTaxpayer);
  const canDeleteTaxpayer = isHighRole || isAssignedFiscal;

  const handleDeleteTaxpayer = async () => {
    if (!taxpayer || isDeleting || !canDeleteTaxpayer) return;

    try {
      setIsDeleting(true);
      const res = await deleteTaxpayer(taxpayer);
      if (!res) {
        toast.error('No se pudo eliminar el contribuyente.');
        return;
      }
      toast.success('Contribuyente eliminado correctamente.');
      setDeleteConfirmOpen(false);
      navigate('/admin');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo eliminar el contribuyente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const quickActions = [
    { name: 'Aviso', path: `/warning/${taxpayer}`, icon: Bell, color: 'bg-blue-600 hover:bg-blue-700' },
    { name: 'Multa', path: `/fine/${taxpayer}`, icon: AlertTriangle, color: 'bg-red-600 hover:bg-red-700' },
    { name: 'Pago', path: `/payment/${taxpayer}`, icon: DollarSign, color: 'bg-green-600 hover:bg-green-700' },
    { name: 'Compromiso de pago', path: `/payment_compromise/${taxpayer}`, icon: FileText, color: 'bg-purple-600 hover:bg-purple-700' },
    {
      name: 'Gráficos',
      icon: BarChart3,
      color: 'bg-amber-600 hover:bg-amber-700',
      onClick: () => setShowPerformanceChart(true),
    },
    // { name: 'Observaciones', path: `/observations/${taxpayer}`, icon: Eye, color: 'bg-slate-600 hover:bg-slate-700' },
  ].filter((opt) => canSeeAllOptions || opt.name === 'Observaciones' || opt.name === 'Gráficos');

  const performanceChartData = useMemo(() => {
    if (!taxSummary?.length) return [];

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const sorted = [...taxSummary].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return sorted.map((report) => {
      const reportDate = new Date(report.date);
      return {
        period: `${monthNames[reportDate.getMonth()]} ${reportDate.getFullYear()}`,
        compras: Number(report.purchases) || 0,
        ventas: Number(report.sells) || 0,
      };
    });
  }, [taxSummary]);

  const eventTypeChartData = useMemo(() => {
    if (!events?.length) return [];

    const totalsByType: Record<string, { label: string; cantidad: number; monto: number }> = {
      WARNING: { label: 'Avisos', cantidad: 0, monto: 0 },
      FINE: { label: 'Multas', cantidad: 0, monto: 0 },
      PAYMENT_COMPROMISE: { label: 'Compromisos', cantidad: 0, monto: 0 },
    };

    events.forEach((event) => {
      const key = String(event.type) as keyof typeof totalsByType;
      if (!totalsByType[key]) return;

      totalsByType[key].cantidad += 1;
      totalsByType[key].monto += Number(event.amount) || 0;
    });

    return Object.values(totalsByType).filter((item) => item.cantidad > 0);
  }, [events]);

  const currencyFormatter = (value: number) =>
    new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <div className="space-y-4 sm:space-y-5 w-full max-w-full overflow-x-hidden">
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
      </Card>

      <Card className="bg-slate-800 border-slate-700 transition-all duration-200 hover:border-slate-600 hover:shadow-md rounded-lg overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
            {events.length > 0 ? (
              <div className="overflow-x-auto">
                <EventTable rows={events} setRows={setEvents} />
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
                <TaxSummaryTable rows={taxSummary} setRows={setTaxSummary} />
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
                <ISLRSummaryTable rows={islrReports} setRows={setIslrReports} />
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

      <Dialog open={showPerformanceChart} onOpenChange={setShowPerformanceChart}>
        <DialogContent className="max-w-4xl bg-slate-900 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle>Gráficos de Rendimiento del Contribuyente</DialogTitle>
            <DialogDescription className="text-slate-400">
              Comparativas clave de actividad tributaria con datos de IVA y eventos del expediente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
              <h4 className="text-sm font-semibold text-slate-200 mb-3">Compras vs Ventas (IVA por período)</h4>
              {performanceChartData.length > 0 ? (
                <div className="w-full h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceChartData} margin={{ top: 8, right: 18, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="period" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" tickFormatter={(value) => currencyFormatter(Number(value))} />
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
                      <Bar dataKey="compras" fill="#0ea5e9" name="Compras (Bs.)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="ventas" fill="#22c55e" name="Ventas (Bs.)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  title="Sin datos de IVA"
                  message="Agrega reportes de IVA para visualizar compras y ventas por período."
                />
              )}
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
              <h4 className="text-sm font-semibold text-slate-200 mb-3">Distribución de Eventos Tributarios</h4>
              {eventTypeChartData.length > 0 ? (
                <div className="w-full h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={eventTypeChartData} margin={{ top: 8, right: 18, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="label" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" allowDecimals={false} />
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
                      <Bar dataKey="cantidad" fill="#f59e0b" name="Cantidad de eventos" radius={[6, 6, 0, 0]} />
                    </BarChart>
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
