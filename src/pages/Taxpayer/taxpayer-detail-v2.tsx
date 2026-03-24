import { useState, useCallback } from 'react';
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
  Eye,
  Package,
  Receipt,
  FileSearch
} from 'lucide-react';
import { IndividualStats, type TaxpayerDetailViewer, type TaxpayerData } from '@/components/stats/individual-stats';
import EventTable from '@/components/Events/event-table';
import TaxSummaryTable from '@/components/iva/tax-summary-table';
import ISLRSummaryTable from '@/components/ISLR/islr-summary-table';
import { Event } from '@/types/event';
import { IVAReports } from '@/types/iva-reports';
import { ISLRReports } from '@/types/islr-reports';
import { Fines } from '@/pages/router';
import { Payment } from '@/types/payment';
import { PageHeader, EmptyState } from '@/components/UI/v2';

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
    islrReports: initialIslrReports 
  } = useLoaderData() as { 
    events: Event[]; 
    fines: Fines; 
    payments: Payment; 
    taxSummary: IVAReports[]; 
    islrReports: ISLRReports[] 
  };

  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [taxSummary, setTaxSummary] = useState<IVAReports[]>(initialTaxSummary);
  const [islrReports, setIslrReports] = useState<ISLRReports[]>(initialIslrReports);
  const [activeTab, setActiveTab] = useState('fine');
  /** Capacidades del backend (`viewer` en GET /taxpayer/data/:id); alineado admin/fiscal/coord/supervisor */
  const [detailViewer, setDetailViewer] = useState<TaxpayerDetailViewer | null>(null);

  const onTaxpayerDataLoaded = useCallback((data: TaxpayerData) => {
    if (data.viewer) setDetailViewer(data.viewer);
  }, []);

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Acciones rápidas: mismo criterio que el admin cuando el backend autoriza (`viewer`)
  const canSeeAllOptions =
    user.role === 'ADMIN' ||
    user.role === 'COORDINATOR' ||
    detailViewer?.canUseQuickActions === true;

  const canManageObservations =
    user.role === 'ADMIN' ||
    user.role === 'COORDINATOR' ||
    detailViewer?.canManageObservations === true;

  const quickActions = [
    { name: 'Aviso', path: `/warning/${taxpayer}`, icon: Bell, color: 'bg-blue-600 hover:bg-blue-700' },
    { name: 'Multa', path: `/fine/${taxpayer}`, icon: AlertTriangle, color: 'bg-red-600 hover:bg-red-700' },
    { name: 'Pago', path: `/payment/${taxpayer}`, icon: DollarSign, color: 'bg-green-600 hover:bg-green-700' },
    { name: 'Compromiso de pago', path: `/payment_compromise/${taxpayer}`, icon: FileText, color: 'bg-purple-600 hover:bg-purple-700' },
    { name: 'Observaciones', path: `/observations/${taxpayer}`, icon: Eye, color: 'bg-slate-600 hover:bg-slate-700' },
  ].filter(
    (opt) =>
      canSeeAllOptions ||
      (opt.name === 'Observaciones' && canManageObservations),
  );

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <PageHeader
        title="Detalle del Contribuyente"
        description="Información completa y gestión de eventos"
      />

      <IndividualStats
        events={events}
        IVAReports={taxSummary}
        onTaxpayerDataLoaded={onTaxpayerDataLoaded}
      />

      <Card className="bg-slate-800 border-slate-700 p-4 sm:p-6 transition-all duration-200 hover:border-slate-600 hover:shadow-md rounded-lg">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Acciones Rápidas</h3>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.name} to={action.path} className="w-full sm:w-auto min-w-0">
                <Button className={`w-full sm:w-auto ${action.color} text-white font-semibold rounded-md flex items-center justify-center gap-2 transition-all duration-200 shadow-sm min-h-[44px]`}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {action.name}
                </Button>
              </Link>
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
                <TaxSummaryTable
                  rows={taxSummary}
                  setRows={setTaxSummary}
                  canEditReports={detailViewer?.canUseQuickActions === true}
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
                  canEditReports={detailViewer?.canUseQuickActions === true}
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
  );
}
